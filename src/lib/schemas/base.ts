/**
 * Base Zod schemas shared across the application.
 * These are the foundation schemas used by both layer components and animation data.
 * Extracted here to avoid circular dependencies and reduce duplication.
 */
import { fieldRegistry } from '$lib/layers/properties/field-registry';
import type { PropertyGroup } from '$lib/layers/registry';
import type { Paths } from 'type-fest';
import { z } from 'zod';

// ============================================
// Anchor Point
// ============================================

/**
 * Anchor point options for layer positioning.
 * Determines which point of the layer is positioned at the transform x/y coordinates.
 */
export const AnchorPointSchema = z.enum([
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
]);

export type AnchorPoint = z.infer<typeof AnchorPointSchema>;

// ============================================
// Transform
// ============================================

/**
 * Transform properties for positioning, rotating, and scaling layers in 3D space.
 * These properties can be animated via keyframes.
 *
 * Uses nested structure to match AnimatableProperty convention:
 * - position.x, position.y, position.z
 * - rotation.x, rotation.y, rotation.z
 * - scale.x, scale.y
 *
 * Supports both old flat format (x, y, z, rotationX, rotationY, rotationZ, scaleX, scaleY, anchor)
 * and new nested format (position, rotation, scale, anchor).
 * Old format is automatically converted to new format on parse.
 */
export const CleanTransformSchema = z.object({
  // New nested format
  position: z
    .object({
      x: z.number().describe('Position X'),
      y: z.number().describe('Position Y'),
      z: z.number().describe('Position Z (depth)')
    })
    .optional(),
  rotation: z
    .object({
      x: z.number().describe('Rotation X (radians)'),
      y: z.number().describe('Rotation Y (radians)'),
      z: z.number().describe('Rotation Z (radians)')
    })
    .optional(),
  scale: z
    .object({
      x: z.number().min(0).describe('Scale X'),
      y: z.number().min(0).describe('Scale Y')
    })
    .optional(),
  anchor: AnchorPointSchema.describe('Anchor point').optional().default('center')
});

export const TransformSchema = CleanTransformSchema.extend({
  // Old flat format (legacy support)
  x: z.number().describe('Position X').optional(),
  y: z.number().describe('Position Y').optional(),
  z: z.number().describe('Position Z (depth)').optional(),
  rotationX: z.number().describe('Rotation X (radians)').optional(),
  rotationY: z.number().describe('Rotation Y (radians)').optional(),
  rotationZ: z.number().describe('Rotation Z (radians)').optional(),
  scaleX: z.number().min(0).describe('Scale X').optional(),
  scaleY: z.number().min(0).describe('Scale Y').optional()
})
  .superRefine((data, ctx) => {
    const hasNewFormat = data.position || data.rotation || data.scale;
    const hasOldFormat =
      data.x !== undefined ||
      data.y !== undefined ||
      data.z !== undefined ||
      data.rotationX !== undefined ||
      data.rotationY !== undefined ||
      data.rotationZ !== undefined ||
      data.scaleX !== undefined ||
      data.scaleY !== undefined;

    // If neither format is provided, error
    if (!hasNewFormat && !hasOldFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Transform must have either new format (position/rotation/scale) or old flat format'
      });
      return;
    }

    // If both formats are provided, prefer new format but warn
    if (hasNewFormat && hasOldFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both old and new format detected, using new format'
      });
    }
  })
  .transform((data) => {
    // Convert old flat format to new nested format
    return {
      position: data.position ?? {
        x: data.x ?? 0,
        y: data.y ?? 0,
        z: data.z ?? 0
      },
      rotation: data.rotation ?? {
        x: data.rotationX ?? 0,
        y: data.rotationY ?? 0,
        z: data.rotationZ ?? 0
      },
      scale: data.scale ?? {
        x: data.scaleX ?? 1,
        y: data.scaleY ?? 1
      },
      anchor: data.anchor ?? 'center'
    };
  });

export type Transform = z.infer<typeof TransformSchema>;

export function defaultTransform(): Transform {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1 },
    anchor: 'center'
  };
}

// ============================================
// Style
// ============================================

/**
 * Base style properties shared by all layers.
 * Contains opacity and CSS filter properties (blur, brightness, contrast, etc.)
 */
export const LayerStyleSchema = z.object({
  opacity: z
    .number()
    .min(0)
    .max(1)
    .multipleOf(0.01)
    .default(1)
    .describe('Opacity (0-1)')
    .register(fieldRegistry, { interpolationFamily: 'continuous' }),
  // CSS filter properties
  blur: z
    .number()
    .min(0)
    .default(0)
    .describe('Blur (px)')
    .register(fieldRegistry, { group: 'filters-1', interpolationFamily: 'continuous' }),
  brightness: z
    .number()
    .min(0)
    .max(10)
    .default(1)
    .describe('Brightness')
    .register(fieldRegistry, { group: 'filters-1', interpolationFamily: 'continuous' }),
  contrast: z
    .number()
    .min(0)
    .max(10)
    .multipleOf(0.1)
    .default(1)
    .describe('Contrast')
    .register(fieldRegistry, { group: 'filters-2', interpolationFamily: 'continuous' }),
  saturate: z
    .number()
    .min(0)
    .max(10)
    .multipleOf(0.1)
    .default(1)
    .describe('Saturate')
    .register(fieldRegistry, { group: 'filters-2', interpolationFamily: 'continuous' }),
  // CSS drop-shadow filter
  dropShadowX: z
    .number()
    .default(0)
    .describe('Shadow offset X (px)')
    .register(fieldRegistry, { group: 'shadow-offset', interpolationFamily: 'continuous' }),
  dropShadowY: z
    .number()
    .default(0)
    .describe('Shadow offset Y (px)')
    .register(fieldRegistry, { group: 'shadow-offset', interpolationFamily: 'continuous' }),
  dropShadowBlur: z
    .number()
    .min(0)
    .default(0)
    .describe('Shadow blur (px)')
    .register(fieldRegistry, { group: 'shadow-style', interpolationFamily: 'continuous' }),
  dropShadowColor: z
    .string()
    .default('transparent')
    .describe('Shadow color')
    .register(fieldRegistry, {
      group: 'shadow-style',
      interpolationFamily: 'discrete',
      widget: 'color'
    })
});

export const stylePropertyGroups: PropertyGroup[] = [
  {
    id: 'filters-1',
    label: 'Filters'
  },
  {
    id: 'filters-2',
    label: 'Filters'
  },
  {
    id: 'shadow-offset',
    label: 'Shadow Offset'
  },
  {
    id: 'shadow-style',
    label: 'Shadow Style'
  }
];

export type LayerStyle = z.infer<typeof LayerStyleSchema>;

export function defaultLayerStyle(): LayerStyle {
  return {
    opacity: 1,
    blur: 0,
    brightness: 1,
    contrast: 1,
    saturate: 1,
    dropShadowX: 0,
    dropShadowY: 0,
    dropShadowBlur: 0,
    dropShadowColor: 'transparent'
  };
}

// ============================================
// Base Layer Fields
// ============================================

/**
 * Core fields present in all layers.
 * These are the fundamental properties every layer must have.
 */
export const BaseLayerFieldsSchema = z.object({
  id: z.string().describe('Unique layer identifier'),
  name: z.string().describe('Layer name for identification'),
  visible: z.boolean().describe('Layer visibility state'),
  locked: z.boolean().describe('Layer locked state (prevents editing)'),
  parentId: z.string().optional().describe('Parent group layer ID')
});

export type BaseLayerFields = z.infer<typeof BaseLayerFieldsSchema>;

// ============================================
// Type-safe preset system
// ============================================

/**
 * Animatable transform properties - auto-inferred from Transform type
 * Excludes 'anchor' and parent objects, only includes leaf paths (e.g., 'position.x')
 */
export type TransformProperty = Extract<Paths<Transform>, `${string}.${string}`>;

/**
 * Animatable style properties - extracted from LayerStyle type
 */
export type StyleProperty = keyof LayerStyle;

/**
 * All base animatable properties (transform + style)
 */
export type BaseAnimatableProperty = TransformProperty | StyleProperty;

export const BaseAnimatablePropertyLabels: Record<BaseAnimatableProperty, string> = {
  'position.x': 'Position X',
  'position.y': 'Position Y',
  'position.z': 'Position Z',
  'rotation.x': 'Rotation X',
  'rotation.y': 'Rotation Y',
  'rotation.z': 'Rotation Z',
  'scale.x': 'Scale X',
  'scale.y': 'Scale Y',
  opacity: 'Opacity',
  blur: 'Blur',
  brightness: 'Brightness',
  contrast: 'Contrast',
  saturate: 'Saturate',
  dropShadowBlur: 'Drop Shadow Blur',
  dropShadowColor: 'Drop Shadow Color',
  dropShadowX: 'Drop Shadow X',
  dropShadowY: 'Drop Shadow Y'
};

export const ContinuousInterpolationStrategies = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  // Quad
  'ease-in-quad',
  'ease-out-quad',
  'ease-in-out-quad',
  // Cubic
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
  // Quart
  'ease-in-quart',
  'ease-out-quart',
  'ease-in-out-quart',
  // Quint
  'ease-in-quint',
  'ease-out-quint',
  'ease-in-out-quint',
  // Sine
  'ease-in-sine',
  'ease-out-sine',
  'ease-in-out-sine',
  // Expo
  'ease-in-expo',
  'ease-out-expo',
  'ease-in-out-expo',
  // Circ
  'ease-in-circ',
  'ease-out-circ',
  'ease-in-out-circ',
  // Back (overshoots)
  'ease-in-back',
  'ease-out-back',
  'ease-in-out-back',
  // Bounce
  'ease-in-bounce',
  'ease-out-bounce',
  'ease-in-out-bounce',
  // Elastic
  'ease-in-elastic',
  'ease-out-elastic',
  'ease-in-out-elastic'
];

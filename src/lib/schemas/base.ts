/**
 * Base Zod schemas shared across the application.
 * These are the foundation schemas used by both layer components and animation data.
 * Extracted here to avoid circular dependencies and reduce duplication.
 */
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
export const TransformSchema = z
  .object({
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
    anchor: AnchorPointSchema.describe('Anchor point').optional(),
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
  opacity: z.number().min(0).max(1).default(1).describe('Opacity (0-1)'),
  // CSS filter properties
  blur: z.number().min(0).default(0).describe('Blur (px)'),
  brightness: z.number().min(0).max(10).default(1).describe('Brightness'),
  contrast: z.number().min(0).max(10).default(1).describe('Contrast'),
  saturate: z.number().min(0).max(10).default(1).describe('Saturate'),
  // CSS drop-shadow filter
  dropShadowX: z.number().default(0).describe('Shadow offset X (px)'),
  dropShadowY: z.number().default(0).describe('Shadow offset Y (px)'),
  dropShadowBlur: z.number().min(0).default(0).describe('Shadow blur (px)'),
  dropShadowColor: z.string().default('transparent').describe('Shadow color')
});

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

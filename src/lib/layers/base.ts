/**
 * Base infrastructure for layer components
 */
import { z } from 'zod';
import type { Component } from 'svelte';
import type { LayerMeta } from './registry';
import {
  AnchorPointSchema,
  TransformSchema,
  LayerStyleSchema,
  BaseLayerFieldsSchema,
  type AnchorPoint,
  type Transform,
  type LayerStyle
} from '$lib/schemas/base';
import type { Layer } from '$lib/schemas/animation';

/**
 * Per-field UI metadata that layer schemas can opt into via .register(fieldRegistry, …).
 * Keeps UI-rendering hints out of validation logic and out of .describe() strings.
 */
export type FieldMeta = {
  hidden?: boolean;
  readOnly?: boolean;
  /** Assign this field to a property group (e.g., 'size') for grouped rendering */
  group?: string;
} & (
  | {
      /** Override the default input widget rendered for this field */
      widget?: 'textarea' | 'background';
    }
  | {
      widget: 'upload';
      mediaType: 'image' | 'video' | 'audio';
    }
  | {
      widget: 'custom';
      component: Component<{ value: unknown; onChange: (value: unknown) => void; layer: Layer }>;
    }
);

/**
 * Global registry for FieldMeta.  Individual schema fields call
 *   .register(fieldRegistry, { widget: 'textarea' })
 * to opt into a non-default widget.
 */
export const fieldRegistry = z.registry<FieldMeta>();

// Re-export shared schemas for convenience (with backward-compatible aliases)
export { AnchorPointSchema };
export { TransformSchema as BaseTransformSchema };
export { LayerStyleSchema as BaseStyleSchema };

/**
 * Complete base schema for all layers.
 * Combines base fields with transform and style properties.
 */
export const BaseLayerSchema = BaseLayerFieldsSchema.extend({
  transform: TransformSchema,
  style: LayerStyleSchema
});

// Export types with backward-compatible names
export type BaseTransform = Transform;
export type BaseStyle = LayerStyle;
export type BaseLayerProps = z.infer<typeof BaseLayerSchema>;

/**
 * Layer component definition with schema and component
 */
export interface LayerComponentDefinition extends LayerMeta {
  /**
   * The Svelte component that renders this layer
   */
  component: Component;
}

/**
 * Extract property metadata from a Zod schema for dynamic UI generation
 */
export type PropertyMetadata = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'background';
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string }>;
  /**
   * How this property should be interpolated between keyframes
   * - 'number': Linear interpolation
   * - 'color': RGB color interpolation
   * - 'text': Character-by-character text reveal
   * - 'discrete': Jump to new value (no smooth transition)
   * - 'background': Background/gradient interpolation (discrete for now)
   */
  interpolationType: 'number' | 'color' | 'text' | 'discrete' | 'background';
  meta?: FieldMeta;
};

/**
 * Unwrap ZodDefault and ZodOptional to get the inner type
 */
function unwrapZodType(zodType: z.ZodType): z.ZodType {
  let current = zodType;

  // Unwrap ZodDefault and ZodOptional to get to the base type
  while (current instanceof z.ZodDefault || current instanceof z.ZodOptional) {
    current = current.unwrap() as z.ZodType;
  }
  return current;
}

/**
 * Extract property metadata from a Zod schema for UI generation
 * Uses Zod 4 internals (_zod.def) as there's no public API for this
 */
export function extractPropertyMetadata(schema: z.ZodType): PropertyMetadata[] {
  const metadata: PropertyMetadata[] = [];

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;

    for (const [key, value] of Object.entries(shape)) {
      const zodType = value;
      const unwrapped = unwrapZodType(zodType);

      const propertiesMeta: PropertyMetadata = {
        name: key,
        type: 'string',
        interpolationType: 'discrete', // Default to discrete (no interpolation),
        // THis is ok, dont change zodType.meta()?.description
        description: zodType.meta()?.description
      };

      // Determine type and interpolation type
      if (unwrapped instanceof z.ZodNumber) {
        propertiesMeta.type = 'number';
        propertiesMeta.interpolationType = 'number'; // Numbers can be interpolated

        const min = unwrapped.def.checks?.find((check) => check._zod.def.check === 'greater_than');
        if (min && 'value' in min._zod.def) {
          propertiesMeta.min = min._zod.def.value as number;
        }
        const max = unwrapped.def.checks?.find((check) => check._zod.def.check === 'less_than');
        if (max && 'value' in max._zod.def) {
          propertiesMeta.max = max._zod.def.value as number;
        }
      } else if (unwrapped instanceof z.ZodBoolean) {
        propertiesMeta.type = 'boolean';
        propertiesMeta.interpolationType = 'discrete'; // Booleans jump between values
      } else if (unwrapped instanceof z.ZodUnion) {
        // Check if this is a BackgroundValue union (solid, linear, radial, conic)
        const options = unwrapped.options as z.ZodType[];
        const isBackgroundUnion = options.every((opt) => {
          if (opt instanceof z.ZodObject) {
            const typeField = (opt.shape as Record<string, z.ZodType>)['type'];
            if (typeField instanceof z.ZodLiteral) {
              const val = typeField.value;
              return ['solid', 'linear', 'radial', 'conic'].includes(val as string);
            }
          }
          return false;
        });

        if (isBackgroundUnion) {
          propertiesMeta.type = 'background';
          propertiesMeta.interpolationType = 'discrete'; // Backgrounds use discrete interpolation for now
        } else {
          propertiesMeta.type = 'string';
          propertiesMeta.interpolationType = 'discrete';
        }
      } else if (unwrapped instanceof z.ZodString) {
        propertiesMeta.type = 'string';
        propertiesMeta.interpolationType = 'discrete'; // Strings jump between values

        // Check if it's a color by convention (field name contains 'color')
        if (key.toLowerCase().includes('color')) {
          propertiesMeta.type = 'color';
          propertiesMeta.interpolationType = 'color'; // Colors can be interpolated
        }
        // Check if it's text content (for character-by-character animation)
        else if (key === 'content' || key === 'text') {
          propertiesMeta.interpolationType = 'text'; // Text can be interpolated character by character
        }
      } else if (unwrapped instanceof z.ZodEnum) {
        propertiesMeta.type = 'select';
        propertiesMeta.interpolationType = 'discrete'; // Enums jump between values
        // Extract enum values from Zod 4 - uses 'entries' object or 'options' array
        const enumEntries = unwrapped._zod?.def?.entries;
        if (enumEntries && typeof enumEntries === 'object') {
          propertiesMeta.options = Object.keys(enumEntries).map((v) => ({
            value: v,
            label: String(v).charAt(0).toUpperCase() + String(v).slice(1)
          }));
        }
      }

      propertiesMeta.meta = fieldRegistry.get(zodType);

      metadata.push(propertiesMeta);
    }
  }

  return metadata;
}

/**
 * Extract default values from a Zod schema
 * Uses Zod's parse with an empty object to get defaults
 * Reference: https://github.com/colinhacks/zod/discussions/1953
 */
export function extractDefaultValues(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    // Parse an empty object - Zod will fill in the default values
    try {
      return schema.parse({}) as Record<string, unknown>;
    } catch {
      // If parsing fails, return empty object
      return {};
    }
  }

  return {};
}

/**
 * Get translate percentages for an anchor point
 * Returns the X and Y percentages to offset the element
 */
function getAnchorOffset(anchor: AnchorPoint): { x: string; y: string } {
  const offsets: Record<AnchorPoint, { x: string; y: string }> = {
    'top-left': { x: '0%', y: '0%' },
    'top-center': { x: '-50%', y: '0%' },
    'top-right': { x: '-100%', y: '0%' },
    'center-left': { x: '0%', y: '-50%' },
    center: { x: '-50%', y: '-50%' },
    'center-right': { x: '-100%', y: '-50%' },
    'bottom-left': { x: '0%', y: '-100%' },
    'bottom-center': { x: '-50%', y: '-100%' },
    'bottom-right': { x: '-100%', y: '-100%' }
  };
  return offsets[anchor];
}

/**
 * Generate CSS transform string from transform properties
 * Coordinate system: (0, 0) is at the CENTER of the canvas
 * The element's anchor point will be positioned at (x, y, z)
 *
 * Note: The layer element should be positioned at top-1/2 left-1/2 (center of canvas)
 * so that translate3d(0, 0, 0) places it at the canvas center.
 */
export function generateTransformCSS(transform: Transform): string {
  const { x, y, z, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ, anchor } = transform;
  const anchorOffset = getAnchorOffset(anchor);

  // Apply position offset, then anchor offset, then rotation and scale
  // The layer is already positioned at canvas center via CSS (top-1/2 left-1/2)
  return `
    translate3d(${x}px, ${y}px, ${z}px)
    translate(${anchorOffset.x}, ${anchorOffset.y})
    rotateX(${rotationX}rad)
    rotateY(${rotationY}rad)
    rotateZ(${rotationZ}rad)
    scale3d(${scaleX}, ${scaleY}, ${scaleZ})
  `
    .trim()
    .replace(/\s+/g, ' ');
}

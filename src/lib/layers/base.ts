/**
 * Base infrastructure for layer components
 */
import { z } from 'zod';
import type { Component } from 'svelte';
import type { LayerMeta } from './registry';

/**
 * Per-field UI metadata that layer schemas can opt into via .register(fieldRegistry, …).
 * Keeps UI-rendering hints out of validation logic and out of .describe() strings.
 */
export type FieldMeta = {
  /** Override the default input widget rendered for this field */
  widget?: 'textarea';
};

/**
 * Global registry for FieldMeta.  Individual schema fields call
 *   .register(fieldRegistry, { widget: 'textarea' })
 * to opt into a non-default widget.
 */
export const fieldRegistry = z.registry<FieldMeta>();

/**
 * Anchor point options for layer positioning
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

/**
 * Base transform properties shared by all layers
 */
export const BaseTransformSchema = z.object({
  x: z.number().describe('Position X'),
  y: z.number().describe('Position Y'),
  z: z.number().describe('Position Z (depth)'),
  rotationX: z.number().describe('Rotation X (radians)'),
  rotationY: z.number().describe('Rotation Y (radians)'),
  rotationZ: z.number().describe('Rotation Z (radians)'),
  scaleX: z.number().min(0).describe('Scale X'),
  scaleY: z.number().min(0).describe('Scale Y'),
  scaleZ: z.number().min(0).describe('Scale Z'),
  anchor: AnchorPointSchema.describe('Anchor point')
});

/**
 * Base style properties shared by all layers
 */
export const BaseStyleSchema = z.object({
  opacity: z.number().min(0).max(1).describe('Opacity (0-1)')
});

/**
 * Complete base schema for all layers
 */
export const BaseLayerSchema = z.object({
  id: z.string(),
  name: z.string().describe('Layer name'),
  visible: z.boolean().describe('Layer visibility'),
  locked: z.boolean().describe('Layer locked state'),
  transform: BaseTransformSchema,
  style: BaseStyleSchema
});

export type BaseTransform = z.infer<typeof BaseTransformSchema>;
export type BaseStyle = z.infer<typeof BaseStyleSchema>;
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
export interface PropertyMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'select';
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
   */
  interpolationType: 'number' | 'color' | 'text' | 'discrete';
  /**
   * UI-widget override sourced from fieldRegistry.
   * When present the panel renders this widget instead of the default for the type.
   */
  widget?: FieldMeta['widget'];
}

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

      const meta: PropertyMetadata = {
        name: key,
        type: 'string',
        interpolationType: 'discrete', // Default to discrete (no interpolation),
        // THis is ok, dont change zodType.meta()?.description
        description: zodType.meta()?.description
      };

      // Determine type and interpolation type
      if (unwrapped instanceof z.ZodNumber) {
        meta.type = 'number';
        meta.interpolationType = 'number'; // Numbers can be interpolated

        const min = unwrapped.def.checks?.find((check) => check._zod.def.check === 'greater_than');
        if (min && 'value' in min._zod.def) {
          meta.min = min._zod.def.value as number;
        }
        const max = unwrapped.def.checks?.find((check) => check._zod.def.check === 'less_than');
        if (max && 'value' in max._zod.def) {
          meta.max = max._zod.def.value as number;
        }
      } else if (unwrapped instanceof z.ZodBoolean) {
        meta.type = 'boolean';
        meta.interpolationType = 'discrete'; // Booleans jump between values
      } else if (unwrapped instanceof z.ZodString) {
        meta.type = 'string';
        meta.interpolationType = 'discrete'; // Strings jump between values

        // Check if it's a color by convention (field name contains 'color')
        if (
          key.toLowerCase().includes('color') ||
          key.toLowerCase().includes('fill') ||
          key.toLowerCase().includes('stroke')
        ) {
          meta.type = 'color';
          meta.interpolationType = 'color'; // Colors can be interpolated
        }
        // Check if it's text content (for character-by-character animation)
        else if (key === 'content' || key === 'text') {
          meta.interpolationType = 'text'; // Text can be interpolated character by character
        }
      } else if (unwrapped instanceof z.ZodEnum) {
        meta.type = 'select';
        meta.interpolationType = 'discrete'; // Enums jump between values
        // Extract enum values from Zod 4 - uses 'entries' object or 'options' array
        const enumEntries = unwrapped._zod?.def?.entries;
        if (enumEntries && typeof enumEntries === 'object') {
          meta.options = Object.keys(enumEntries).map((v) => ({
            value: v,
            label: String(v).charAt(0).toUpperCase() + String(v).slice(1)
          }));
        }
      }

      // Pull in any UI-widget override registered via fieldRegistry
      const fieldMeta = fieldRegistry.get(zodType);
      if (fieldMeta?.widget) {
        meta.widget = fieldMeta.widget;
      }

      metadata.push(meta);
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
function getAnchorOffset(anchor: z.infer<typeof AnchorPointSchema>): { x: string; y: string } {
  const offsets: Record<z.infer<typeof AnchorPointSchema>, { x: string; y: string }> = {
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
export function generateTransformCSS(transform: BaseTransform): string {
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

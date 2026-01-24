/**
 * Base infrastructure for layer components
 */
import { z } from 'zod';
import type { Component } from 'svelte';

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
  scaleZ: z.number().min(0).describe('Scale Z')
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
export interface LayerComponentDefinition<
  T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>
> {
  /**
   * Unique identifier for this layer type
   */
  type: string;

  /**
   * Display name for UI
   */
  displayName: string;

  /**
   * Icon component or name
   */
  icon?: string;

  /**
   * Zod schema for this layer's custom properties
   * This schema is merged with BaseLayerSchema at runtime
   */
  customPropsSchema: T;

  /**
   * The Svelte component that renders this layer
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: Component<any>;
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
   * - 'discrete': Jump to new value (no smooth transition)
   */
  interpolationType: 'number' | 'color' | 'discrete';
}

// Type helpers for accessing Zod 4 internals in a type-safe way
// Note: In Zod 4, internals moved from _def to _zod.def
// Reference: https://zod.dev/v4/changelog
interface ZodInternals {
  def: {
    innerType?: z.ZodType;
    description?: string;
    checks?: Array<{ kind: string; value?: number }>;
    values?: readonly (string | number)[];
    defaultValue?: () => unknown;
  };
}

/**
 * Unwrap ZodDefault and ZodOptional to get the inner type
 */
function unwrapZodType(zodType: z.ZodType): z.ZodType {
  let current = zodType;
  // Unwrap ZodDefault and ZodOptional to get to the base type
  while (current instanceof z.ZodDefault || current instanceof z.ZodOptional) {
    const internals = (current as unknown as { _zod: ZodInternals })._zod;
    if (internals.def.innerType) {
      current = internals.def.innerType;
    } else {
      break;
    }
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
        interpolationType: 'discrete' // Default to discrete (no interpolation)
      };

      // Extract description from Zod 4 internals
      const internals = unwrapped as unknown as { _zod: ZodInternals };
      if (internals._zod?.def.description) {
        meta.description = internals._zod.def.description;
      }

      // Determine type and interpolation type
      if (unwrapped instanceof z.ZodNumber) {
        meta.type = 'number';
        meta.interpolationType = 'number'; // Numbers can be interpolated

        // Extract min/max from checks in Zod 4
        const checks = internals._zod?.def.checks || [];
        for (const check of checks) {
          if (check.kind === 'min' && check.value !== undefined) {
            meta.min = check.value;
          } else if (check.kind === 'max' && check.value !== undefined) {
            meta.max = check.value;
          }
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
      } else if (unwrapped instanceof z.ZodEnum) {
        meta.type = 'select';
        meta.interpolationType = 'discrete'; // Enums jump between values
        // Extract enum values from Zod 4 internals
        if (internals._zod?.def.values) {
          meta.options = Array.from(internals._zod.def.values).map((v) => ({
            value: v,
            label: String(v).charAt(0).toUpperCase() + String(v).slice(1)
          }));
        }
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
 * Generate CSS transform string from transform properties
 * Coordinate system: (0, 0) is at the CENTER of the canvas
 * The element's center will be positioned at (x, y, z)
 */
export function generateTransformCSS(transform: BaseTransform): string {
  const { x, y, z, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ } = transform;

  // Translate to center the canvas first, then to position,
  // then center the element, finally apply rotation and scale
  return `
    translate(50%, 50%)
    translate3d(${x}px, ${y}px, ${z}px)
    translate(-50%, -50%)
    rotateX(${rotationX}rad)
    rotateY(${rotationY}rad)
    rotateZ(${rotationZ}rad)
    scale3d(${scaleX}, ${scaleY}, ${scaleZ})
  `
    .trim()
    .replace(/\s+/g, ' ');
}

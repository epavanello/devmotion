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
export interface LayerComponentDefinition<T extends z.ZodType = z.ZodType> {
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
  component: Component<Record<string, unknown>>;
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
}

/**
 * Extract property metadata from a Zod schema
 */
export function extractPropertyMetadata(schema: z.ZodType): PropertyMetadata[] {
  const metadata: PropertyMetadata[] = [];

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;

    for (const [key, value] of Object.entries(shape)) {
      const zodType = value as z.ZodType;
      const meta: PropertyMetadata = {
        name: key,
        type: 'string'
      };

      // Extract description
      if (zodType.description) {
        meta.description = zodType.description;
      }

      // Determine type
      if (zodType instanceof z.ZodNumber) {
        meta.type = 'number';

        // Extract min/max/step from checks
        const checks = (zodType as any)._def.checks || [];
        for (const check of checks) {
          if (check.kind === 'min') {
            meta.min = check.value;
          } else if (check.kind === 'max') {
            meta.max = check.value;
          }
        }
      } else if (zodType instanceof z.ZodBoolean) {
        meta.type = 'boolean';
      } else if (zodType instanceof z.ZodString) {
        meta.type = 'string';

        // Check if it's a color by convention (field name contains 'color')
        if (
          key.toLowerCase().includes('color') ||
          key.toLowerCase().includes('fill') ||
          key.toLowerCase().includes('stroke')
        ) {
          meta.type = 'color';
        }
      } else if (zodType instanceof z.ZodEnum) {
        meta.type = 'select';
        meta.options = (zodType as any)._def.values.map((v: string) => ({
          value: v,
          label: v.charAt(0).toUpperCase() + v.slice(1)
        }));
      }

      metadata.push(meta);
    }
  }

  return metadata;
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

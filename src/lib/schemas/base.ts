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
 */
export const TransformSchema = z.object({
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

export type Transform = z.infer<typeof TransformSchema>;

// ============================================
// Style
// ============================================

/**
 * Base style properties shared by all layers.
 * Currently contains opacity, but may expand to include other visual properties.
 */
export const LayerStyleSchema = z.object({
  opacity: z.number().min(0).max(1).describe('Opacity (0-1)')
});

export type LayerStyle = z.infer<typeof LayerStyleSchema>;

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
  locked: z.boolean().describe('Layer locked state (prevents editing)')
});

export type BaseLayerFields = z.infer<typeof BaseLayerFieldsSchema>;

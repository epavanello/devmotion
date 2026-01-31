/**
 * Zod schemas for animation types
 * Single source of truth - TypeScript types are inferred from these schemas
 */
import { getAvailableLayerTypes } from '$lib/layers/registry';
import { z } from 'zod';

// ============================================
// Easing
// ============================================

export const CubicBezierPointsSchema = z.object({
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number()
});

export const EasingTypeSchema = z.enum([
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier'
]);

export const EasingSchema = z.object({
  type: EasingTypeSchema,
  bezier: CubicBezierPointsSchema.optional()
});

// ============================================
// Animatable Properties
// ============================================

export const BuiltInAnimatablePropertySchema = z.enum([
  'position.x',
  'position.y',
  'position.z',
  'scale.x',
  'scale.y',
  'scale.z',
  'rotation.x',
  'rotation.y',
  'rotation.z',
  'opacity',
  'color'
]);

// For props properties like props.fontSize, props.fill
export const PropsAnimatablePropertySchema = z.string().regex(/^props\./);

export const AnimatablePropertySchema = z.union([
  BuiltInAnimatablePropertySchema,
  PropsAnimatablePropertySchema
]);

export const InterpolationTypeSchema = z.enum(['number', 'color', 'text', 'discrete']);

// ============================================
// Transform & Style
// ============================================

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

export const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  rotationX: z.number(),
  rotationY: z.number(),
  rotationZ: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  scaleZ: z.number(),
  anchor: AnchorPointSchema
});

export const LayerStyleSchema = z.object({
  opacity: z.number().min(0).max(1)
});

// ============================================
// Keyframe
// ============================================

export const KeyframeSchema = z.object({
  id: z.string(),
  time: z.number().min(0),
  property: AnimatablePropertySchema,
  value: z.union([z.number(), z.string(), z.boolean()]),
  easing: EasingSchema
});

// ============================================
// Layer Types
// ============================================

export const LayerTypeSchema = z.enum(getAvailableLayerTypes());

// ============================================
// Layer
// ============================================

export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: LayerTypeSchema,
  transform: TransformSchema,
  style: LayerStyleSchema,
  visible: z.boolean(),
  locked: z.boolean(),
  keyframes: z.array(KeyframeSchema),
  /**
   * Layer-specific properties validated by the component's Zod schema.
   * Kept flexible to allow each layer type to define its own props.
   */
  props: z.record(z.string(), z.unknown())
});

// ============================================
// Project
// ============================================

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  duration: z.number().positive(),
  fps: z.number().positive(),
  backgroundColor: z.string(),
  layers: z.array(LayerSchema)
});

// ============================================
// Viewport & Export Settings
// ============================================

export const ViewportSettingsSchema = z.object({
  zoom: z.number(),
  pan: z.object({
    x: z.number(),
    y: z.number()
  }),
  showGuides: z.boolean(),
  snapToGrid: z.boolean()
});

export const AnimationPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  keyframes: z.array(KeyframeSchema.omit({ id: true }))
});

export const ExportSettingsSchema = z.object({
  format: z.enum(['mp4', 'webm', 'json']),
  quality: z.enum(['low', 'medium', 'high']),
  fps: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive()
});

// ============================================
// TypeScript Types (inferred from schemas)
// ============================================

export type CubicBezierPoints = z.infer<typeof CubicBezierPointsSchema>;
export type EasingType = z.infer<typeof EasingTypeSchema>;
export type Easing = z.infer<typeof EasingSchema>;

export type BuiltInAnimatableProperty = z.infer<typeof BuiltInAnimatablePropertySchema>;
export type PropsAnimatableProperty = z.infer<typeof PropsAnimatablePropertySchema>;
export type AnimatableProperty = z.infer<typeof AnimatablePropertySchema>;
export type InterpolationType = z.infer<typeof InterpolationTypeSchema>;

export type AnchorPoint = z.infer<typeof AnchorPointSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type LayerStyle = z.infer<typeof LayerStyleSchema>;

export type Keyframe = z.infer<typeof KeyframeSchema>;

export type LayerType = z.infer<typeof LayerTypeSchema>;
export type Layer = z.infer<typeof LayerSchema>;

export type Project = z.infer<typeof ProjectSchema>;

export const projectDataSchema = ProjectSchema.omit({ id: true });

export type ProjectData = z.infer<typeof projectDataSchema>;

export type ViewportSettings = z.infer<typeof ViewportSettingsSchema>;
export type AnimationPreset = z.infer<typeof AnimationPresetSchema>;
export type ExportSettings = z.infer<typeof ExportSettingsSchema>;

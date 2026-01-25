/**
 * Core types for the animation editor
 * These types are re-exported from Zod schemas for consistency and validation
 */

// Re-export all types from schemas (single source of truth)
export type {
  CubicBezierPoints,
  EasingType,
  Easing,
  BuiltInAnimatableProperty,
  PropsAnimatableProperty,
  AnimatableProperty,
  InterpolationType,
  AnchorPoint,
  Transform,
  LayerStyle,
  Keyframe,
  LayerType,
  Layer,
  Project,
  ViewportSettings,
  AnimationPreset,
  ExportSettings
} from '$lib/schemas/animation';

// Re-export schemas for validation
export {
  CubicBezierPointsSchema,
  EasingTypeSchema,
  EasingSchema,
  BuiltInAnimatablePropertySchema,
  PropsAnimatablePropertySchema,
  AnimatablePropertySchema,
  InterpolationTypeSchema,
  AnchorPointSchema,
  TransformSchema,
  LayerStyleSchema,
  KeyframeSchema,
  LayerTypeSchema,
  LayerSchema,
  ProjectSchema,
  ViewportSettingsSchema,
  AnimationPresetSchema,
  ExportSettingsSchema
} from '$lib/schemas/animation';

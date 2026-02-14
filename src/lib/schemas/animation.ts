/**
 * Zod schemas for animation types
 * Single source of truth - TypeScript types are inferred from these schemas
 */
import { getAvailableLayerTypes } from '$lib/layers/registry';
import { z } from 'zod';
import { BackgroundValueSchema } from './background';
import { TransformSchema, LayerStyleSchema, BaseLayerFieldsSchema } from './base';
import { googleFontValues } from '$lib/utils/fonts';

// ============================================
// Interpolation
// ============================================

// Continuous interpolation (smooth numeric transitions with easing)
const ContinuousInterpolationSchema = z.object({
  family: z.literal('continuous'),
  strategy: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out'])
});

// Discrete interpolation (instant value changes)
const DiscreteInterpolationSchema = z.object({
  family: z.literal('discrete'),
  strategy: z.enum(['step-end', 'step-start', 'step-mid'])
});

// Quantized interpolation (continuous but rounded)
const QuantizedIntegerSchema = z.object({
  family: z.literal('quantized'),
  strategy: z.literal('integer')
});

const QuantizedSnapGridSchema = z.object({
  family: z.literal('quantized'),
  strategy: z.literal('snap-grid'),
  increment: z.number().positive()
});

// Text interpolation (string transitions)
const TextCharRevealSchema = z.object({
  family: z.literal('text'),
  strategy: z.literal('char-reveal')
});

const TextWordRevealSchema = z.object({
  family: z.literal('text'),
  strategy: z.literal('word-reveal'),
  separator: z.string().optional()
});

// Union of all interpolation types
export const InterpolationSchema = z.union([
  ContinuousInterpolationSchema,
  DiscreteInterpolationSchema,
  QuantizedIntegerSchema,
  QuantizedSnapGridSchema,
  TextCharRevealSchema,
  TextWordRevealSchema
]);

// ============================================
// Animatable Properties
// ============================================

export const BuiltInAnimatablePropertySchema = z.enum([
  'position.x',
  'position.y',
  'position.z',
  'scale.x',
  'scale.y',
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

// Re-export background schemas from the cycle-free module.
// animation.ts → registry.ts → layer components → animation.ts would break if
// these schemas lived here, so they live in background.ts and are re-exported.
export {
  ColorStopSchema,
  SolidBackgroundSchema,
  LinearGradientSchema,
  RadialGradientSchema,
  ConicGradientSchema,
  BackgroundValueSchema,
  backgroundValueToCSS,
  solidBackground,
  linearGradient,
  radialGradient,
  isGradient,
  isSolid
} from './background';
export type {
  ColorStop,
  SolidBackground,
  LinearGradient,
  RadialGradient,
  ConicGradient,
  BackgroundValue
} from './background';

// Re-export base schemas for backward compatibility
export { AnchorPointSchema, TransformSchema, LayerStyleSchema } from './base';

// ============================================
// Keyframe
// ============================================

export const KeyframeSchema = z.object({
  id: z.string(),
  time: z.number().min(0),
  property: AnimatablePropertySchema,
  value: z.union([z.number(), z.string(), z.boolean()]),
  interpolation: InterpolationSchema
});

// ============================================
// Layer Types
// ============================================

export const LayerTypeSchema = z.enum(getAvailableLayerTypes());

// ============================================
// Layer
// ============================================

export const LayerSchema = BaseLayerFieldsSchema.extend({
  type: LayerTypeSchema,
  transform: TransformSchema,
  style: LayerStyleSchema,
  keyframes: z.array(KeyframeSchema),
  /**
   * Layer-specific properties validated by the component's Zod schema.
   * Kept flexible to allow each layer type to define its own props.
   */
  props: z.record(z.string(), z.unknown()),
  /**
   * Enter time - when this layer becomes visible in the timeline (seconds).
   * If undefined, the layer is visible from the start.
   */
  enterTime: z.number().min(0).optional(),
  /**
   * Exit time - when this layer stops being visible in the timeline (seconds).
   * If undefined, the layer is visible until the project ends.
   */
  exitTime: z.number().min(0).optional(),
  /**
   * Content duration - the total duration of the layer's content in seconds.
   * For video/audio layers, this is the media file duration.
   * For other layers, this may be undefined (infinite duration).
   * Used to constrain enter/exit times and content offset.
   */
  contentDuration: z.number().min(0).optional(),
  /**
   * Content offset - how much to trim/skip from the start of the content (seconds).
   * For video/audio layers, this is where playback starts in the source media.
   * Combined with enter/exit times, this determines what portion of content is shown.
   * Only applicable when contentDuration is defined.
   */
  contentOffset: z.number().min(0).optional()
}).refine(
  (data) => {
    // Validate contentOffset doesn't exceed contentDuration
    if (
      data.contentDuration !== undefined &&
      data.contentOffset !== undefined &&
      data.contentOffset > data.contentDuration
    ) {
      return false;
    }
    // Validate visible duration doesn't exceed available content
    if (
      data.contentDuration !== undefined &&
      data.enterTime !== undefined &&
      data.exitTime !== undefined
    ) {
      const visibleDuration = data.exitTime - data.enterTime;
      const contentOffset = data.contentOffset ?? 0;
      const availableContent = data.contentDuration - contentOffset;
      if (visibleDuration > availableContent) {
        return false;
      }
    }
    return true;
  },
  {
    message:
      'Content duration and offset constraints violated: offset must be < duration, and visible duration must fit within available content'
  }
);

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
  background: BackgroundValueSchema.optional(),
  fontFamily: z.enum(googleFontValues).optional().default('Inter'),
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

export type Interpolation = z.infer<typeof InterpolationSchema>;
export type InterpolationFamily = Interpolation['family'];

export type BuiltInAnimatableProperty = z.infer<typeof BuiltInAnimatablePropertySchema>;
export type PropsAnimatableProperty = z.infer<typeof PropsAnimatablePropertySchema>;
export type AnimatableProperty = z.infer<typeof AnimatablePropertySchema>;

// Re-export base types for backward compatibility
export type { AnchorPoint, Transform, LayerStyle } from './base';

export type Keyframe = z.infer<typeof KeyframeSchema>;

/**
 * Base layer type from schema (without generic typing)
 */
export type Layer = z.infer<typeof LayerSchema>;

export type Project = z.infer<typeof ProjectSchema>;

export const projectDataSchema = ProjectSchema.omit({ id: true });

export type ProjectData = z.infer<typeof projectDataSchema>;

export type ViewportSettings = z.infer<typeof ViewportSettingsSchema>;
export type AnimationPreset = z.infer<typeof AnimationPresetSchema>;
export type ExportSettings = z.infer<typeof ExportSettingsSchema>;

/**
 * Animation presets - reusable animation patterns
 * These can be applied to any layer by the AI using create_layer tool
 */
import { z } from 'zod';
import type { Paths } from 'type-fest';
import type { Interpolation } from '$lib/types/animation';
import type { Transform, LayerStyle } from '$lib/schemas/base';
import type { EditLayerStyleSection } from '$lib/ai/schemas';

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
export type StyleProperty = keyof Omit<LayerStyle, 'dropShadowColor'>;

/**
 * All base animatable properties (transform + style)
 */
export type BaseAnimatableProperty = TransformProperty | StyleProperty;

/**
 * Preset category based on usage context
 */
export type PresetCategory = 'enter' | 'exit' | 'generic';

/**
 * Type-safe keyframe for presets
 * Only allows valid transform and style properties with correct value types
 */
export type PresetKeyframe<P extends BaseAnimatableProperty = BaseAnimatableProperty> = {
  time: number;
  property: P;
  value: P extends TransformProperty
    ? number
    : P extends StyleProperty
      ? number
      : P extends 'dropShadowColor'
        ? string
        : never;
  interpolation?: Interpolation;
};

/**
 * Type-safe animation preset with category
 */
export interface TypedAnimationPreset {
  id: string;
  name: string;
  category: PresetCategory;
  keyframes: PresetKeyframe[];
}

/**
 * Helper to create type-safe preset keyframes
 */
function kf<P extends BaseAnimatableProperty>(
  time: number,
  property: P,
  value: PresetKeyframe<P>['value'],
  interpolation?: Interpolation
): PresetKeyframe<P> {
  return { time, property, value, interpolation } as PresetKeyframe<P>;
}

/**
 * Helper to create a type-safe preset
 */
function preset(
  id: string,
  name: string,
  category: PresetCategory,
  keyframes: PresetKeyframe[]
): TypedAnimationPreset {
  return { id, name, category, keyframes };
}

/**
 * All available animation presets
 * Keyframe times are normalized (0-1) and will be scaled by duration when applied
 */
export const animationPresets: TypedAnimationPreset[] = [
  // ============================================
  // Fade animations
  // ============================================
  preset('fade-in', 'Fade In', 'enter', [
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('fade-out', 'Fade Out', 'exit', [
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
  ]),

  // ============================================
  // Slide animations
  // ============================================
  preset('slide-in-left', 'Slide In from Left', 'enter', [
    kf(0, 'position.x', -500, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'position.x', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('slide-in-right', 'Slide In from Right', 'enter', [
    kf(0, 'position.x', 500, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'position.x', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('slide-in-top', 'Slide In from Top', 'enter', [
    kf(0, 'position.y', -400, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'position.y', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('slide-in-bottom', 'Slide In from Bottom', 'enter', [
    kf(0, 'position.y', 400, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'position.y', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('slide-out-left', 'Slide Out to Left', 'exit', [
    kf(0, 'position.x', 0, { family: 'continuous', strategy: 'ease-in' }),
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(1, 'position.x', -500, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('slide-out-right', 'Slide Out to Right', 'exit', [
    kf(0, 'position.x', 0, { family: 'continuous', strategy: 'ease-in' }),
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(1, 'position.x', 500, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
  ]),

  // ============================================
  // Scale animations
  // ============================================
  preset('scale-in', 'Scale In', 'enter', [
    kf(0, 'scale.x', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'scale.y', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('scale-out', 'Scale Out', 'exit', [
    kf(0, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(1, 'scale.x', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'scale.y', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('pop', 'Pop (Scale with Overshoot)', 'enter', [
    kf(0, 'scale.x', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'scale.y', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0.6, 'scale.x', 1.15, { family: 'continuous', strategy: 'ease-out' }),
    kf(0.6, 'scale.y', 1.15, { family: 'continuous', strategy: 'ease-out' }),
    kf(0.6, 'opacity', 1, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' })
  ]),

  // ============================================
  // Bounce animations
  // ============================================
  preset('bounce', 'Bounce', 'generic', [
    kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.25, 'scale.y', 1.2, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.5, 'scale.y', 0.9, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.75, 'scale.y', 1.05, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('bounce-in', 'Bounce In', 'enter', [
    kf(0, 'scale.x', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'scale.y', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0.4, 'scale.x', 1.2, { family: 'continuous', strategy: 'ease-out' }),
    kf(0.4, 'scale.y', 1.2, { family: 'continuous', strategy: 'ease-out' }),
    kf(0.4, 'opacity', 1, { family: 'continuous', strategy: 'linear' }),
    kf(0.6, 'scale.x', 0.9, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.6, 'scale.y', 0.9, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.8, 'scale.x', 1.05, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.8, 'scale.y', 1.05, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' })
  ]),

  // ============================================
  // Rotation animations
  // ============================================
  preset('rotate-in', 'Rotate In', 'enter', [
    kf(0, 'rotation.z', -Math.PI, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'scale.x', 0.5, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'scale.y', 0.5, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'rotation.z', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('spin', 'Spin (Full Rotation)', 'generic', [
    kf(0, 'rotation.z', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'rotation.z', Math.PI * 2, { family: 'continuous', strategy: 'linear' })
  ]),

  // ============================================
  // Attention/emphasis animations
  // ============================================
  preset('pulse', 'Pulse', 'generic', [
    kf(0, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.5, 'scale.x', 1.1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.5, 'scale.y', 1.1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' })
  ]),
  preset('shake', 'Shake', 'generic', [
    kf(0, 'position.x', 0, { family: 'continuous', strategy: 'linear' }),
    kf(0.1, 'position.x', -10, { family: 'continuous', strategy: 'linear' }),
    kf(0.2, 'position.x', 10, { family: 'continuous', strategy: 'linear' }),
    kf(0.3, 'position.x', -10, { family: 'continuous', strategy: 'linear' }),
    kf(0.4, 'position.x', 10, { family: 'continuous', strategy: 'linear' }),
    kf(0.5, 'position.x', -5, { family: 'continuous', strategy: 'linear' }),
    kf(0.6, 'position.x', 5, { family: 'continuous', strategy: 'linear' }),
    kf(0.7, 'position.x', -2, { family: 'continuous', strategy: 'linear' }),
    kf(0.8, 'position.x', 2, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'position.x', 0, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('float', 'Float (Subtle Up/Down)', 'generic', [
    kf(0, 'position.y', 0, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.5, 'position.y', -15, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'position.y', 0, { family: 'continuous', strategy: 'ease-in-out' })
  ]),
  preset('glow', 'Glow (Opacity Pulse)', 'generic', [
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.5, 'opacity', 0.6, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'ease-in-out' })
  ]),

  // ============================================
  // Zoom animations
  // ============================================
  preset('zoom-in', 'Zoom In (from far)', 'enter', [
    kf(0, 'scale.x', 0.3, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'scale.y', 0.3, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('zoom-out', 'Zoom Out (to far)', 'exit', [
    kf(0, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(1, 'scale.x', 0.3, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'scale.y', 0.3, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
  ]),

  // ============================================
  // Special effects
  // ============================================
  preset('flip-in-x', 'Flip In (Horizontal)', 'enter', [
    kf(0, 'rotation.y', Math.PI / 2, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'rotation.y', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('flip-in-y', 'Flip In (Vertical)', 'enter', [
    kf(0, 'rotation.x', Math.PI / 2, { family: 'continuous', strategy: 'ease-out' }),
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'rotation.x', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('swing', 'Swing', 'generic', [
    kf(0, 'rotation.z', 0, { family: 'continuous', strategy: 'ease-in-out' }),
    kf(0.2, 'rotation.z', 0.26, { family: 'continuous', strategy: 'ease-in-out' }), // ~15deg
    kf(0.4, 'rotation.z', -0.17, { family: 'continuous', strategy: 'ease-in-out' }), // ~-10deg
    kf(0.6, 'rotation.z', 0.09, { family: 'continuous', strategy: 'ease-in-out' }), // ~5deg
    kf(0.8, 'rotation.z', -0.05, { family: 'continuous', strategy: 'ease-in-out' }), // ~-3deg
    kf(1, 'rotation.z', 0, { family: 'continuous', strategy: 'ease-in-out' })
  ])
];

/**
 * Schema for animation preset ID - derived from animationPresets array
 */
export const AnimationPresetIdSchema = z.enum(
  animationPresets.map((p) => p.id) as [string, ...string[]]
);

export type AnimationPresetId = z.infer<typeof AnimationPresetIdSchema>;
/**
 * Get a preset by ID
 */
export function getPresetById(id: string): TypedAnimationPreset | undefined {
  return animationPresets.find((p) => p.id === id);
}

/**
 * Get all preset IDs
 */
export function getPresetIds(): string[] {
  return animationPresets.map((p) => p.id);
}

/**
 * Get presets suitable for enter transitions (fade-in, slide-in, etc.)
 */
export function getEnterPresets(): TypedAnimationPreset[] {
  return animationPresets.filter((p) => p.category === 'enter');
}

/**
 * Get presets suitable for exit transitions (fade-out, slide-out, etc.)
 */
export function getExitPresets(): TypedAnimationPreset[] {
  return animationPresets.filter((p) => p.category === 'exit');
}

/**
 * Get generic animation presets (shake, pulse, etc.)
 */
export function getGenericPresets(): TypedAnimationPreset[] {
  return animationPresets.filter((p) => p.category === 'generic');
}

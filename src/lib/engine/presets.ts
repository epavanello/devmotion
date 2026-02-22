/**
 * Animation presets - reusable animation patterns
 * Centralized configuration: single source of truth for UI, AI, and rendering.
 */
import { z } from 'zod';
import type { Paths } from 'type-fest';
import type { Interpolation } from '$lib/types/animation';
import type { Transform, LayerStyle } from '$lib/schemas/base';

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
export type StyleProperty = keyof LayerStyle;

/**
 * All base animatable properties (transform + style)
 */
export type BaseAnimatableProperty = TransformProperty | StyleProperty;

/**
 * Preset category based on usage context
 */
export type PresetCategory = 'enter' | 'exit' | 'emphasis';

/**
 * Type-safe keyframe for presets
 * Only allows valid transform and style properties with correct value types
 */
export type PresetKeyframe<P extends BaseAnimatableProperty = BaseAnimatableProperty> = {
  time: number;
  property: P;
  value: P extends TransformProperty
    ? number
    : P extends
          | 'opacity'
          | 'blur'
          | 'brightness'
          | 'contrast'
          | 'saturate'
          | 'dropShadowX'
          | 'dropShadowY'
          | 'dropShadowBlur'
      ? number
      : P extends 'dropShadowColor'
        ? string
        : never;
  interpolation?: Interpolation;
};

/**
 * Type-safe animation preset with category and description
 */
export interface TypedAnimationPreset {
  id: string;
  name: string;
  description: string;
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
  description: string,
  category: PresetCategory,
  keyframes: PresetKeyframe[]
): TypedAnimationPreset {
  return { id, name, description, category, keyframes };
}

/**
 * All available animation presets
 * Keyframe times are normalized (0-1) and will be scaled by duration when applied
 */
export const animationPresets: TypedAnimationPreset[] = [
  // ============================================
  // Fade animations
  // ============================================
  preset('fade-in', 'Fade In', 'Gradually appears from transparent to fully visible', 'enter', [
    kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
    kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
  ]),
  preset('fade-out', 'Fade Out', 'Gradually disappears from visible to transparent', 'exit', [
    kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
    kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
  ]),

  // ============================================
  // Slide animations
  // ============================================
  preset(
    'slide-in-left',
    'Slide In from Left',
    'Slides in from 500px left with fade, ending at original position',
    'enter',
    [
      kf(0, 'position.x', -500, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'position.x', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-in-right',
    'Slide In from Right',
    'Slides in from 500px right with fade, ending at original position',
    'enter',
    [
      kf(0, 'position.x', 500, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'position.x', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-in-top',
    'Slide In from Top',
    'Slides in from 400px above with fade, ending at original position',
    'enter',
    [
      kf(0, 'position.y', -400, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'position.y', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-in-bottom',
    'Slide In from Bottom',
    'Slides in from 400px below with fade, ending at original position',
    'enter',
    [
      kf(0, 'position.y', 400, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'position.y', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-out-left',
    'Slide Out to Left',
    'Slides out 500px to the left with fade, from original position',
    'exit',
    [
      kf(0, 'position.x', 0, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(1, 'position.x', -500, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-out-right',
    'Slide Out to Right',
    'Slides out 500px to the right with fade, from original position',
    'exit',
    [
      kf(0, 'position.x', 0, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(1, 'position.x', 500, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-out-top',
    'Slide Out to Top',
    'Slides out 400px upward with fade, from original position',
    'exit',
    [
      kf(0, 'position.y', 0, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(1, 'position.y', -400, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'slide-out-bottom',
    'Slide Out to Bottom',
    'Slides out 400px downward with fade, from original position',
    'exit',
    [
      kf(0, 'position.y', 0, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(1, 'position.y', 400, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
    ]
  ),

  // ============================================
  // Scale animations
  // ============================================
  preset(
    'scale-in',
    'Scale In',
    'Grows from 0 to full size with fade, uniform scale on both axes',
    'enter',
    [
      kf(0, 'scale.x', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'scale.y', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'scale-out',
    'Scale Out',
    'Shrinks from full size to 0 with fade, uniform scale on both axes',
    'exit',
    [
      kf(0, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(1, 'scale.x', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'scale.y', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'pop',
    'Pop (Scale with Overshoot)',
    'Scales up with a bouncy overshoot to 115% then settles at 100%',
    'enter',
    [
      kf(0, 'scale.x', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'scale.y', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(0.6, 'scale.x', 1.15, { family: 'continuous', strategy: 'ease-out' }),
      kf(0.6, 'scale.y', 1.15, { family: 'continuous', strategy: 'ease-out' }),
      kf(0.6, 'opacity', 1, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' })
    ]
  ),

  // ============================================
  // Bounce animations
  // ============================================
  preset(
    'bounce',
    'Bounce',
    'Bounces vertically with decreasing amplitude (scale.y: 1 → 1.2 → 0.9 → 1.05 → 1)',
    'emphasis',
    [
      kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.25, 'scale.y', 1.2, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.5, 'scale.y', 0.9, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.75, 'scale.y', 1.05, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'bounce-in',
    'Bounce In',
    'Enters with bouncing scale overshoot (0 → 1.2 → 0.9 → 1.05 → 1)',
    'enter',
    [
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
    ]
  ),

  // ============================================
  // Rotation animations
  // ============================================
  preset(
    'rotate-in',
    'Rotate In',
    'Rotates 180° while scaling from 50% to 100% with fade',
    'enter',
    [
      kf(0, 'rotation.z', -Math.PI, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'scale.x', 0.5, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'scale.y', 0.5, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'rotation.z', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset('spin', 'Spin (Full Rotation)', 'Completes one full 360° clockwise rotation', 'emphasis', [
    kf(0, 'rotation.z', 0, { family: 'continuous', strategy: 'linear' }),
    kf(1, 'rotation.z', Math.PI * 2, { family: 'continuous', strategy: 'linear' })
  ]),

  // ============================================
  // Attention/emphasis animations
  // ============================================
  preset(
    'pulse',
    'Pulse',
    'Gently scales up to 110% and back to 100%, drawing attention',
    'emphasis',
    [
      kf(0, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.5, 'scale.x', 1.1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.5, 'scale.y', 1.1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in-out' })
    ]
  ),
  preset(
    'shake',
    'Shake',
    'Rapid horizontal shaking with decreasing intensity (±10px → ±2px)',
    'emphasis',
    [
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
    ]
  ),
  preset(
    'float',
    'Float (Subtle Up/Down)',
    'Gentle vertical drift of 15px up and back, loopable',
    'emphasis',
    [
      kf(0, 'position.y', 0, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.5, 'position.y', -15, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'position.y', 0, { family: 'continuous', strategy: 'ease-in-out' })
    ]
  ),
  preset(
    'glow',
    'Glow (Opacity Pulse)',
    'Fades opacity down to 60% and back, creating a glowing effect',
    'emphasis',
    [
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.5, 'opacity', 0.6, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'ease-in-out' })
    ]
  ),

  // ============================================
  // Zoom animations
  // ============================================
  preset(
    'zoom-in',
    'Zoom In (from far)',
    'Scales from 30% to 100% with fade, simulating approach from distance',
    'enter',
    [
      kf(0, 'scale.x', 0.3, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'scale.y', 0.3, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'scale.x', 1, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'scale.y', 1, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'zoom-out',
    'Zoom Out (to far)',
    'Scales from 100% to 30% with fade, simulating retreat to distance',
    'exit',
    [
      kf(0, 'scale.x', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'scale.y', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(0, 'opacity', 1, { family: 'continuous', strategy: 'ease-in' }),
      kf(1, 'scale.x', 0.3, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'scale.y', 0.3, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 0, { family: 'continuous', strategy: 'linear' })
    ]
  ),

  // ============================================
  // Special effects
  // ============================================
  preset(
    'flip-in-x',
    'Flip In (Horizontal)',
    'Flips 90° around Y axis into view with fade',
    'enter',
    [
      kf(0, 'rotation.y', Math.PI / 2, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'rotation.y', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'flip-in-y',
    'Flip In (Vertical)',
    'Flips 90° around X axis into view with fade',
    'enter',
    [
      kf(0, 'rotation.x', Math.PI / 2, { family: 'continuous', strategy: 'ease-out' }),
      kf(0, 'opacity', 0, { family: 'continuous', strategy: 'ease-out' }),
      kf(1, 'rotation.x', 0, { family: 'continuous', strategy: 'linear' }),
      kf(1, 'opacity', 1, { family: 'continuous', strategy: 'linear' })
    ]
  ),
  preset(
    'swing',
    'Swing',
    'Pendulum-like rotation swinging ±15° with decreasing amplitude',
    'emphasis',
    [
      kf(0, 'rotation.z', 0, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.2, 'rotation.z', 0.26, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.4, 'rotation.z', -0.17, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.6, 'rotation.z', 0.09, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(0.8, 'rotation.z', -0.05, { family: 'continuous', strategy: 'ease-in-out' }),
      kf(1, 'rotation.z', 0, { family: 'continuous', strategy: 'ease-in-out' })
    ]
  )
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
 * Get emphasis animation presets (shake, pulse, etc.)
 */
export function getEmphasisPresets(): TypedAnimationPreset[] {
  return animationPresets.filter((p) => p.category === 'emphasis');
}

/**
 * Get a human-readable summary of all presets for AI prompt injection
 */
export function getPresetsSummaryForAI(): string {
  const sections = [
    {
      title: 'Enter presets (use for layer entrances or enterTransition)',
      presets: getEnterPresets()
    },
    { title: 'Exit presets (use for layer exits or exitTransition)', presets: getExitPresets() },
    {
      title: 'Emphasis presets (use as keyframe animations at any time)',
      presets: getEmphasisPresets()
    }
  ];

  return sections
    .map(
      (s) => `### ${s.title}\n${s.presets.map((p) => `- **${p.id}**: ${p.description}`).join('\n')}`
    )
    .join('\n\n');
}

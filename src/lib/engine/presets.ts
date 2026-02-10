/**
 * Animation presets - reusable animation patterns
 * These can be applied to any layer by the AI using apply_preset action
 */
import type { AnimationPreset } from '$lib/types/animation';

/**
 * All available animation presets
 * Keyframe times are normalized (0-1) and will be scaled by duration when applied
 */
export const animationPresets: AnimationPreset[] = [
  // ============================================
  // Fade animations
  // ============================================
  {
    id: 'fade-in',
    name: 'Fade In',
    keyframes: [
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    keyframes: [
      {
        time: 0,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },

  // ============================================
  // Slide animations
  // ============================================
  {
    id: 'slide-in-left',
    name: 'Slide In from Left',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: -500,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-right',
    name: 'Slide In from Right',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: 500,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-top',
    name: 'Slide In from Top',
    keyframes: [
      {
        time: 0,
        property: 'position.y',
        value: -400,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-bottom',
    name: 'Slide In from Bottom',
    keyframes: [
      {
        time: 0,
        property: 'position.y',
        value: 400,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'slide-out-left',
    name: 'Slide Out to Left',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 1,
        property: 'position.x',
        value: -500,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'slide-out-right',
    name: 'Slide Out to Right',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 1,
        property: 'position.x',
        value: 500,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },

  // ============================================
  // Scale animations
  // ============================================
  {
    id: 'scale-in',
    name: 'Scale In',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'scale-out',
    name: 'Scale Out',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'pop',
    name: 'Pop (Scale with Overshoot)',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0.6,
        property: 'scale.x',
        value: 1.15,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0.6,
        property: 'scale.y',
        value: 1.15,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0.6,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }
    ]
  },

  // ============================================
  // Bounce animations
  // ============================================
  {
    id: 'bounce',
    name: 'Bounce',
    keyframes: [
      {
        time: 0,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.25,
        property: 'scale.y',
        value: 1.2,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.5,
        property: 'scale.y',
        value: 0.9,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.75,
        property: 'scale.y',
        value: 1.05,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'bounce-in',
    name: 'Bounce In',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0.4,
        property: 'scale.x',
        value: 1.2,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0.4,
        property: 'scale.y',
        value: 1.2,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0.4,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.6,
        property: 'scale.x',
        value: 0.9,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.6,
        property: 'scale.y',
        value: 0.9,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.8,
        property: 'scale.x',
        value: 1.05,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.8,
        property: 'scale.y',
        value: 1.05,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }
    ]
  },

  // ============================================
  // Rotation animations
  // ============================================
  {
    id: 'rotate-in',
    name: 'Rotate In',
    keyframes: [
      {
        time: 0,
        property: 'rotation.z',
        value: -Math.PI,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.x',
        value: 0.5,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 0.5,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'rotation.z',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'spin',
    name: 'Spin (Full Rotation)',
    keyframes: [
      {
        time: 0,
        property: 'rotation.z',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'rotation.z',
        value: Math.PI * 2,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },

  // ============================================
  // Attention/emphasis animations
  // ============================================
  {
    id: 'pulse',
    name: 'Pulse',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.5,
        property: 'scale.x',
        value: 1.1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.5,
        property: 'scale.y',
        value: 1.1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }
    ]
  },
  {
    id: 'shake',
    name: 'Shake',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.1,
        property: 'position.x',
        value: -10,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.2,
        property: 'position.x',
        value: 10,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.3,
        property: 'position.x',
        value: -10,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.4,
        property: 'position.x',
        value: 10,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.5,
        property: 'position.x',
        value: -5,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.6,
        property: 'position.x',
        value: 5,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.7,
        property: 'position.x',
        value: -2,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 0.8,
        property: 'position.x',
        value: 2,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'position.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'float',
    name: 'Float (Subtle Up/Down)',
    keyframes: [
      {
        time: 0,
        property: 'position.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.5,
        property: 'position.y',
        value: -15,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'position.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }
    ]
  },
  {
    id: 'glow',
    name: 'Glow (Opacity Pulse)',
    keyframes: [
      {
        time: 0,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.5,
        property: 'opacity',
        value: 0.6,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }
    ]
  },

  // ============================================
  // Zoom animations
  // ============================================
  {
    id: 'zoom-in',
    name: 'Zoom In (from far)',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 0.3,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 0.3,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out (to far)',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'ease-in' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 0.3,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 0.3,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },

  // ============================================
  // Special effects
  // ============================================
  {
    id: 'flip-in-x',
    name: 'Flip In (Horizontal)',
    keyframes: [
      {
        time: 0,
        property: 'rotation.y',
        value: Math.PI / 2,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'rotation.y',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'flip-in-y',
    name: 'Flip In (Vertical)',
    keyframes: [
      {
        time: 0,
        property: 'rotation.x',
        value: Math.PI / 2,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-out' }
      },
      {
        time: 1,
        property: 'rotation.x',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        interpolation: { family: 'continuous', strategy: 'linear' }
      }
    ]
  },
  {
    id: 'swing',
    name: 'Swing',
    keyframes: [
      {
        time: 0,
        property: 'rotation.z',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      },
      {
        time: 0.2,
        property: 'rotation.z',
        value: 0.26,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }, // ~15deg
      {
        time: 0.4,
        property: 'rotation.z',
        value: -0.17,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }, // ~-10deg
      {
        time: 0.6,
        property: 'rotation.z',
        value: 0.09,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }, // ~5deg
      {
        time: 0.8,
        property: 'rotation.z',
        value: -0.05,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }, // ~-3deg
      {
        time: 1,
        property: 'rotation.z',
        value: 0,
        interpolation: { family: 'continuous', strategy: 'ease-in-out' }
      }
    ]
  }
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): AnimationPreset | undefined {
  return animationPresets.find((p) => p.id === id);
}

/**
 * Get all preset IDs
 */
export function getPresetIds(): string[] {
  return animationPresets.map((p) => p.id);
}

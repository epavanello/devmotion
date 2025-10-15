/**
 * Animation presets
 */
import type { AnimationPreset } from '$lib/types/animation';

export const animationPresets: AnimationPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    keyframes: [
      {
        time: 0,
        property: 'opacity',
        value: 0,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        easing: { type: 'linear' }
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
        easing: { type: 'ease-in' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 0,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-left',
    name: 'Slide In Left',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: -500,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.x',
        value: 0,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-right',
    name: 'Slide In Right',
    keyframes: [
      {
        time: 0,
        property: 'position.x',
        value: 500,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.x',
        value: 0,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-top',
    name: 'Slide In Top',
    keyframes: [
      {
        time: 0,
        property: 'position.y',
        value: -300,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.y',
        value: 0,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'slide-in-bottom',
    name: 'Slide In Bottom',
    keyframes: [
      {
        time: 0,
        property: 'position.y',
        value: 300,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'position.y',
        value: 0,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'bounce',
    name: 'Bounce',
    keyframes: [
      {
        time: 0,
        property: 'scale.y',
        value: 1,
        easing: { type: 'ease-in-out' }
      },
      {
        time: 0.3,
        property: 'scale.y',
        value: 1.2,
        easing: { type: 'ease-in-out' }
      },
      {
        time: 0.6,
        property: 'scale.y',
        value: 0.9,
        easing: { type: 'ease-in-out' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'scale-in',
    name: 'Scale In',
    keyframes: [
      {
        time: 0,
        property: 'scale.x',
        value: 0,
        easing: { type: 'ease-out' }
      },
      {
        time: 0,
        property: 'scale.y',
        value: 0,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'scale.x',
        value: 1,
        easing: { type: 'linear' }
      },
      {
        time: 1,
        property: 'scale.y',
        value: 1,
        easing: { type: 'linear' }
      }
    ]
  },
  {
    id: 'rotate-in',
    name: 'Rotate In',
    keyframes: [
      {
        time: 0,
        property: 'rotation.z',
        value: -Math.PI,
        easing: { type: 'ease-out' }
      },
      {
        time: 0,
        property: 'opacity',
        value: 0,
        easing: { type: 'ease-out' }
      },
      {
        time: 1,
        property: 'rotation.z',
        value: 0,
        easing: { type: 'linear' }
      },
      {
        time: 1,
        property: 'opacity',
        value: 1,
        easing: { type: 'linear' }
      }
    ]
  }
];

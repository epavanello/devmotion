/**
 * Animation interpolation and easing functions
 */
import BezierEasing from 'bezier-easing';
import type { Easing, Keyframe, AnimatableProperty } from '$lib/types/animation';

export function getEasingFunction(easing: Easing): (t: number) => number {
  switch (easing.type) {
    case 'linear':
      return (t) => t;
    case 'ease-in':
      return BezierEasing(0.42, 0, 1.0, 1.0);
    case 'ease-out':
      return BezierEasing(0, 0, 0.58, 1.0);
    case 'ease-in-out':
      return BezierEasing(0.42, 0, 0.58, 1.0);
    case 'cubic-bezier':
      if (easing.bezier) {
        return BezierEasing(easing.bezier.x1, easing.bezier.y1, easing.bezier.x2, easing.bezier.y2);
      }
      return (t) => t;
    default:
      return (t) => t;
  }
}

export function interpolateValue(
  startValue: number | string,
  endValue: number | string,
  progress: number,
  easing: Easing
): number | string {
  // Handle color interpolation
  if (typeof startValue === 'string' && typeof endValue === 'string') {
    return interpolateColor(startValue, endValue, progress, easing);
  }

  // Handle numeric interpolation
  if (typeof startValue === 'number' && typeof endValue === 'number') {
    const easingFn = getEasingFunction(easing);
    const easedProgress = easingFn(progress);
    return startValue + (endValue - startValue) * easedProgress;
  }

  return endValue;
}

function interpolateColor(
  startColor: string,
  endColor: string,
  progress: number,
  easing: Easing
): string {
  const easingFn = getEasingFunction(easing);
  const easedProgress = easingFn(progress);

  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  if (!start || !end) return endColor;

  const r = Math.round(start.r + (end.r - start.r) * easedProgress);
  const g = Math.round(start.g + (end.g - start.g) * easedProgress);
  const b = Math.round(start.b + (end.b - start.b) * easedProgress);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function getPropertyValue(
  keyframes: Keyframe[],
  property: AnimatableProperty,
  currentTime: number
): number | string | null {
  const propertyKeyframes = keyframes
    .filter((k) => k.property === property)
    .sort((a, b) => a.time - b.time);

  if (propertyKeyframes.length === 0) return null;

  // If before first keyframe
  if (currentTime <= propertyKeyframes[0].time) {
    return propertyKeyframes[0].value;
  }

  // If after last keyframe
  if (currentTime >= propertyKeyframes[propertyKeyframes.length - 1].time) {
    return propertyKeyframes[propertyKeyframes.length - 1].value;
  }

  // Find surrounding keyframes
  for (let i = 0; i < propertyKeyframes.length - 1; i++) {
    const startKf = propertyKeyframes[i];
    const endKf = propertyKeyframes[i + 1];

    if (currentTime >= startKf.time && currentTime <= endKf.time) {
      const duration = endKf.time - startKf.time;
      const progress = duration > 0 ? (currentTime - startKf.time) / duration : 0;
      return interpolateValue(startKf.value, endKf.value, progress, startKf.easing);
    }
  }

  return propertyKeyframes[propertyKeyframes.length - 1].value;
}

export function getAnimatedTransform(
  keyframes: Keyframe[],
  currentTime: number
): {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
} {
  return {
    position: {
      x: (getPropertyValue(keyframes, 'position.x', currentTime) as number) || 0,
      y: (getPropertyValue(keyframes, 'position.y', currentTime) as number) || 0,
      z: (getPropertyValue(keyframes, 'position.z', currentTime) as number) || 0
    },
    rotation: {
      x: (getPropertyValue(keyframes, 'rotation.x', currentTime) as number) || 0,
      y: (getPropertyValue(keyframes, 'rotation.y', currentTime) as number) || 0,
      z: (getPropertyValue(keyframes, 'rotation.z', currentTime) as number) || 0
    },
    scale: {
      x: (getPropertyValue(keyframes, 'scale.x', currentTime) as number) || 1,
      y: (getPropertyValue(keyframes, 'scale.y', currentTime) as number) || 1,
      z: (getPropertyValue(keyframes, 'scale.z', currentTime) as number) || 1
    }
  };
}

export function getAnimatedStyle(
  keyframes: Keyframe[],
  currentTime: number
): {
  opacity?: number;
  color?: string;
} {
  const style: { opacity?: number; color?: string } = {};

  const opacity = getPropertyValue(keyframes, 'opacity', currentTime);
  if (opacity !== null) {
    style.opacity = opacity as number;
  }

  const color = getPropertyValue(keyframes, 'color', currentTime);
  if (color !== null) {
    style.color = color as string;
  }

  return style;
}

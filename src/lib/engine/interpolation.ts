/**
 * Animation interpolation and easing functions
 */
import BezierEasing from 'bezier-easing';
import type { Easing, Keyframe, AnimatableProperty, InterpolationType } from '$lib/types/animation';
import type { PropertyMetadata } from '$lib/layers/base';

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

/**
 * Interpolate between two values based on interpolation type
 * - 'number': Linear interpolation
 * - 'color': RGB color interpolation
 * - 'text': Character-by-character text reveal
 * - 'discrete': Jump to end value when progress >= 1
 */
export function interpolateValue(
  startValue: number | string | boolean,
  endValue: number | string | boolean,
  progress: number,
  easing: Easing,
  interpolationType?: InterpolationType
): number | string | boolean {
  // If interpolation type is explicitly discrete, jump to end value
  if (interpolationType === 'discrete') {
    return progress >= 1 ? endValue : startValue;
  }

  // Handle text interpolation (character by character)
  if (interpolationType === 'text' && typeof endValue === 'string') {
    return interpolateText(endValue, progress, easing);
  }

  // Handle color interpolation
  if (
    interpolationType === 'color' ||
    (typeof startValue === 'string' && typeof endValue === 'string' && isColorValue(startValue))
  ) {
    return interpolateColor(startValue as string, endValue as string, progress, easing);
  }

  // Handle numeric interpolation
  if (typeof startValue === 'number' && typeof endValue === 'number') {
    const easingFn = getEasingFunction(easing);
    const easedProgress = easingFn(progress);
    return startValue + (endValue - startValue) * easedProgress;
  }

  // Default: discrete interpolation for strings, booleans, etc.
  return progress >= 1 ? endValue : startValue;
}

/**
 * Check if a string value looks like a color (hex format)
 */
function isColorValue(value: string): boolean {
  return /^#([a-f\d]{3}|[a-f\d]{6})$/i.test(value);
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

/**
 * Interpolate text character by character
 * Reveals characters progressively based on progress (0 to 1)
 */
function interpolateText(text: string, progress: number, easing: Easing): string {
  const easingFn = getEasingFunction(easing);
  const easedProgress = easingFn(progress);

  const totalChars = text.length;
  const charsToShow = Math.round(totalChars * easedProgress);

  return text.slice(0, charsToShow);
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
  currentTime: number,
  interpolationType?: InterpolationType
): number | string | boolean | null {
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
      return interpolateValue(
        startKf.value,
        endKf.value,
        progress,
        startKf.easing,
        interpolationType
      );
    }
  }

  return propertyKeyframes[propertyKeyframes.length - 1].value;
}

export function getAnimatedTransform(
  keyframes: Keyframe[],
  currentTime: number
): {
  position: { x: number | null; y: number | null; z: number | null };
  rotation: { x: number | null; y: number | null; z: number | null };
  scale: { x: number | null; y: number | null; z: number | null };
} {
  return {
    position: {
      x: getPropertyValue(keyframes, 'position.x', currentTime) as number | null,
      y: getPropertyValue(keyframes, 'position.y', currentTime) as number | null,
      z: getPropertyValue(keyframes, 'position.z', currentTime) as number | null
    },
    rotation: {
      x: getPropertyValue(keyframes, 'rotation.x', currentTime) as number | null,
      y: getPropertyValue(keyframes, 'rotation.y', currentTime) as number | null,
      z: getPropertyValue(keyframes, 'rotation.z', currentTime) as number | null
    },
    scale: {
      x: getPropertyValue(keyframes, 'scale.x', currentTime) as number | null,
      y: getPropertyValue(keyframes, 'scale.y', currentTime) as number | null,
      z: getPropertyValue(keyframes, 'scale.z', currentTime) as number | null
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

/**
 * Get animated values for layer-specific props based on keyframes and property metadata
 * @param keyframes - All keyframes for the layer
 * @param baseProps - The base props values from the layer
 * @param propsMetadata - Property metadata from the layer's Zod schema
 * @param currentTime - Current time in the animation
 * @returns Object with animated prop values merged with base props
 */
export function getAnimatedProps(
  keyframes: Keyframe[],
  baseProps: Record<string, unknown>,
  propsMetadata: PropertyMetadata[],
  currentTime: number
): Record<string, unknown> {
  const animatedProps: Record<string, unknown> = { ...baseProps };

  for (const meta of propsMetadata) {
    const property: AnimatableProperty = `props.${meta.name}`;
    const animatedValue = getPropertyValue(
      keyframes,
      property,
      currentTime,
      meta.interpolationType
    );

    if (animatedValue !== null) {
      animatedProps[meta.name] = animatedValue;
    }
  }

  return animatedProps;
}

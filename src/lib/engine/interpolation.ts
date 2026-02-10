/**
 * Animation interpolation and easing functions
 */
import BezierEasing from 'bezier-easing';
import type { Interpolation, Keyframe, AnimatableProperty } from '$lib/types/animation';
import type { PropertyMetadata } from '$lib/layers/base';

/**
 * Main interpolation function - dispatches to family-specific interpolators
 */
export function interpolateValue(
  startValue: unknown,
  endValue: unknown,
  progress: number,
  interpolation: Interpolation = { family: 'continuous', strategy: 'linear' }
): unknown {
  switch (interpolation.family) {
    case 'continuous':
      return interpolateContinuous(startValue, endValue, progress, interpolation.strategy);

    case 'discrete':
      return interpolateDiscrete(startValue, endValue, progress, interpolation.strategy);

    case 'quantized':
      return interpolateQuantized(startValue, endValue, progress, interpolation);

    case 'text':
      return interpolateText(startValue, endValue, progress, interpolation);

    default:
      console.warn('Unknown interpolation family:', interpolation);
      return progress >= 1 ? endValue : startValue;
  }
}

/**
 * CONTINUOUS interpolation - smooth numeric transitions with easing
 */
function interpolateContinuous(
  start: unknown,
  end: unknown,
  progress: number,
  strategy: string
): number {
  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new Error('continuous interpolation requires numeric values');
  }

  // Apply easing curve based on strategy
  const easing = getEasingFunction(strategy);
  const easedProgress = easing(progress);

  return start + (end - start) * easedProgress;
}

/**
 * DISCRETE interpolation - instant value changes
 */
function interpolateDiscrete(
  start: unknown,
  end: unknown,
  progress: number,
  strategy: string
): unknown {
  switch (strategy) {
    case 'step-end':
      return progress >= 1 ? end : start;

    case 'step-start':
      return progress > 0 ? end : start;

    case 'step-mid':
      return progress >= 0.5 ? end : start;

    default:
      return progress >= 1 ? end : start;
  }
}

/**
 * QUANTIZED interpolation - continuous but rounded to discrete values
 */
function interpolateQuantized(
  start: unknown,
  end: unknown,
  progress: number,
  interpolation: Extract<Interpolation, { family: 'quantized' }>
): number {
  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new Error('quantized interpolation requires numeric values');
  }

  const interpolated = start + (end - start) * progress;

  switch (interpolation.strategy) {
    case 'integer':
      return Math.round(interpolated);

    case 'snap-grid':
      return Math.round(interpolated / interpolation.increment) * interpolation.increment;

    default:
      return Math.round(interpolated);
  }
}

/**
 * TEXT interpolation - string transitions
 */
function interpolateText(
  start: unknown,
  end: unknown,
  progress: number,
  interpolation: Extract<Interpolation, { family: 'text' }>
): string {
  const endStr = String(end);

  switch (interpolation.strategy) {
    case 'char-reveal': {
      const charsToShow = Math.round(endStr.length * progress);
      return endStr.substring(0, charsToShow);
    }

    case 'word-reveal': {
      const separator = interpolation.separator ?? ' ';
      const words = endStr.split(separator);
      const wordsToShow = Math.round(words.length * progress);
      return words.slice(0, wordsToShow).join(separator);
    }

    default:
      return progress >= 1 ? endStr : String(start);
  }
}

/**
 * Get easing function for continuous interpolation strategies
 */
function getEasingFunction(strategy: string): (t: number) => number {
  switch (strategy) {
    case 'linear':
      return (t) => t;

    case 'ease-in':
      return BezierEasing(0.42, 0, 1.0, 1.0);

    case 'ease-out':
      return BezierEasing(0, 0, 0.58, 1.0);

    case 'ease-in-out':
      return BezierEasing(0.42, 0, 0.58, 1.0);

    default:
      return (t) => t;
  }
}

export function getPropertyValue(
  keyframes: Keyframe[],
  property: AnimatableProperty,
  currentTime: number
): unknown {
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
      return interpolateValue(startKf.value, endKf.value, progress, startKf.interpolation);
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
    const animatedValue = getPropertyValue(keyframes, property, currentTime);

    if (animatedValue !== null && animatedValue !== undefined) {
      animatedProps[meta.name] = animatedValue;
    }
  }

  return animatedProps;
}

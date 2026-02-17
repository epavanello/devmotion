/**
 * Animation interpolation and easing functions
 */
import BezierEasing from 'bezier-easing';
import { colord } from 'colord';
import type { Interpolation, Keyframe, AnimatableProperty, LayerStyle } from '$lib/types/animation';
import type { PropertyMetadata } from '$lib/layers/base';
import type { ContinuousInterpolationStrategy } from '$lib/schemas/animation';

/**
 * Main interpolation function - dispatches to family-specific interpolators
 */
export function interpolateValue(
  startValue: unknown,
  endValue: unknown,
  progress: number,
  interpolation?: Interpolation
): unknown {
  if (!interpolation) {
    return endValue;
  }
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
      return progress >= 1 ? endValue : startValue;
  }
}

/**
 * CONTINUOUS interpolation - smooth numeric transitions with easing
 * Also supports color interpolation in RGB space
 */
function interpolateContinuous(
  start: unknown,
  end: unknown,
  progress: number,
  strategy: ContinuousInterpolationStrategy
): number | string {
  // Apply easing curve based on strategy
  const easing = getEasingFunction(strategy);
  const easedProgress = easing(progress);

  // Handle color interpolation
  if (typeof start === 'string' && typeof end === 'string') {
    const startColor = colord(start);
    const endColor = colord(end);

    if (startColor.isValid() && endColor.isValid()) {
      const startRgb = startColor.toRgb();
      const endRgb = endColor.toRgb();

      const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * easedProgress);
      const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * easedProgress);
      const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * easedProgress);
      const a = startRgb.a + (endRgb.a - startRgb.a) * easedProgress;

      return colord({ r, g, b, a }).toHex();
    }
  }

  // Handle numeric interpolation
  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new Error('continuous interpolation requires numeric or color values');
  }

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
 * Find the common prefix between two strings
 */
function getCommonPrefix(str1: string, str2: string): string {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return str1.substring(0, i);
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
  const startStr = String(start);
  const endStr = String(end);

  // If start and end are the same, no animation needed
  if (startStr === endStr) {
    return endStr;
  }

  switch (interpolation.strategy) {
    case 'char-reveal': {
      // Find common prefix to preserve common characters
      const commonPrefix = getCommonPrefix(startStr, endStr);
      const suffixToAnimate = endStr.substring(commonPrefix.length);

      const suffixCharsToShow = Math.round(suffixToAnimate.length * progress);
      return commonPrefix + suffixToAnimate.substring(0, suffixCharsToShow);
    }

    case 'word-reveal': {
      const separator = interpolation.separator ?? ' ';
      const startWords = startStr.split(separator);
      const endWords = endStr.split(separator);

      // Find common prefix of words to preserve common words
      let commonWordCount = 0;
      while (
        commonWordCount < startWords.length &&
        commonWordCount < endWords.length &&
        startWords[commonWordCount] === endWords[commonWordCount]
      ) {
        commonWordCount++;
      }

      const wordsToAnimate = endWords.slice(commonWordCount);
      const wordsToShow = Math.round(wordsToAnimate.length * progress);

      return [...endWords.slice(0, commonWordCount), ...wordsToAnimate.slice(0, wordsToShow)].join(
        separator
      );
    }

    default:
      return progress >= 1 ? endStr : startStr;
  }
}

/**
 * Bounce easing helper (easeOutBounce is the base, others derive from it)
 */
function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

/**
 * Get easing function for continuous interpolation strategies
 */
function getEasingFunction(strategy: ContinuousInterpolationStrategy): (t: number) => number {
  switch (strategy) {
    // CSS standard
    case 'linear':
      return (t) => t;
    case 'ease-in':
      return BezierEasing(0.42, 0, 1.0, 1.0);
    case 'ease-out':
      return BezierEasing(0, 0, 0.58, 1.0);
    case 'ease-in-out':
      return BezierEasing(0.42, 0, 0.58, 1.0);

    // Quad (power of 2)
    case 'ease-in-quad':
      return BezierEasing(0.55, 0.085, 0.68, 0.53);
    case 'ease-out-quad':
      return BezierEasing(0.25, 0.46, 0.45, 0.94);
    case 'ease-in-out-quad':
      return BezierEasing(0.455, 0.03, 0.515, 0.955);

    // Cubic (power of 3)
    case 'ease-in-cubic':
      return BezierEasing(0.55, 0.055, 0.675, 0.19);
    case 'ease-out-cubic':
      return BezierEasing(0.215, 0.61, 0.355, 1);
    case 'ease-in-out-cubic':
      return BezierEasing(0.645, 0.045, 0.355, 1);

    // Quart (power of 4)
    case 'ease-in-quart':
      return BezierEasing(0.895, 0.03, 0.685, 0.22);
    case 'ease-out-quart':
      return BezierEasing(0.165, 0.84, 0.44, 1);
    case 'ease-in-out-quart':
      return BezierEasing(0.77, 0, 0.175, 1);

    // Quint (power of 5)
    case 'ease-in-quint':
      return BezierEasing(0.755, 0.05, 0.855, 0.06);
    case 'ease-out-quint':
      return BezierEasing(0.23, 1, 0.32, 1);
    case 'ease-in-out-quint':
      return BezierEasing(0.86, 0, 0.07, 1);

    // Sine
    case 'ease-in-sine':
      return BezierEasing(0.47, 0, 0.745, 0.715);
    case 'ease-out-sine':
      return BezierEasing(0.39, 0.575, 0.565, 1);
    case 'ease-in-out-sine':
      return BezierEasing(0.445, 0.05, 0.55, 0.95);

    // Expo
    case 'ease-in-expo':
      return BezierEasing(0.95, 0.05, 0.795, 0.035);
    case 'ease-out-expo':
      return BezierEasing(0.19, 1, 0.22, 1);
    case 'ease-in-out-expo':
      return BezierEasing(1, 0, 0, 1);

    // Circ
    case 'ease-in-circ':
      return BezierEasing(0.6, 0.04, 0.98, 0.335);
    case 'ease-out-circ':
      return BezierEasing(0.075, 0.82, 0.165, 1);
    case 'ease-in-out-circ':
      return BezierEasing(0.785, 0.135, 0.15, 0.86);

    // Back (overshoots)
    case 'ease-in-back':
      return BezierEasing(0.6, -0.28, 0.735, 0.045);
    case 'ease-out-back':
      return BezierEasing(0.175, 0.885, 0.32, 1.275);
    case 'ease-in-out-back':
      return BezierEasing(0.68, -0.55, 0.265, 1.55);

    // Bounce (custom math — cannot be represented as cubic bezier)
    case 'ease-out-bounce':
      return easeOutBounce;
    case 'ease-in-bounce':
      return (t) => 1 - easeOutBounce(1 - t);
    case 'ease-in-out-bounce':
      return (t) =>
        t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;

    // Elastic (custom math — cannot be represented as cubic bezier)
    case 'ease-in-elastic':
      return (t) => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
      };
    case 'ease-out-elastic':
      return (t) => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
      };
    case 'ease-in-out-elastic':
      return (t) => {
        if (t === 0 || t === 1) return t;
        const c5 = (2 * Math.PI) / 4.5;
        return t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
      };

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
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  dropShadowX?: number;
  dropShadowY?: number;
  dropShadowBlur?: number;
  dropShadowColor?: string;
} {
  const style: Partial<LayerStyle> = {};

  const opacity = getPropertyValue(keyframes, 'opacity', currentTime);
  if (opacity !== null) {
    style.opacity = opacity as number;
  }

  // CSS filter properties
  const blur = getPropertyValue(keyframes, 'blur', currentTime);
  if (blur !== null) {
    style.blur = blur as number;
  }

  const brightness = getPropertyValue(keyframes, 'brightness', currentTime);
  if (brightness !== null) {
    style.brightness = brightness as number;
  }
  const contrast = getPropertyValue(keyframes, 'contrast', currentTime);
  if (contrast !== null) {
    style.contrast = contrast as number;
  }

  const saturate = getPropertyValue(keyframes, 'saturate', currentTime);
  if (saturate !== null) {
    style.saturate = saturate as number;
  }

  const dropShadowX = getPropertyValue(keyframes, 'dropShadowX', currentTime);
  if (dropShadowX !== null) {
    style.dropShadowX = dropShadowX as number;
  }

  const dropShadowY = getPropertyValue(keyframes, 'dropShadowY', currentTime);
  if (dropShadowY !== null) {
    style.dropShadowY = dropShadowY as number;
  }

  const dropShadowBlur = getPropertyValue(keyframes, 'dropShadowBlur', currentTime);
  if (dropShadowBlur !== null) {
    style.dropShadowBlur = dropShadowBlur as number;
  }

  const dropShadowColor = getPropertyValue(keyframes, 'dropShadowColor', currentTime);
  if (dropShadowColor !== null) {
    style.dropShadowColor = dropShadowColor as string;
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

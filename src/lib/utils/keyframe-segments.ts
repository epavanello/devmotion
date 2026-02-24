/**
 * Utilities for grouping keyframes into interpolation segments
 */
import type { Keyframe, AnimatableProperty, Interpolation } from '$lib/types/animation';

/**
 * Represents a segment of interpolation between two keyframes
 * or a final keyframe with no successor
 */
export interface KeyframeSegment {
  /** Starting keyframe of this segment */
  startKeyframe: Keyframe;
  /** Ending keyframe (undefined if this is the final keyframe) */
  endKeyframe?: Keyframe;
  /** Property being animated */
  property: AnimatableProperty;
  /** Interpolation strategy (from startKeyframe) */
  interpolation?: Interpolation;
  /** Whether this is the final keyframe (no interpolation to next) */
  isFinal: boolean;
  /** Whether this is a hold segment (same value as next keyframe, no real transition) */
  isHold: boolean;
}

/**
 * Group keyframes for a specific property into interpolation segments
 * Each segment represents a transition FROM one keyframe TO another
 * The last keyframe becomes a "final" segment with no end keyframe
 */
export function groupKeyframesIntoSegments(
  keyframes: Keyframe[],
  property: AnimatableProperty
): KeyframeSegment[] {
  const propertyKeyframes = keyframes
    .filter((kf) => kf.property === property)
    .sort((a, b) => a.time - b.time);

  if (propertyKeyframes.length === 0) return [];

  return propertyKeyframes.map((kf, i) => {
    const endKeyframe = propertyKeyframes[i + 1];
    const isFinal = !endKeyframe;
    const isHold = !isFinal && kf.value === endKeyframe.value;

    return {
      startKeyframe: kf,
      endKeyframe,
      property,
      interpolation: kf.interpolation,
      isFinal,
      isHold
    };
  });
}

/**
 * Get all unique properties that have keyframes
 */
export function getUniqueProperties(keyframes: Keyframe[]): AnimatableProperty[] {
  const properties = new Set<AnimatableProperty>();
  for (const kf of keyframes) {
    properties.add(kf.property);
  }
  return Array.from(properties).sort();
}

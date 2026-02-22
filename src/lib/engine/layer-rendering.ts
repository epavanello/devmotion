/**
 * Shared layer rendering utilities
 * Used by both canvas rendering and frame cache preparation
 */
import type { Transform } from '$lib/types/animation';
import type { TypedLayer } from '$lib/layers/typed-registry';
import type { PresetKeyframe } from './presets';
import {
  getAnimatedTransform,
  getAnimatedStyle,
  getAnimatedProps,
  interpolateValue
} from './interpolation';
import { getLayerSchema } from '$lib/layers/registry';
import { extractPropertyMetadata } from '$lib/layers/base';
import { getPresetById } from './presets';

/**
 * Get animated transform for a layer, merging base transform with animated values and transitions.
 *
 * Priority: transition presets > keyframe animations > base layer values.
 * Position and rotation preset values are offsets added to the base.
 * Scale and opacity preset values are multiplicative with the base.
 */
export function getLayerTransform(
  layer: TypedLayer,
  currentTime: number,
  projectDuration: number
): Transform {
  const animatedTransform = getAnimatedTransform(layer.keyframes, currentTime);
  const transition = computeTransitionValues(layer, currentTime, projectDuration);

  const baseX = animatedTransform.position?.x ?? layer.transform.position.x;
  const baseY = animatedTransform.position?.y ?? layer.transform.position.y;
  const baseZ = animatedTransform.position?.z ?? layer.transform.position.z;

  const baseRotX = animatedTransform.rotation?.x ?? layer.transform.rotation.x;
  const baseRotY = animatedTransform.rotation?.y ?? layer.transform.rotation.y;
  const baseRotZ = animatedTransform.rotation?.z ?? layer.transform.rotation.z;

  const baseSX = animatedTransform.scale?.x ?? layer.transform.scale.x;
  const baseSY = animatedTransform.scale?.y ?? layer.transform.scale.y;

  return {
    position: {
      x: baseX + (transition.positionOffset?.x ?? 0),
      y: baseY + (transition.positionOffset?.y ?? 0),
      z: baseZ + (transition.positionOffset?.z ?? 0)
    },
    rotation: {
      x: baseRotX + (transition.rotationOffset?.x ?? 0),
      y: baseRotY + (transition.rotationOffset?.y ?? 0),
      z: baseRotZ + (transition.rotationOffset?.z ?? 0)
    },
    scale: {
      x: baseSX * (transition.scaleFactor?.x ?? 1),
      y: baseSY * (transition.scaleFactor?.y ?? 1)
    },
    anchor: layer.transform.anchor ?? 'center'
  };
}

/**
 * Get animated style for a layer, merging base style with animated values and transitions.
 * Opacity from transitions is multiplied with the base opacity.
 */
export function getLayerStyle(layer: TypedLayer, currentTime: number, projectDuration: number) {
  const animatedStyle = getAnimatedStyle(layer.keyframes, currentTime);
  const transition = computeTransitionValues(layer, currentTime, projectDuration);

  const baseOpacity = animatedStyle.opacity ?? layer.style.opacity;

  return {
    opacity: baseOpacity * (transition.opacityFactor ?? 1),
    blur: transition.blur ?? animatedStyle.blur ?? layer.style.blur ?? 0,
    brightness: transition.brightness ?? animatedStyle.brightness ?? layer.style.brightness ?? 1,
    contrast: transition.contrast ?? animatedStyle.contrast ?? layer.style.contrast ?? 1,
    saturate: transition.saturate ?? animatedStyle.saturate ?? layer.style.saturate ?? 1,
    dropShadowX: animatedStyle.dropShadowX ?? layer.style.dropShadowX ?? 0,
    dropShadowY: animatedStyle.dropShadowY ?? layer.style.dropShadowY ?? 0,
    dropShadowBlur: animatedStyle.dropShadowBlur ?? layer.style.dropShadowBlur ?? 0,
    dropShadowColor: animatedStyle.dropShadowColor ?? layer.style.dropShadowColor ?? 'transparent'
  };
}

/**
 * Get animated props for a layer, merging base props with animated values
 */
export function getLayerProps(layer: TypedLayer, currentTime: number): Record<string, unknown> {
  const schema = getLayerSchema(layer.type);
  const propsMetadata = extractPropertyMetadata(schema);
  return getAnimatedProps(layer.keyframes, layer.props, propsMetadata, currentTime);
}

// ============================================
// Transition system
// ============================================

/**
 * Computed transition values as offsets/factors to apply on top of base values.
 * Position/rotation = additive offsets. Scale/opacity = multiplicative factors.
 */
interface TransitionValues {
  positionOffset?: { x: number; y: number; z: number };
  rotationOffset?: { x: number; y: number; z: number };
  scaleFactor?: { x: number; y: number };
  opacityFactor?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
}

/**
 * Compute transition values from enter/exit presets.
 * Returns offsets and factors that should be applied to the base values.
 */
function computeTransitionValues(
  layer: TypedLayer,
  currentTime: number,
  projectDuration: number
): TransitionValues {
  const enterTime = layer.enterTime ?? 0;
  const exitTime = layer.exitTime ?? projectDuration;

  let result: TransitionValues = {};

  // Apply enter transition if within its duration
  if (layer.enterTransition && currentTime >= enterTime) {
    const timeSinceEnter = currentTime - enterTime;
    if (timeSinceEnter <= layer.enterTransition.duration) {
      const preset = getPresetById(layer.enterTransition.presetId);
      if (preset) {
        result = mergeTransitionValues(
          result,
          interpolatePresetKeyframes(
            preset.keyframes,
            timeSinceEnter,
            layer.enterTransition.duration
          )
        );
      }
    }
  }

  // Apply exit transition if within its duration
  if (layer.exitTransition && currentTime <= exitTime) {
    const timeUntilExit = exitTime - currentTime;
    if (timeUntilExit <= layer.exitTransition.duration) {
      const preset = getPresetById(layer.exitTransition.presetId);
      if (preset) {
        const transitionProgress = layer.exitTransition.duration - timeUntilExit;
        result = mergeTransitionValues(
          result,
          interpolatePresetKeyframes(
            preset.keyframes,
            transitionProgress,
            layer.exitTransition.duration
          )
        );
      }
    }
  }

  return result;
}

/**
 * Interpolate preset keyframes at a given absolute time within a duration.
 * Returns transition values as offsets/factors relative to the layer's resting state.
 *
 * Convention: preset keyframe values at time=1 represent the "resting" state:
 * - position 0 = no offset from base position
 * - scale 1 = 100% of base scale
 * - opacity 1 = 100% of base opacity
 * - rotation 0 = no offset from base rotation
 */
function interpolatePresetKeyframes(
  presetKeyframes: PresetKeyframe[],
  currentTime: number,
  duration: number
): TransitionValues {
  const result: TransitionValues = {};

  // Scale preset keyframe times to actual duration
  const scaledKeyframes = presetKeyframes.map((kf) => ({
    ...kf,
    time: kf.time * duration
  }));

  // Group by property
  const byProperty = new Map<string, typeof scaledKeyframes>();
  for (const kf of scaledKeyframes) {
    const existing = byProperty.get(kf.property) ?? [];
    byProperty.set(kf.property, [...existing, kf]);
  }

  for (const [property, keyframes] of byProperty) {
    keyframes.sort((a, b) => a.time - b.time);

    // Find surrounding keyframes
    let prevKf = keyframes[0];
    let nextKf = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
        prevKf = keyframes[i];
        nextKf = keyframes[i + 1];
        break;
      }
    }

    const progress =
      prevKf.time === nextKf.time ? 1 : (currentTime - prevKf.time) / (nextKf.time - prevKf.time);

    const value = interpolateValue(
      prevKf.value,
      nextKf.value,
      Math.max(0, Math.min(1, progress)),
      nextKf.interpolation ?? { family: 'continuous', strategy: 'ease-in-out' }
    ) as number;

    // Map to offsets/factors
    // Position: value IS the offset (at rest = 0)
    if (property === 'position.x') {
      if (!result.positionOffset) result.positionOffset = { x: 0, y: 0, z: 0 };
      result.positionOffset.x = value;
    } else if (property === 'position.y') {
      if (!result.positionOffset) result.positionOffset = { x: 0, y: 0, z: 0 };
      result.positionOffset.y = value;
    } else if (property === 'position.z') {
      if (!result.positionOffset) result.positionOffset = { x: 0, y: 0, z: 0 };
      result.positionOffset.z = value;
    }
    // Scale: value IS the factor (at rest = 1)
    else if (property === 'scale.x') {
      if (!result.scaleFactor) result.scaleFactor = { x: 1, y: 1 };
      result.scaleFactor.x = value;
    } else if (property === 'scale.y') {
      if (!result.scaleFactor) result.scaleFactor = { x: 1, y: 1 };
      result.scaleFactor.y = value;
    }
    // Rotation: value IS the offset (at rest = 0)
    else if (property === 'rotation.x') {
      if (!result.rotationOffset) result.rotationOffset = { x: 0, y: 0, z: 0 };
      result.rotationOffset.x = value;
    } else if (property === 'rotation.y') {
      if (!result.rotationOffset) result.rotationOffset = { x: 0, y: 0, z: 0 };
      result.rotationOffset.y = value;
    } else if (property === 'rotation.z') {
      if (!result.rotationOffset) result.rotationOffset = { x: 0, y: 0, z: 0 };
      result.rotationOffset.z = value;
    }
    // Opacity: value IS the factor (at rest = 1)
    else if (property === 'opacity') {
      result.opacityFactor = value;
    }
    // Style filters: absolute replacement
    else if (property === 'blur') result.blur = value;
    else if (property === 'brightness') result.brightness = value;
    else if (property === 'contrast') result.contrast = value;
    else if (property === 'saturate') result.saturate = value;
  }

  return result;
}

function mergeTransitionValues(a: TransitionValues, b: TransitionValues): TransitionValues {
  return {
    positionOffset: b.positionOffset ?? a.positionOffset,
    rotationOffset: b.rotationOffset ?? a.rotationOffset,
    scaleFactor: b.scaleFactor ?? a.scaleFactor,
    opacityFactor:
      a.opacityFactor !== undefined && b.opacityFactor !== undefined
        ? a.opacityFactor * b.opacityFactor
        : (b.opacityFactor ?? a.opacityFactor),
    blur: b.blur ?? a.blur,
    brightness: b.brightness ?? a.brightness,
    contrast: b.contrast ?? a.contrast,
    saturate: b.saturate ?? a.saturate
  };
}

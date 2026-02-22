/**
 * Shared layer rendering utilities
 * Used by both canvas rendering and frame cache preparation
 */
import type { Transform, Keyframe, LayerStyle } from '$lib/types/animation';
import type { TypedLayer } from '$lib/layers/typed-registry';
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
 * Get animated transform for a layer, merging base transform with animated values and transitions
 */
export function getLayerTransform(
  layer: TypedLayer,
  currentTime: number,
  projectDuration: number
): Transform {
  const animatedTransform = getAnimatedTransform(layer.keyframes, currentTime);
  const { transform: transitionTransform } = applyTransitionPresets(
    layer,
    currentTime,
    projectDuration
  );

  return {
    position: {
      x:
        transitionTransform.position?.x ??
        animatedTransform.position?.x ??
        layer.transform.position.x,
      y:
        transitionTransform.position?.y ??
        animatedTransform.position?.y ??
        layer.transform.position.y,
      z:
        transitionTransform.position?.z ??
        animatedTransform.position?.z ??
        layer.transform.position.z
    },
    rotation: {
      x:
        transitionTransform.rotation?.x ??
        animatedTransform.rotation?.x ??
        layer.transform.rotation.x,
      y:
        transitionTransform.rotation?.y ??
        animatedTransform.rotation?.y ??
        layer.transform.rotation.y,
      z:
        transitionTransform.rotation?.z ??
        animatedTransform.rotation?.z ??
        layer.transform.rotation.z
    },
    scale: {
      x: transitionTransform.scale?.x ?? animatedTransform.scale?.x ?? layer.transform.scale.x,
      y: transitionTransform.scale?.y ?? animatedTransform.scale?.y ?? layer.transform.scale.y
    },
    anchor: layer.transform.anchor ?? 'center'
  };
}

/**
 * Get animated style for a layer, merging base style with animated values and transitions
 */
export function getLayerStyle(layer: TypedLayer, currentTime: number, projectDuration: number) {
  const animatedStyle = getAnimatedStyle(layer.keyframes, currentTime);
  const { style: transitionStyle } = applyTransitionPresets(layer, currentTime, projectDuration);

  return {
    opacity: transitionStyle.opacity ?? animatedStyle.opacity ?? layer.style.opacity,
    blur: transitionStyle.blur ?? animatedStyle.blur ?? layer.style.blur ?? 0,
    brightness:
      transitionStyle.brightness ?? animatedStyle.brightness ?? layer.style.brightness ?? 1,
    contrast: transitionStyle.contrast ?? animatedStyle.contrast ?? layer.style.contrast ?? 1,
    saturate: transitionStyle.saturate ?? animatedStyle.saturate ?? layer.style.saturate ?? 1,
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

/**
 * Apply transition presets to transform/style based on enter/exit time
 * Returns additional transform/style modifications to merge with base values
 */
export function applyTransitionPresets(
  layer: TypedLayer,
  currentTime: number,
  projectDuration: number
): {
  transform: Partial<Transform>;
  style: Partial<LayerStyle>;
} {
  const enterTime = layer.enterTime ?? 0;
  const exitTime = layer.exitTime ?? projectDuration;

  let transitionTransform: Partial<Transform> = {};
  let transitionStyle: Partial<LayerStyle> = {};

  // Apply enter transition if within duration
  if (layer.enterTransition && currentTime >= enterTime) {
    const timeSinceEnter = currentTime - enterTime;
    if (timeSinceEnter <= layer.enterTransition.duration) {
      const preset = getPresetById(layer.enterTransition.presetId);
      if (preset) {
        const { transform, style } = applyPresetAtTime(
          preset.keyframes,
          timeSinceEnter,
          layer.enterTransition.duration
        );
        transitionTransform = { ...transitionTransform, ...transform };
        transitionStyle = { ...transitionStyle, ...style };
      }
    }
  }

  // Apply exit transition if within duration
  if (layer.exitTransition && currentTime <= exitTime) {
    const timeUntilExit = exitTime - currentTime;
    if (timeUntilExit <= layer.exitTransition.duration) {
      const preset = getPresetById(layer.exitTransition.presetId);
      if (preset) {
        // For exit transitions, we interpolate from end backwards
        const transitionProgress = layer.exitTransition.duration - timeUntilExit;
        const { transform, style } = applyPresetAtTime(
          preset.keyframes,
          transitionProgress,
          layer.exitTransition.duration
        );
        transitionTransform = { ...transitionTransform, ...transform };
        transitionStyle = { ...transitionStyle, ...style };
      }
    }
  }

  return { transform: transitionTransform, style: transitionStyle };
}

/**
 * Apply a preset's keyframes at a specific normalized time
 */
function applyPresetAtTime(
  presetKeyframes: Omit<Keyframe, 'id'>[],
  currentTime: number,
  duration: number
): {
  transform: Partial<Transform>;
  style: Partial<LayerStyle>;
} {
  const transform: Partial<Transform> = {};
  const style: Partial<LayerStyle> = {};

  // Scale preset keyframe times to actual duration
  const scaledKeyframes = presetKeyframes.map((kf) => ({
    ...kf,
    time: kf.time * duration
  }));

  // Group keyframes by property
  const propertiesByName = new Map<string, typeof scaledKeyframes>();
  for (const kf of scaledKeyframes) {
    const existing = propertiesByName.get(kf.property) ?? [];
    propertiesByName.set(kf.property, [...existing, kf]);
  }

  // Interpolate each property
  for (const [property, keyframes] of propertiesByName) {
    // Sort by time
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

    // Calculate progress between keyframes (0-1)
    const progress =
      prevKf.time === nextKf.time ? 1 : (currentTime - prevKf.time) / (nextKf.time - prevKf.time);

    // Interpolate value using the interpolation function
    const value = interpolateValue(
      prevKf.value,
      nextKf.value,
      Math.max(0, Math.min(1, progress)),
      nextKf.interpolation ?? { family: 'continuous', strategy: 'ease-in-out' }
    );

    // Map to transform or style
    if (property === 'position.x') {
      if (!transform.position) transform.position = { x: 0, y: 0, z: 0 };
      transform.position.x = value as number;
    } else if (property === 'position.y') {
      if (!transform.position) transform.position = { x: 0, y: 0, z: 0 };
      transform.position.y = value as number;
    } else if (property === 'position.z') {
      if (!transform.position) transform.position = { x: 0, y: 0, z: 0 };
      transform.position.z = value as number;
    } else if (property === 'scale.x') {
      if (!transform.scale) transform.scale = { x: 1, y: 1 };
      transform.scale.x = value as number;
    } else if (property === 'scale.y') {
      if (!transform.scale) transform.scale = { x: 1, y: 1 };
      transform.scale.y = value as number;
    } else if (property === 'rotation.x') {
      if (!transform.rotation) transform.rotation = { x: 0, y: 0, z: 0 };
      transform.rotation.x = value as number;
    } else if (property === 'rotation.y') {
      if (!transform.rotation) transform.rotation = { x: 0, y: 0, z: 0 };
      transform.rotation.y = value as number;
    } else if (property === 'rotation.z') {
      if (!transform.rotation) transform.rotation = { x: 0, y: 0, z: 0 };
      transform.rotation.z = value as number;
    } else if (property === 'opacity') style.opacity = value as number;
    else if (property === 'blur') style.blur = value as number;
    else if (property === 'brightness') style.brightness = value as number;
    else if (property === 'contrast') style.contrast = value as number;
    else if (property === 'saturate') style.saturate = value as number;
  }

  return { transform, style };
}

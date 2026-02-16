/**
 * Shared layer rendering utilities
 * Used by both canvas rendering and frame cache preparation
 */
import type { Transform } from '$lib/types/animation';
import type { TypedLayer } from '$lib/layers/typed-registry';
import { getAnimatedTransform, getAnimatedStyle, getAnimatedProps } from './interpolation';
import { getLayerSchema } from '$lib/layers/registry';
import { extractPropertyMetadata } from '$lib/layers/base';

/**
 * Get animated transform for a layer, merging base transform with animated values
 */
export function getLayerTransform(layer: TypedLayer, currentTime: number): Transform {
  const animatedTransform = getAnimatedTransform(layer.keyframes, currentTime);

  return {
    position: {
      x: animatedTransform.position?.x ?? layer.transform.position.x,
      y: animatedTransform.position?.y ?? layer.transform.position.y,
      z: animatedTransform.position?.z ?? layer.transform.position.z
    },
    rotation: {
      x: animatedTransform.rotation?.x ?? layer.transform.rotation.x,
      y: animatedTransform.rotation?.y ?? layer.transform.rotation.y,
      z: animatedTransform.rotation?.z ?? layer.transform.rotation.z
    },
    scale: {
      x: animatedTransform.scale?.x ?? layer.transform.scale.x,
      y: animatedTransform.scale?.y ?? layer.transform.scale.y
    },
    anchor: layer.transform.anchor ?? 'center'
  };
}

/**
 * Get animated style for a layer
 */
export function getLayerStyle(layer: TypedLayer, currentTime: number) {
  const animatedStyle = getAnimatedStyle(layer.keyframes, currentTime);

  return {
    opacity: animatedStyle.opacity ?? layer.style.opacity,
    blur: animatedStyle.blur ?? layer.style.blur ?? 0,
    brightness: animatedStyle.brightness ?? layer.style.brightness ?? 1,
    contrast: animatedStyle.contrast ?? layer.style.contrast ?? 1,
    saturate: animatedStyle.saturate ?? layer.style.saturate ?? 1,
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

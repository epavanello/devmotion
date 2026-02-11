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
    x: animatedTransform.position?.x ?? layer.transform.x,
    y: animatedTransform.position?.y ?? layer.transform.y,
    z: animatedTransform.position?.z ?? layer.transform.z,
    rotationX: animatedTransform.rotation?.x ?? layer.transform.rotationX,
    rotationY: animatedTransform.rotation?.y ?? layer.transform.rotationY,
    rotationZ: animatedTransform.rotation?.z ?? layer.transform.rotationZ,
    scaleX: animatedTransform.scale?.x ?? layer.transform.scaleX,
    scaleY: animatedTransform.scale?.y ?? layer.transform.scaleY,
    scaleZ: animatedTransform.scale?.z ?? layer.transform.scaleZ,
    anchor: layer.transform.anchor ?? 'center'
  };
}

/**
 * Get animated style for a layer
 */
export function getLayerStyle(layer: TypedLayer, currentTime: number) {
  const animatedStyle = getAnimatedStyle(layer.keyframes, currentTime);

  return {
    opacity: animatedStyle.opacity ?? layer.style.opacity
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

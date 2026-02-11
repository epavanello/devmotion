/**
 * Type-safe layer type mappings
 * Re-exports from typed-registry for convenient access
 */
export type { LayerPropsMap, LayerProps, LayerTypeString } from './typed-registry';

import type { TypedLayer, LayerTypeString } from './typed-registry';

/**
 * Type guard to check if a layer is of a specific type
 * Use this to narrow a generic Layer to Layer<T>
 *
 * @example
 * ```typescript
 * if (isLayerType(layer, 'video')) {
 *   layer.props.src // ✅ TypeScript knows layer is Layer<'video'>
 * }
 * ```
 */
export function isLayerType<T extends LayerTypeString>(
  layer: TypedLayer,
  type: T
): layer is TypedLayer<T> {
  return layer.type === type;
}

/**
 * Cast a generic Layer to Layer<T>
 * Use only when you're certain of the layer type
 *
 * @example
 * ```typescript
 * const videoLayer = asLayerType(layer, 'video');
 * videoLayer.props.src // ✅ TypeScript knows this is a string
 * ```
 */
export function asLayerType<T extends LayerTypeString>(layer: TypedLayer, type: T): TypedLayer<T> {
  if (layer.type !== type) {
    throw new Error(`Expected layer type '${type}' but got '${layer.type}'`);
  }
  return layer as TypedLayer<T>;
}

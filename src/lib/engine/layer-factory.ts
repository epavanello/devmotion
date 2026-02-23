/**
 * Generic layer factory using the component registry
 */
import { nanoid } from 'nanoid';
import type { Keyframe, Transform } from '$lib/types/animation';
import { getLayerDefinition } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';
import type { LayerProps, LayerTypeString } from '$lib/layers/layer-types';
import type { TypedLayer } from '$lib/layers/typed-registry';
import { calculateCoverDimensions, ASPECT_RATIOS } from '$lib/utils/media';
import { defaultLayerStyle, defaultTransform } from '$lib/schemas/base';
import type { LiteralUnion } from 'type-fest';

/**
 * Create a new layer of the specified type
 * @param type - The layer type from the registry
 * @param override - Optional overrides for props, transform, and layer fields
 * @returns A new layer with inferred prop types based on the layer type
 */
export function createLayer<T extends LayerTypeString>(
  type: LiteralUnion<T, string>,
  override?: {
    props?: Partial<LayerProps<T>>;
    transform?: Partial<Transform>;
    layer?: Partial<Omit<TypedLayer, 'transform' | 'style' | 'keyframes' | 'props'>>;
    projectDimensions?: { width: number; height: number };
  }
): TypedLayer {
  const definition = getLayerDefinition(type);

  // Extract default values from the Zod schema
  const defaultProps = extractDefaultValues(definition.schema);

  // Override context-dependent defaults if dimensions provided
  if (type === 'video' || type === 'image') {
    if (override?.projectDimensions) {
      const { width, height } = calculateCoverDimensions(
        override.projectDimensions.width,
        override.projectDimensions.height,
        type === 'video' ? ASPECT_RATIOS.VIDEO_DEFAULT : ASPECT_RATIOS.IMAGE_DEFAULT
      );
      defaultProps.width = width;
      defaultProps.height = height;
    }
  }

  // Create initial keyframes for position properties
  const initialKeyframes: Keyframe[] = [];

  return {
    id: nanoid(),
    name: definition.label,
    type,
    transform: {
      ...defaultTransform(),
      ...override?.transform
    },
    style: defaultLayerStyle(),
    visible: true,
    locked: false,
    keyframes: initialKeyframes,
    props: {
      ...defaultProps,
      ...override?.props
    },
    ...(type === 'video' || type === 'audio'
      ? { contentDuration: 0, enterTime: 0, exitTime: 0, contentOffset: 0 }
      : {}),
    ...override?.layer
  };
}

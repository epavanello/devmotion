/**
 * Generic layer factory using the component registry
 */
import { nanoid } from 'nanoid';
import type { Keyframe, Interpolation, Transform } from '$lib/types/animation';
import { getLayerDefinition } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';
import type { LayerProps, LayerTypeString } from '$lib/layers/layer-types';
import type { TypedLayer } from '$lib/layers/typed-registry';

/**
 * Default interpolation for initial keyframes
 */
const defaultInterpolation: Interpolation = { family: 'continuous', strategy: 'ease-in-out' };

/**
 * Create a new layer of the specified type
 * @param type - The layer type from the registry
 * @param override - Optional overrides for props, transform, and layer fields
 * @returns A new layer with inferred prop types based on the layer type
 */
export function createLayer<T extends LayerTypeString>(
  type: T | string,
  override?: {
    props?: Partial<LayerProps<T>>;
    trasform?: Partial<Transform>;
    layer?: Partial<Omit<TypedLayer, 'transform' | 'style' | 'keyframes' | 'props'>>;
  }
): TypedLayer {
  const { x = 0, y = 0 } = override?.trasform || {};
  const definition = getLayerDefinition(type);

  // Extract default values from the Zod schema
  const defaultProps = extractDefaultValues(definition.schema);

  // Create initial keyframes for position properties
  const initialKeyframes: Keyframe[] = [
    {
      id: nanoid(),
      time: 0,
      property: 'position.x',
      value: x,
      interpolation: defaultInterpolation
    },
    {
      id: nanoid(),
      time: 0,
      property: 'position.y',
      value: y,
      interpolation: defaultInterpolation
    }
  ];

  return {
    id: nanoid(),
    name: definition.label,
    type,
    transform: {
      x,
      y,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      anchor: 'center',
      ...override?.trasform
    },
    style: {
      opacity: 1
    },
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

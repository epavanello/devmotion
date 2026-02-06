/**
 * Generic layer factory using the component registry
 */
import { nanoid } from 'nanoid';
import type { Layer, LayerType, Keyframe, Easing } from '$lib/types/animation';
import { getLayerDefinition } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';

/**
 * Default easing for initial keyframes
 */
const defaultEasing: Easing = { type: 'ease-in-out' };

/**
 * Options for creating a layer
 */
interface CreateLayerOptions {
  /** Initial position */
  x?: number;
  y?: number;
  /** Enter time - when the layer becomes visible (seconds) */
  enterTime?: number;
  /** Exit time - when the layer becomes hidden (seconds) */
  exitTime?: number;
}

/**
 * Create a new layer of the specified type
 * @param type - The layer type from the registry
 * @param propsOverrides - Optional props to override defaults
 * @param position - Initial position {x, y} or full CreateLayerOptions
 */
export function createLayer(
  type: LayerType,
  propsOverrides: Record<string, unknown> = {},
  position: { x?: number; y?: number } | CreateLayerOptions = {}
): Layer {
  const { x = 0, y = 0 } = position;
  const enterTime = 'enterTime' in position ? position.enterTime : undefined;
  const exitTime = 'exitTime' in position ? position.exitTime : undefined;
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
      easing: defaultEasing
    },
    {
      id: nanoid(),
      time: 0,
      property: 'position.y',
      value: y,
      easing: defaultEasing
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
      anchor: 'center'
    },
    style: {
      opacity: 1
    },
    visible: true,
    locked: false,
    keyframes: initialKeyframes,
    props: {
      ...defaultProps,
      ...propsOverrides
    },
    ...(enterTime !== undefined ? { enterTime } : {}),
    ...(exitTime !== undefined ? { exitTime } : {})
  };
}

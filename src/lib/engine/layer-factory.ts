/**
 * Generic layer factory using the component registry
 */
import { nanoid } from 'nanoid';
import type { Layer, LayerType } from '$lib/types/animation';
import { getLayerDefinition } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';

/**
 * Create a new layer of the specified type
 * @param type - The layer type from the registry
 * @param propsOverrides - Optional props to override defaults
 * @param position - Initial position {x, y}
 */
export function createLayer(
  type: LayerType,
  propsOverrides: Record<string, unknown> = {},
  position: { x?: number; y?: number } = {}
): Layer {
  const { x = 0, y = 0 } = position;
  const definition = getLayerDefinition(type);

  // Extract default values from the Zod schema
  const defaultProps = extractDefaultValues(definition.customPropsSchema);

  return {
    id: nanoid(),
    name: `${definition.displayName} Layer`,
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
      scaleZ: 1
    },
    style: {
      opacity: 1
    },
    visible: true,
    locked: false,
    keyframes: [],
    props: {
      ...defaultProps,
      ...propsOverrides
    }
  };
}

/**
 * Convenience function for creating text layers
 */
export function createTextLayer(x = 0, y = 0): Layer {
  return createLayer('text', {}, { x, y });
}

/**
 * Convenience function for creating shape layers
 */
export function createShapeLayer(shapeType: string, x = 0, y = 0): Layer {
  return createLayer('shape', { shapeType }, { x, y });
}

/**
 * Convenience function for creating image layers
 */
export function createImageLayer(src: string, x = 0, y = 0): Layer {
  return createLayer('image', { src }, { x, y });
}

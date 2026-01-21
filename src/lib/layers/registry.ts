/**
 * Layer component registry
 * Maps layer types to their Svelte components and Zod schemas
 */
import TextLayer, { TextLayerPropsSchema } from './TextLayer.svelte';
import ShapeLayer, { ShapeLayerPropsSchema } from './ShapeLayer.svelte';
import ImageLayer, { ImageLayerPropsSchema } from './ImageLayer.svelte';
import type { LayerComponentDefinition } from './base';

/**
 * Registry of all available layer types
 */
export const layerRegistry = {
  text: {
    type: 'text',
    displayName: 'Text',
    icon: 'Type',
    customPropsSchema: TextLayerPropsSchema,
    component: TextLayer,
    defaultProps: {
      content: 'New Text',
      fontSize: 48,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#ffffff'
    }
  } satisfies LayerComponentDefinition,

  shape: {
    type: 'shape',
    displayName: 'Shape',
    icon: 'Square',
    customPropsSchema: ShapeLayerPropsSchema,
    component: ShapeLayer,
    defaultProps: {
      shapeType: 'rectangle' as const,
      width: 200,
      height: 200,
      fill: '#4a90e2',
      stroke: '#ffffff',
      strokeWidth: 2
    }
  } satisfies LayerComponentDefinition,

  image: {
    type: 'image',
    displayName: 'Image',
    icon: 'Image',
    customPropsSchema: ImageLayerPropsSchema,
    component: ImageLayer,
    defaultProps: {
      src: '',
      width: 400,
      height: 300,
      objectFit: 'contain' as const
    }
  } satisfies LayerComponentDefinition
} as const;

/**
 * Layer type derived from registry keys
 */
export type LayerType = keyof typeof layerRegistry;

/**
 * Get layer component definition by type
 */
export function getLayerDefinition(type: LayerType): LayerComponentDefinition {
  const definition = layerRegistry[type];
  if (!definition) {
    throw new Error(`Unknown layer type: ${type}`);
  }
  return definition;
}

/**
 * Get all available layer types
 */
export function getAvailableLayerTypes(): LayerType[] {
  return Object.keys(layerRegistry) as LayerType[];
}

/**
 * Get layer component by type
 */
export function getLayerComponent(type: LayerType) {
  return getLayerDefinition(type).component;
}

/**
 * Get layer schema by type
 */
export function getLayerSchema(type: LayerType) {
  return getLayerDefinition(type).customPropsSchema;
}

/**
 * Get default props for a layer type
 */
export function getDefaultLayerProps(type: LayerType) {
  return getLayerDefinition(type).defaultProps;
}

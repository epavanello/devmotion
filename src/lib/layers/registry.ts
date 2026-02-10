/* eslint-disable @typescript-eslint/no-explicit-any */
const staticLayers = import.meta.glob('./components/*.svelte', { eager: true });

import type { Layer, AnimatableProperty } from '$lib/schemas/animation';
import type { LayerComponentDefinition } from './base';
import type { Component } from 'svelte';
import type z from 'zod';

export type LayerMeta = {
  schema: z.ZodObject<z.ZodRawShape>;
  type: string;
  label: string;
  description: string;
  icon: Component;
  customPropertyComponents?: Record<
    string,
    {
      component: Component<{
        layer: Layer;
        onUpdateProp: (name: string, value: unknown) => void;
        addKeyframe: (property: AnimatableProperty) => void;
      }>;
    }
  >;
};

type LayerModule = {
  default: Component<any>;
  meta: LayerMeta;
};

/**
 * Registry of all available layer types
 */
export const layerRegistry: Record<string, LayerComponentDefinition> = (
  Object.values(staticLayers) as LayerModule[]
).reduce(
  (registry, layer) => {
    registry[layer.meta.type] = {
      type: layer.meta.type,
      label: layer.meta.label,
      description: layer.meta.description,
      schema: layer.meta.schema,
      component: layer.default,
      icon: layer.meta.icon,
      customPropertyComponents: layer.meta.customPropertyComponents
    };
    return registry;
  },
  {} as Record<string, LayerComponentDefinition>
);

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
  return getLayerDefinition(type).schema;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const staticLayers = import.meta.glob('./components/*.svelte', { eager: true });

import type { LayerComponentDefinition } from './base';
import type { Component, ComponentType } from 'svelte';
import type z from 'zod';

export type LayerMeta = {
  schema: z.ZodObject<z.ZodRawShape>;
  type: string;
  label: string;
  icon: Component | ComponentType;
};

type Layer = {
  component: Component<any>;
  meta: LayerMeta;
};

type LayerModule = {
  default: Component<any>;
  meta: LayerMeta;
};

const layers: Layer[] = (Object.values(staticLayers) as LayerModule[]).map((module) => ({
  component: module.default,
  meta: module.meta
}));

/**
 * Registry of all available layer types
 */
export const layerRegistry: Record<string, LayerComponentDefinition> = layers.reduce(
  (registry, layer) => {
    registry[layer.meta.type] = {
      type: layer.meta.type,
      label: layer.meta.label,
      schema: layer.meta.schema,
      component: layer.component,
      icon: layer.meta.icon
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

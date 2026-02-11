const staticLayers = import.meta.glob('./components/*.svelte', { eager: true });

import type { Layer, AnimatableProperty, Transform, LayerStyle } from '$lib/schemas/animation';
import type { LayerCategory, LayerComponentDefinition } from './base';
import type { Component } from 'svelte';
import type z from 'zod';

/** Widget component rendered in the prefix area of a property group */
export type PropertyGroupWidget = Component<{
  layer: Layer;
  groupId: string;
  currentValues: Record<string, unknown>;
  onUpdate: (propertyName: string, value: unknown) => void;
}>;

/** Definition for a group of related properties (e.g., width+height as "Size") */
export type PropertyGroup = {
  id: string;
  label: string;
  /** Optional widget in the group header (e.g., AspectRatioToggle) */
  widget?: PropertyGroupWidget;
};

/** Middleware receives a property change and can return additional linked updates */
export type PropertyMiddleware = (
  propertyName: string,
  value: unknown,
  currentValues: {
    transform: Transform;
    style: LayerStyle;
    props: Record<string, unknown>;
  }
) => Record<string, unknown>;

export type LayerMeta = {
  category: LayerCategory;
  schema: z.ZodObject<z.ZodRawShape>;
  type: string;
  label: string;
  description: string;
  icon: Component;
  /** Groups of related custom properties for grouped rendering */
  propertyGroups?: PropertyGroup[];
  /** Middleware for linked property updates (e.g., aspect ratio) */
  middleware?: PropertyMiddleware;
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
  default: Component<Record<string, unknown>>;
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
      category: layer.meta.category,
      type: layer.meta.type,
      label: layer.meta.label,
      description: layer.meta.description,
      schema: layer.meta.schema,
      component: layer.default,
      icon: layer.meta.icon,
      propertyGroups: layer.meta.propertyGroups,
      middleware: layer.meta.middleware,
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

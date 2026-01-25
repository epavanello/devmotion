/**
 * Layer component registry
 * Maps layer types to their Svelte components and Zod schemas
 */
import TextLayer, { schema as TextLayerPropsSchema } from './TextLayer.svelte';
import ShapeLayer, { schema as ShapeLayerPropsSchema } from './ShapeLayer.svelte';
import TerminalLayer, { schema as TerminalLayerPropsSchema } from './TerminalLayer.svelte';
import MouseLayer, { schema as MouseLayerPropsSchema } from './MouseLayer.svelte';
import ButtonLayer, { schema as ButtonLayerPropsSchema } from './ButtonLayer.svelte';
import PhoneLayer, { schema as PhoneLayerPropsSchema } from './PhoneLayer.svelte';
import BrowserLayer, { schema as BrowserLayerPropsSchema } from './BrowserLayer.svelte';
import IconLayer, { schema as IconLayerPropsSchema } from './IconLayer.svelte';
import DividerLayer, { schema as DividerLayerPropsSchema } from './DividerLayer.svelte';
import ProgressLayer, { schema as ProgressLayerPropsSchema } from './ProgressLayer.svelte';
import CodeLayer, { schema as CodeLayerPropsSchema } from './CodeLayer.svelte';
import type { LayerComponentDefinition } from './base';

/**
 * Registry of all available layer types
 */
export const layerRegistry: Record<string, LayerComponentDefinition> = {
  text: {
    type: 'text',
    displayName: 'Text',
    icon: 'Type',
    customPropsSchema: TextLayerPropsSchema,
    component: TextLayer
  },

  shape: {
    type: 'shape',
    displayName: 'Shape',
    icon: 'Square',
    customPropsSchema: ShapeLayerPropsSchema,
    component: ShapeLayer
  },

  terminal: {
    type: 'terminal',
    displayName: 'Terminal',
    icon: 'Terminal',
    customPropsSchema: TerminalLayerPropsSchema,
    component: TerminalLayer
  },

  mouse: {
    type: 'mouse',
    displayName: 'Mouse',
    icon: 'Pointer',
    customPropsSchema: MouseLayerPropsSchema,
    component: MouseLayer
  },

  button: {
    type: 'button',
    displayName: 'Button',
    icon: 'SquareMousePointer',
    customPropsSchema: ButtonLayerPropsSchema,
    component: ButtonLayer
  },

  phone: {
    type: 'phone',
    displayName: 'Phone',
    icon: 'Smartphone',
    customPropsSchema: PhoneLayerPropsSchema,
    component: PhoneLayer
  },

  browser: {
    type: 'browser',
    displayName: 'Browser',
    icon: 'Globe',
    customPropsSchema: BrowserLayerPropsSchema,
    component: BrowserLayer
  },

  icon: {
    type: 'icon',
    displayName: 'Icon',
    icon: 'Star',
    customPropsSchema: IconLayerPropsSchema,
    component: IconLayer
  },

  divider: {
    type: 'divider',
    displayName: 'Divider',
    icon: 'Minus',
    customPropsSchema: DividerLayerPropsSchema,
    component: DividerLayer
  },

  progress: {
    type: 'progress',
    displayName: 'Progress',
    icon: 'Loader',
    customPropsSchema: ProgressLayerPropsSchema,
    component: ProgressLayer
  },

  code: {
    type: 'code',
    displayName: 'Code',
    icon: 'Code',
    customPropsSchema: CodeLayerPropsSchema,
    component: CodeLayer
  }
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

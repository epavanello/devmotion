/**
 * Typed layer registry - infers types directly from layer meta schemas
 * This file imports all layer meta objects and extracts their prop types
 */
import type { Layer } from '$lib/schemas/animation';
import { meta as audioMeta } from './components/AudioLayer.svelte';
import { meta as browserMeta } from './components/BrowserLayer.svelte';
import { meta as buttonMeta } from './components/ButtonLayer.svelte';
import { meta as captionsMeta } from './components/CaptionsLayer.svelte';
import { meta as codeMeta } from './components/CodeLayer.svelte';
import { meta as groupMeta } from './components/GroupLayer.svelte';
import { meta as htmlMeta } from './components/HtmlLayer.svelte';
import { meta as iconMeta } from './components/IconLayer.svelte';
import { meta as imageMeta } from './components/ImageLayer.svelte';
import { meta as mouseMeta } from './components/MouseLayer.svelte';
import { meta as phoneMeta } from './components/PhoneLayer.svelte';
import { meta as shapeMeta } from './components/ShapeLayer.svelte';
import { meta as terminalMeta } from './components/TerminalLayer.svelte';
import { meta as textMeta } from './components/TextLayer.svelte';
import { meta as videoMeta } from './components/VideoLayer.svelte';

import type { z } from 'zod';

/**
 * Type-safe mapping from layer type string to props type
 * Automatically inferred from layer schemas
 */
export type LayerPropsMap = {
  audio: z.infer<typeof audioMeta.schema>;
  browser: z.infer<typeof browserMeta.schema>;
  button: z.infer<typeof buttonMeta.schema>;
  captions: z.infer<typeof captionsMeta.schema>;
  code: z.infer<typeof codeMeta.schema>;
  group: z.infer<typeof groupMeta.schema>;
  html: z.infer<typeof htmlMeta.schema>;
  icon: z.infer<typeof iconMeta.schema>;
  image: z.infer<typeof imageMeta.schema>;
  mouse: z.infer<typeof mouseMeta.schema>;
  phone: z.infer<typeof phoneMeta.schema>;
  shape: z.infer<typeof shapeMeta.schema>;
  terminal: z.infer<typeof terminalMeta.schema>;
  text: z.infer<typeof textMeta.schema>;
  video: z.infer<typeof videoMeta.schema>;
};

/**
 * Get the props type for a specific layer type
 */
export type LayerProps<T extends keyof LayerPropsMap> = LayerPropsMap[T];

/**
 * Union of all valid layer type strings
 */
export type LayerTypeString = keyof LayerPropsMap;

/**
 * Layer type with optional generic parameter for typed props
 *
 * @example
 * ```typescript
 * // Without parameter: props are Record<string, unknown>
 * const layer: Layer = { ... };
 *
 * // With parameter: props are typed based on layer type
 * const videoLayer: Layer<'video'> = { ... };
 * videoLayer.props.src // ✅ TypeScript knows this is a string
 * videoLayer.props.volume // ✅ TypeScript knows this is a number
 *
 * // Union type for multiple layer types
 * const mediaLayer: Layer<'video' | 'audio'> = { ... };
 * ```
 */
export type TypedLayer<T extends LayerTypeString = never> = [T] extends [never]
  ? Layer
  : Omit<Layer, 'props' | 'type'> & {
      type: T;
      props: LayerProps<T>;
    };

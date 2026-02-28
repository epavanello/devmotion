import type { InterpolationFamily } from '$lib/types/animation';
import type { Component } from 'svelte';
import type { TypedLayer } from '../typed-registry';
import z from 'zod';

export type CustomPropertyComponentProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
  layer: TypedLayer;
  metadata: FieldMeta;
};

/**
 * Per-field UI metadata that layer schemas can opt into via .register(fieldRegistry, …).
 * Keeps UI-rendering hints out of validation logic and out of .describe() strings.
 */
export type FieldMeta = {
  hidden?: boolean;
  readOnly?: boolean;
  /** Assign this field to a property group (e.g., 'size') for grouped rendering */
  group?: string;
  /** Supported interpolation families for this field (e.g., ['continuous', 'quantized']) */
  interpolationFamily?: InterpolationFamily | InterpolationFamily[];

  label?: string;
} & (
  | {
      /** Override the default input widget rendered for this field */
      widget?: 'textarea' | 'background' | 'color';
    }
  | {
      widget: 'multi-select';
      options: Array<{ value: string; label: string }>;
    }
  | {
      widget: 'upload';
      mediaType: 'image' | 'video' | 'audio';
    }
  | {
      widget: 'custom';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: Component<CustomPropertyComponentProps<any>>;
    }
);

/**
 * Global registry for FieldMeta.  Individual schema fields call
 *   .register(fieldRegistry, { widget: 'textarea' })
 * to opt into a non-default widget.
 */
export const fieldRegistry = z.registry<FieldMeta>();

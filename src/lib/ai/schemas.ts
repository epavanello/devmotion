/**
 * AI Tool Schemas for Progressive Animation Generation
 *
 * Tools are executed client-side, allowing the AI to see results and iterate.
 * Uses dynamic schema discovery via get_layer_info to avoid context bloat.
 */
import { z } from 'zod';
import { EasingSchema } from '$lib/schemas/animation';
import { getPresetIds } from '$lib/engine/presets';
import { tool, type InferUITools } from 'ai';
import { layerRegistry, type LayerType } from '$lib/layers/registry';
import { extractPropertyMetadata, extractDefaultValues } from '$lib/layers/base';

// ============================================
// Tool: get_layer_info
// Discover layer schema dynamically
// ============================================

export const GetLayerInfoInputSchema = z.object({
  layerType: z
    .string()
    .describe('The layer type to get info about (see available types in system prompt)')
});

export type GetLayerInfoInput = z.infer<typeof GetLayerInfoInputSchema>;

export interface GetLayerInfoOutput {
  success: boolean;
  layerType?: string;
  label?: string;
  properties?: Array<{
    name: string;
    type: string;
    description?: string;
    required: boolean;
    defaultValue?: unknown;
    options?: Array<{ value: string | number; label: string }>;
    min?: number;
    max?: number;
  }>;
  error?: string;
}

/**
 * Get layer info from registry - executed server-side
 */
export function getLayerInfo(input: GetLayerInfoInput): GetLayerInfoOutput {
  const type = input.layerType as LayerType;

  if (!layerRegistry[type]) {
    return {
      success: false,
      error: `Unknown layer type: ${input.layerType}. Check the available layer types in the system prompt.`
    };
  }

  const definition = layerRegistry[type];
  const metadata = extractPropertyMetadata(definition.schema);
  const defaults = extractDefaultValues(definition.schema);

  // Determine which properties are required (no default value)
  const properties = metadata.map((prop) => ({
    name: prop.name,
    type: prop.type,
    description: prop.description,
    required: defaults[prop.name] === undefined,
    defaultValue: defaults[prop.name],
    options: prop.options,
    min: prop.min,
    max: prop.max
  }));

  return {
    success: true,
    layerType: type,
    label: definition.label,
    properties
  };
}

// ============================================
// Tool: create_layer
// ============================================

export const CreateLayerInputSchema = z.object({
  type: z.string().describe('Layer type (use get_layer_info first to see available props)'),
  name: z.string().optional().describe('Layer name for identification'),
  position: z
    .object({
      x: z.number().default(0).describe('X position (0=center)'),
      y: z.number().default(0).describe('Y position (0=center)')
    })
    .optional(),
  props: z
    .record(z.string(), z.unknown())
    .describe('Layer-specific properties from get_layer_info'),
  animation: z
    .object({
      preset: z.string().optional().describe('Animation preset ID'),
      startTime: z.number().min(0).default(0),
      duration: z.number().min(0.1).default(0.5)
    })
    .optional()
    .describe('Optional immediate animation')
});

export type CreateLayerInput = z.infer<typeof CreateLayerInputSchema>;

export interface CreateLayerOutput {
  success: boolean;
  layerId?: string;
  layerIndex?: number;
  layerName?: string;
  message: string;
  error?: string;
}

// ============================================
// Tool: animate_layer
// ============================================

export const AnimateLayerInputSchema = z.object({
  layerId: z.string().describe('Layer ID or reference (layer_0, layer_1, or actual ID)'),
  preset: z
    .object({
      id: z.string().describe('Preset ID: ' + getPresetIds().join(', ')),
      startTime: z.number().min(0).default(0),
      duration: z.number().min(0.1).default(0.5)
    })
    .optional()
    .describe('Apply animation preset'),
  keyframes: z
    .array(
      z.object({
        time: z.number().min(0).describe('Time in seconds'),
        property: z
          .string()
          .describe(
            'Property: position.x, position.y, scale.x, scale.y, rotation.z, opacity, props.*'
          ),
        value: z.union([z.number(), z.string(), z.boolean()]),
        easing: EasingSchema.optional()
      })
    )
    .optional()
    .describe('Custom keyframes (alternative to preset)')
});

export type AnimateLayerInput = z.infer<typeof AnimateLayerInputSchema>;

export interface AnimateLayerOutput {
  success: boolean;
  layerId?: string;
  keyframesAdded?: number;
  message: string;
  error?: string;
}

// ============================================
// Tool: edit_layer
// ============================================

export const EditLayerInputSchema = z.object({
  layerId: z.string().describe('Layer ID or reference'),
  updates: z.object({
    name: z.string().optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    position: z
      .object({
        x: z.number().optional(),
        y: z.number().optional()
      })
      .optional(),
    scale: z
      .object({
        x: z.number().optional(),
        y: z.number().optional()
      })
      .optional(),
    rotation: z.number().optional().describe('Rotation in degrees'),
    opacity: z.number().min(0).max(1).optional(),
    props: z.record(z.string(), z.unknown()).optional()
  })
});

export type EditLayerInput = z.infer<typeof EditLayerInputSchema>;

export interface EditLayerOutput {
  success: boolean;
  layerId?: string;
  message: string;
  error?: string;
}

// ============================================
// Tool: remove_layer
// ============================================

export const RemoveLayerInputSchema = z.object({
  layerId: z.string().describe('Layer ID or reference to remove')
});

export type RemoveLayerInput = z.infer<typeof RemoveLayerInputSchema>;

export interface RemoveLayerOutput {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// Tool: configure_project
// ============================================

export const ConfigureProjectInputSchema = z.object({
  name: z.string().optional(),
  width: z.number().min(100).max(8192).optional(),
  height: z.number().min(100).max(8192).optional(),
  duration: z.number().min(1).max(300).optional(),
  backgroundColor: z.string().optional().describe('Hex color (e.g., #1a1a2e)')
});

export type ConfigureProjectInput = z.infer<typeof ConfigureProjectInputSchema>;

export interface ConfigureProjectOutput {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// Tool Definitions for AI SDK
// ============================================

export const animationTools = {
  get_layer_info: tool({
    description: `REQUIRED before creating a new layer type. Returns all available properties with types, defaults, and constraints.

Output: { success, layerType, label, properties: [{ name, type, description, required, defaultValue, options, min, max }] }

Example: get_layer_info({ layerType: "text" }) → shows content, fontSize, fontFamily, color, etc.`,
    inputSchema: GetLayerInfoInputSchema,
    execute: async (input) => {
      console.log('get_layer_info');
      return getLayerInfo(input);
    }
  }),

  create_layer: tool({
    description: `Create a new layer. MUST call get_layer_info first to know valid props.

Output: { success, layerId, layerIndex, layerName, message } or { success: false, error }

The layerIndex (0, 1, 2...) lets you reference this layer as "layer_0", "layer_1", etc. in subsequent calls.
Position (0,0) = canvas center. Only pass props that exist in get_layer_info output.`,
    inputSchema: CreateLayerInputSchema
  }),

  animate_layer: tool({
    description: `Add animation to a layer using presets or custom keyframes.

Output: { success, layerId, keyframesAdded, message } or { success: false, error }

Layer reference: Use "layer_0" for layers you created, or the ID/name from PROJECT STATE for existing layers.
Animatable: position.x, position.y, scale.x, scale.y, rotation.z, opacity, props.* (any layer prop)`,
    inputSchema: AnimateLayerInputSchema
  }),

  edit_layer: tool({
    description: `Modify an existing layer's transform, style, or props.

Output: { success, layerId, message } or { success: false, error }

Layer reference: Use "layer_0" for layers you created, or the ID/name from PROJECT STATE.
Only update props that exist for this layer type (use get_layer_info if unsure).`,
    inputSchema: EditLayerInputSchema
  }),

  remove_layer: tool({
    description: `Delete a layer from the project.

Output: { success, message } or { success: false, error }`,
    inputSchema: RemoveLayerInputSchema
  }),

  configure_project: tool({
    description: `Update project settings: dimensions, duration, background color.

Output: { success, message }`,
    inputSchema: ConfigureProjectInputSchema
  })
};

export type ToolIDs = keyof typeof animationTools;
export const toolIDs = Object.keys(animationTools) as ToolIDs[];

/**
 * Inferred UI tool types for type-safe tool inputs/outputs in messages
 */
export type AnimationUITools = InferUITools<typeof animationTools>;

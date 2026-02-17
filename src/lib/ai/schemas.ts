/**
 * AI Tool Schemas for Progressive Animation Generation
 *
 * Uses static layer-specific tools with explicit schemas from the layer registry.
 * Each layer type has its own creation tool (create_text_layer, create_icon_layer, etc.)
 */
import { z } from 'zod';
import { InterpolationSchema } from '$lib/schemas/animation';
import { getPresetIds } from '$lib/engine/presets';
import { tool, type InferUITools } from 'ai';
import { layerRegistry, getAvailableLayerTypes } from '$lib/layers/registry';
import { AnchorPointSchema } from '$lib/layers/base';
import type { LayerTypeString } from '$lib/layers/layer-types';
import { CleanTransformSchema } from '$lib/schemas/base';

// ============================================
// Schema Introspection
// ============================================

const AnimationSchema = z
  .object({
    preset: z.string().describe('Animation preset: ' + getPresetIds().join(', ')),
    startTime: z.number().min(0).default(0).describe('Start time in seconds'),
    duration: z.number().min(0.1).default(0.5).describe('Duration in seconds')
  })
  .optional()
  .describe('Animation to apply on creation. Every layer should be animated');

// ============================================
// Common Timing Fields
// ============================================

/**
 * Shared timing fields (optional).
 * Cross-field validation is applied at the schema level.
 */
const TimingFieldsSchema = z.object({
  enterTime: z
    .number()
    .min(0)
    .optional()
    .describe('When layer enters the timeline (seconds, default: 0)'),
  exitTime: z
    .number()
    .min(0)
    .optional()
    .describe('When layer exits the timeline (seconds, default: project duration)'),
  contentDuration: z
    .number()
    .min(0)
    .optional()
    .describe('Total content duration for media layers (video/audio duration in seconds)'),
  contentOffset: z
    .number()
    .min(0)
    .optional()
    .describe('Start offset for trimming media content (seconds)')
});

/**
 * Validates that enterTime < exitTime when both are provided.
 * Returns true if validation passes (either fields missing or enterTime < exitTime).
 */
const validateTimingFields = (data: { enterTime?: number; exitTime?: number }) => {
  // Only validate when both fields are present
  if (data.enterTime !== undefined && data.exitTime !== undefined) {
    return data.enterTime < data.exitTime;
  }
  return true;
};

// ============================================
// Layer Creation Tool Schema
// ============================================

const BaseCreateLayerSchema = z.object({
  name: z.string().optional().describe('Layer name for identification'),
  visible: z.boolean().optional().default(true).describe('Layer visibility (default: true)'),
  locked: z.boolean().optional().default(false).describe('Layer locked state (default: false)'),
  transform: CleanTransformSchema,
  animation: AnimationSchema
});

/**
 * Generate discriminated union schema for layer type and props.
 * Each layer type gets its full schema with all metadata preserved.
 */
function generateLayerTypePropsUnion() {
  const layerSchemas = [] as unknown as [z.ZodObject<z.ZodRawShape>];

  for (const layerType of getAvailableLayerTypes() as LayerTypeString[]) {
    switch (layerType) {
      case 'browser':
      case 'captions':
      case 'terminal':
      case 'video':
      case 'audio':
      case 'phone':
      case 'code':
      case 'project-settings':
        continue;
    }
    const definition = layerRegistry[layerType];
    if (!definition) continue;

    // Create schema for type + props discriminated union
    const layerSchema = z.object({
      type: z.literal(layerType),
      props: definition.schema.describe(`Properties for ${definition.label} layer`)
    });

    layerSchemas.push(layerSchema);
  }

  return z.discriminatedUnion('type', layerSchemas);
}

const LayerTypePropsUnion = generateLayerTypePropsUnion();

/**
 * Full create_layer input schema: base fields + timing + discriminated type/props union
 */
export const CreateLayerInputSchema = BaseCreateLayerSchema.extend(TimingFieldsSchema.shape)
  .refine(validateTimingFields, {
    message: 'enterTime must be less than exitTime',
    path: ['enterTime']
  })
  .extend({
    layer: LayerTypePropsUnion
  });

// ============================================
// Input/Output Types for Layer Creation
// ============================================

export type CreateLayerInput = z.infer<typeof CreateLayerInputSchema> & {
  layer: {
    type: string;
    props: Record<string, unknown>;
  };
};
export interface CreateLayerOutput {
  success: boolean;
  message: string;
  layerId?: string;
  layerIndex?: number;
  layerName?: string;
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
        time: z.number().min(0).describe('Time in seconds when this value is reached'),
        property: z
          .string()
          .describe(
            'Property path: position.x/y/z, scale.x/y, rotation.x/y/z, opacity, or props.* for layer-specific (e.g., props.fontSize, props.content for text layers)'
          ),
        value: z
          .union([z.number(), z.string(), z.boolean()])
          .describe(
            'Target value: number for transforms/opacity, hex string (#ff0000) for colors, string for text content, boolean for flags'
          ),
        interpolation: InterpolationSchema.optional().describe(
          'How to animate TO this keyframe. Omit for smooth ease-in-out. Use {family:"text",strategy:"char-reveal"} ONLY on props.content to create typewriter effects'
        )
      })
    )
    .optional()
    .describe(
      'Custom keyframes (alternative to preset). IMPORTANT: For text typewriter/reveal effects, animate props.content from "" to full text with text interpolation'
    )
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
  updates: z
    .object({
      name: z.string().optional(),
      visible: z.boolean().optional(),
      locked: z.boolean().optional(),
      transform: CleanTransformSchema.optional(),
      anchor: AnchorPointSchema.optional().describe('Anchor point for transformations'),
      opacity: z.number().min(0).max(1).optional(),
      props: z.record(z.string(), z.unknown()).optional()
    })
    .extend(TimingFieldsSchema.shape)
    .refine(validateTimingFields, {
      message: 'enterTime must be less than exitTime',
      path: ['enterTime']
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
// Tool: group_layers
// ============================================

export const GroupLayersInputSchema = z.object({
  layerIds: z
    .array(z.string())
    .min(2)
    .describe('Array of layer IDs or references to group together (minimum 2)'),
  name: z.string().optional().describe('Name for the group (default: "Group")')
});

export type GroupLayersInput = z.infer<typeof GroupLayersInputSchema>;

export interface GroupLayersOutput {
  success: boolean;
  groupId?: string;
  message: string;
  error?: string;
}

// ============================================
// Tool: ungroup_layers
// ============================================

export const UngroupLayersInputSchema = z.object({
  groupId: z.string().describe('Group layer ID or reference to dissolve')
});

export type UngroupLayersInput = z.infer<typeof UngroupLayersInputSchema>;

export interface UngroupLayersOutput {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// Tool: update_keyframe
// ============================================

export const UpdateKeyframeInputSchema = z
  .object({
    layerId: z.string().describe('Layer ID or reference'),
    keyframeId: z.string().describe('Keyframe ID to update'),
    updates: z.object({
      time: z.number().min(0).optional().describe('New time in seconds'),
      value: z.union([z.number(), z.string(), z.boolean()]).optional().describe('New value'),
      interpolation: InterpolationSchema.optional().describe('New interpolation settings')
    })
  })
  .refine(
    (data) => {
      return (
        data.updates.time !== undefined ||
        data.updates.value !== undefined ||
        data.updates.interpolation !== undefined
      );
    },
    {
      message: 'At least one of time, value, or interpolation must be provided in updates',
      path: ['updates']
    }
  );

export type UpdateKeyframeInput = z.infer<typeof UpdateKeyframeInputSchema>;

export interface UpdateKeyframeOutput {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// Tool: remove_keyframe
// ============================================

export const RemoveKeyframeInputSchema = z
  .object({
    layerId: z.string().describe('Layer ID or reference'),
    keyframeId: z.string().optional().describe('Specific keyframe ID to remove')
  })
  .refine((data) => data.keyframeId !== undefined, {
    message: 'Either keyframeId must be provided',
    path: ['keyframeId']
  });

export type RemoveKeyframeInput = z.infer<typeof RemoveKeyframeInputSchema>;

export interface RemoveKeyframeOutput {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// Tool Definitions for AI SDK
// ============================================

export const animationTools = {
  create_layer: tool({
    description: 'Create a new layer.',
    inputSchema: CreateLayerInputSchema
  }),

  animate_layer: tool({
    description:
      'Add animation to an existing layer via preset or custom keyframes. ' +
      'Use layer_N for layers you just created, or actual ID/name for existing layers.',
    inputSchema: AnimateLayerInputSchema
  }),

  edit_layer: tool({
    description:
      'Modify an existing layer (position, scale, 3D rotation, anchor, opacity, or props). ' +
      'Use layer_N for layers you just created, or actual ID/name for existing layers.',
    inputSchema: EditLayerInputSchema
  }),

  update_keyframe: tool({
    description:
      'Update an existing keyframe (change time, value, or interpolation). ' +
      'The keyframeId can be found in the PROJECT STATE section of the system prompt.',
    inputSchema: UpdateKeyframeInputSchema
  }),

  remove_keyframe: tool({
    description: 'Remove a specific keyframe from a layer by its ID.',
    inputSchema: RemoveKeyframeInputSchema
  }),

  remove_layer: tool({
    description: 'Delete a layer from the project.',
    inputSchema: RemoveLayerInputSchema
  }),

  group_layers: tool({
    description:
      'Group multiple layers together so they share a common transform. ' +
      'Moving/rotating/scaling the group affects all children. ' +
      'Use layer_N for layers you just created, or actual ID/name for existing layers.',
    inputSchema: GroupLayersInputSchema
  }),

  ungroup_layers: tool({
    description:
      'Dissolve a group, making its children top-level layers again. ' +
      'Group transforms are baked into children to preserve their world position.',
    inputSchema: UngroupLayersInputSchema
  }),

  configure_project: tool({
    description:
      'Set project dimensions, duration, and background color. ' +
      'Call this FIRST to match the target format (e.g. 1080x1920 for vertical video, dark background).',
    inputSchema: ConfigureProjectInputSchema
  })
};

export type ToolIDs = keyof typeof animationTools;
export const toolIDs = Object.keys(animationTools) as ToolIDs[];

/**
 * Inferred UI tool types for type-safe tool inputs/outputs in messages
 */
export type AnimationUITools = InferUITools<typeof animationTools>;

/**
 * Zod schemas for AI tool calls
 * Defines the structured operations the AI can perform
 */
import { z } from 'zod';
import { LayerTypeSchema, EasingSchema, AnchorPointSchema } from '$lib/schemas/animation';

// ============================================
// Layer Operations
// ============================================

/**
 * Add a new layer - props should ALWAYS be specified with meaningful content
 */
export const AddLayerToolSchema = z.object({
  action: z.literal('add_layer'),
  type: LayerTypeSchema.describe('The type of layer to create'),
  name: z.string().optional().describe('Layer name (auto-generated if not provided)'),
  position: z
    .object({
      x: z.number().default(0),
      y: z.number().default(0)
    })
    .optional()
    .describe('Initial position on canvas (0,0 is center)'),
  props: z
    .record(z.string(), z.unknown())
    .describe(
      'Layer-specific properties - MUST include meaningful content (e.g., text content, colors, dimensions)'
    )
});

/**
 * Edit an existing layer
 */
export const EditLayerToolSchema = z.object({
  action: z.literal('edit_layer'),
  layerId: z.string().describe('ID of the layer to edit (use actual ID from project state)'),
  updates: z.object({
    name: z.string().optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    transform: z
      .object({
        x: z.number().optional(),
        y: z.number().optional(),
        z: z.number().optional(),
        rotationX: z.number().optional(),
        rotationY: z.number().optional(),
        rotationZ: z.number().optional(),
        scaleX: z.number().optional(),
        scaleY: z.number().optional(),
        scaleZ: z.number().optional(),
        anchor: AnchorPointSchema.optional()
      })
      .optional(),
    style: z
      .object({
        opacity: z.number().min(0).max(1).optional()
      })
      .optional(),
    props: z.record(z.string(), z.unknown()).optional()
  })
});

/**
 * Remove a layer
 */
export const RemoveLayerToolSchema = z.object({
  action: z.literal('remove_layer'),
  layerId: z.string().describe('ID of the layer to remove')
});

// ============================================
// Keyframe Operations
// ============================================

/**
 * Add a keyframe to a layer
 */
export const AddKeyframeToolSchema = z.object({
  action: z.literal('add_keyframe'),
  layerId: z
    .string()
    .describe(
      'ID of the layer - use "layer_0", "layer_1", etc. for newly created layers, or actual ID for existing layers'
    ),
  keyframe: z.object({
    time: z.number().min(0).describe('Time in seconds'),
    property: z
      .string()
      .describe(
        'Property path: position.x, position.y, position.z, scale.x, scale.y, scale.z, rotation.x, rotation.y, rotation.z, opacity, or props.<propName>'
      ),
    value: z.union([z.number(), z.string(), z.boolean()]).describe('Value at this keyframe'),
    easing: EasingSchema.optional().describe('Easing function (defaults to ease-in-out)')
  })
});

/**
 * Edit an existing keyframe
 */
export const EditKeyframeToolSchema = z.object({
  action: z.literal('edit_keyframe'),
  layerId: z.string().describe('ID of the layer'),
  keyframeId: z.string().describe('ID of the keyframe to edit'),
  updates: z.object({
    time: z.number().min(0).optional(),
    value: z.union([z.number(), z.string(), z.boolean()]).optional(),
    easing: EasingSchema.optional()
  })
});

/**
 * Remove a keyframe
 */
export const RemoveKeyframeToolSchema = z.object({
  action: z.literal('remove_keyframe'),
  layerId: z.string().describe('ID of the layer'),
  keyframeId: z.string().describe('ID of the keyframe to remove')
});

// ============================================
// Animation Preset Operations
// ============================================

/**
 * Apply an animation preset to a layer
 */
export const ApplyPresetToolSchema = z.object({
  action: z.literal('apply_preset'),
  layerId: z
    .string()
    .describe(
      'ID of the layer - use "layer_0", "layer_1", etc. for newly created layers, or actual ID for existing layers'
    ),
  presetId: z
    .string()
    .describe(
      'ID of the preset to apply: fade-in, fade-out, slide-in-left, slide-in-right, slide-in-top, slide-in-bottom, scale-in, scale-out, bounce, rotate-in, pop, typewriter, pulse, shake, float'
    ),
  startTime: z.number().min(0).default(0).describe('Time to start the animation (seconds)'),
  duration: z.number().min(0.1).default(1).describe('Duration of the animation (seconds)')
});

/**
 * Add multiple keyframes at once (batch operation)
 */
export const BatchKeyframesToolSchema = z.object({
  action: z.literal('batch_keyframes'),
  layerId: z.string().describe('ID of the layer'),
  keyframes: z.array(
    z.object({
      time: z.number().min(0),
      property: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
      easing: EasingSchema.optional()
    })
  )
});

// ============================================
// Combined Schema
// ============================================

/**
 * All possible AI tool calls
 */
export const AIToolCallSchema = z.discriminatedUnion('action', [
  AddLayerToolSchema,
  EditLayerToolSchema,
  RemoveLayerToolSchema,
  AddKeyframeToolSchema,
  EditKeyframeToolSchema,
  RemoveKeyframeToolSchema,
  ApplyPresetToolSchema,
  BatchKeyframesToolSchema
]);

export type AIToolCall = z.infer<typeof AIToolCallSchema>;
export type AddLayerTool = z.infer<typeof AddLayerToolSchema>;
export type EditLayerTool = z.infer<typeof EditLayerToolSchema>;
export type RemoveLayerTool = z.infer<typeof RemoveLayerToolSchema>;
export type AddKeyframeTool = z.infer<typeof AddKeyframeToolSchema>;
export type EditKeyframeTool = z.infer<typeof EditKeyframeToolSchema>;
export type RemoveKeyframeTool = z.infer<typeof RemoveKeyframeToolSchema>;
export type ApplyPresetTool = z.infer<typeof ApplyPresetToolSchema>;
export type BatchKeyframesTool = z.infer<typeof BatchKeyframesToolSchema>;

/**
 * AI Response schema - what the model returns
 */
export const AIResponseSchema = z.object({
  message: z
    .string()
    .max(100)
    .describe('A brief, friendly message to show the user (for toast notification, max 100 chars)'),
  operations: z
    .array(AIToolCallSchema)
    .min(1)
    .describe('List of operations to perform on the project - must not be empty')
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

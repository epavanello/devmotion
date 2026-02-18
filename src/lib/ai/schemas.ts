/**
 * AI Tool Schemas - Simplified for AI consumption
 *
 * Reuses webapp schemas from $lib/schemas/animation and $lib/schemas/base
 * with AI-friendly descriptions.
 *
 * Design philosophy:
 * - create_layer: comprehensive - single call can create a complete layer with
 *   position, props, animations, preset, keyframes, styles
 * - edit_layer: patch-style - optional sections that replace previous values
 * - remove_layer, configure_project, group_layers, ungroup_layers: simple utilities
 */
import { z } from 'zod';
import { tool, type InferUITools } from 'ai';
import { AnimationPresetIdSchema } from '$lib/engine/presets';
import { getAvailableLayerTypes, layerRegistry } from '$lib/layers/registry';
import { CleanTransformSchema, AnchorPointSchema, LayerStyleSchema } from '$lib/schemas/base';
import { KeyframeSchema } from '$lib/schemas/animation';
import type { LayerTypeString } from '$lib/layers/layer-types';

// ============================================
// Timing Fields
// ============================================

const TimingFieldsSchema = z.object({
  enterTime: z
    .number()
    .min(0)
    .optional()
    .describe('When layer enters timeline (seconds, default: 0)'),
  exitTime: z
    .number()
    .min(0)
    .optional()
    .describe('When layer exits timeline (seconds, default: project duration)'),
  contentDuration: z
    .number()
    .min(0)
    .optional()
    .describe('Content duration for media layers (video/audio in seconds)'),
  contentOffset: z
    .number()
    .min(0)
    .optional()
    .describe('Start offset for trimming media content (seconds)')
});

// ============================================
// Layer Type + Props Union
// ============================================

function generateLayerTypePropsUnion() {
  const layerSchemas = [] as unknown as [
    z.ZodObject<z.ZodRawShape>,
    ...z.ZodObject<z.ZodRawShape>[]
  ];

  for (const layerType of getAvailableLayerTypes() as LayerTypeString[]) {
    // Skip special/internal layer types
    if (['project-settings'].includes(layerType)) continue;

    const definition = layerRegistry[layerType];
    if (!definition) continue;

    layerSchemas.push(
      z.object({
        type: z.literal(layerType),
        props: definition.schema.describe(
          `Properties for ${definition.label} layer: ${definition.description}`
        )
      })
    );
  }

  return z.discriminatedUnion('type', layerSchemas);
}

const LayerTypePropsUnion = generateLayerTypePropsUnion();

// ============================================
// Tool: create_layer (COMPREHENSIVE)
// ============================================

/**
 * Animation: can provide preset AND/OR custom keyframes.
 * Use preset for standard animations, keyframes for custom behavior.
 * Both can be combined for layered animations.
 */
const CreateLayerAnimationSchema = z.object({
  preset: z
    .object({
      id: AnimationPresetIdSchema.describe('Animation preset ID'),
      startTime: z.number().min(0).default(0).describe('When animation starts (seconds)'),
      duration: z.number().min(0.1).default(0.5).describe('Animation duration (seconds)')
    })
    .optional()
    .describe('Apply animation preset (e.g., fade-in, slide-in-left)'),
  keyframes: z
    .array(KeyframeSchema)
    .optional()
    .describe('Custom keyframes for additional animation (can combine with preset)')
});

export const CreateLayerInputSchema = z
  .object({
    name: z.string().optional().describe('Layer name for identification'),
    visible: z.boolean().default(true).describe('Layer visibility (default: true)'),
    locked: z.boolean().default(false).describe('Layer locked state (default: false)'),

    // Transform (position, rotation, scale, anchor)
    transform: CleanTransformSchema.describe(
      'Position, rotation, scale, anchor - all optional, defaults applied'
    ),

    // Style (opacity, filters, shadows)
    style: LayerStyleSchema.optional().describe(
      'Layer style: opacity, blur, brightness, contrast, saturate, drop shadow'
    ),

    // Timing
    ...TimingFieldsSchema.shape,

    // Layer type and properties
    layer: LayerTypePropsUnion,

    // Animation (preset OR custom keyframes)
    animation: CreateLayerAnimationSchema.optional().describe(
      'Animation: preset OR custom keyframes'
    )
  })
  .refine(
    (data) => {
      if (data.enterTime !== undefined && data.exitTime !== undefined) {
        return data.enterTime < data.exitTime;
      }
      return true;
    },
    { message: 'enterTime must be less than exitTime', path: ['enterTime'] }
  );

export type CreateLayerInput = z.infer<typeof CreateLayerInputSchema>;
export interface CreateLayerOutput {
  success: boolean;
  message: string;
  layerId?: string;
  layerName?: string;
  error?: string;
}

// ============================================
// Tool: edit_layer (PATCH-STYLE)
// ============================================

/**
 * Edit layer with optional sections - each provided section replaces the previous value.
 * Style section: provide all style fields to replace entire style object.
 * Transform section: provide all transform fields to replace entire transform object.
 */
const EditLayerStyleSection = z
  .object({
    opacity: z.number().min(0).max(1).optional(),
    blur: z.number().min(0).optional(),
    brightness: z.number().min(0).max(10).optional(),
    contrast: z.number().min(0).max(10).optional(),
    saturate: z.number().min(0).max(10).optional(),
    dropShadowX: z.number().optional(),
    dropShadowY: z.number().optional(),
    dropShadowBlur: z.number().min(0).optional(),
    dropShadowColor: z.string().optional()
  })
  .describe('Style properties - provide fields to update, omit to keep existing values');

const EditLayerTransformSection = CleanTransformSchema.describe(
  'Transform - provide fields to update, omit to keep existing'
);

export const EditLayerInputSchema = z
  .object({
    layerId: z.string().describe('Layer ID (from create_layer response) or layer name'),

    // Basic fields
    name: z.string().optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),

    // Transform section (replaces if provided)
    transform: EditLayerTransformSection,

    // Style section (replaces if provided)
    style: EditLayerStyleSection,

    // Anchor point
    anchor: AnchorPointSchema.optional().describe('Anchor point for transformations'),

    // Props (merged with existing)
    props: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Layer-specific properties to update (merged with existing)'),

    // Timing fields
    ...TimingFieldsSchema.shape
  })
  .refine(
    (data) => {
      if (data.enterTime !== undefined && data.exitTime !== undefined) {
        return data.enterTime < data.exitTime;
      }
      return true;
    },
    { message: 'enterTime must be less than exitTime', path: ['enterTime'] }
  );

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
  layerId: z.string().describe('Layer ID or name to remove')
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
  layerIds: z.array(z.string()).min(2).describe('Array of layer IDs or names to group (minimum 2)'),
  name: z.string().optional().describe('Group name (default: "Group")')
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
  groupId: z.string().describe('Group layer ID or name to dissolve')
});

export type UngroupLayersInput = z.infer<typeof UngroupLayersInputSchema>;
export interface UngroupLayersOutput {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================
// Tool Definitions for AI SDK
// ============================================

export const animationTools = {
  create_layer: tool({
    description: `Create a complete layer in a single call. Supports:
- Position, rotation, scale, anchor point
- Layer-specific props (text content, colors, sizes, etc.)
- Style (opacity, blur, filters, drop shadow)
- Animation via preset OR custom keyframes
- Timing (enter/exit times, content duration/offset)

Example: Create a text layer with animation:
{ "layer": { "type": "text", "props": { "content": "Hello World", "fontSize": 48, "fill": "#ffffff" } }, "transform": { "position": { "x": 0, "y": -200 } }, "animation": { "preset": { "id": "fade-in", "startTime": 0, "duration": 0.5 } } }`,
    inputSchema: CreateLayerInputSchema
  }),

  edit_layer: tool({
    description: `Modify an existing layer. Uses PATCH-style updates:
- Provide only the fields you want to change
- transform/style sections replace entire object if provided
- props are merged with existing props
- Use layer ID from create_layer response or layer name`,
    inputSchema: EditLayerInputSchema
  }),

  remove_layer: tool({
    description: 'Delete a layer from the project by ID or name',
    inputSchema: RemoveLayerInputSchema
  }),

  configure_project: tool({
    description:
      'Set project settings: name, dimensions (width/height), duration, background color',
    inputSchema: ConfigureProjectInputSchema
  }),

  group_layers: tool({
    description:
      'Group multiple layers together. Moving/rotating/scaling the group affects all children.',
    inputSchema: GroupLayersInputSchema
  }),

  ungroup_layers: tool({
    description:
      'Dissolve a group layer, making children top-level again. Group transforms are baked into children.',
    inputSchema: UngroupLayersInputSchema
  })
};

export type ToolIDs = keyof typeof animationTools;
export const toolIDs = Object.keys(animationTools) as ToolIDs[];

export type AnimationUITools = InferUITools<typeof animationTools>;

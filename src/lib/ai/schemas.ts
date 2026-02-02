/**
 * AI Tool Schemas for Progressive Animation Generation
 *
 * Uses static layer-specific tools with explicit schemas from the layer registry.
 * Each layer type has its own creation tool (create_text_layer, create_icon_layer, etc.)
 */
import { z } from 'zod';
import { EasingSchema } from '$lib/schemas/animation';
import { getPresetIds } from '$lib/engine/presets';
import { tool, type InferUITools, type Tool } from 'ai';
import { layerRegistry, getAvailableLayerTypes, type LayerType } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a tool name is a layer creation tool
 */
export function isLayerCreationTool(toolName: string): boolean {
  return toolName.startsWith('create_') && toolName.endsWith('_layer');
}

/**
 * Extract layer type from tool name
 * e.g., "create_text_layer" → "text"
 */
export function getLayerTypeFromToolName(toolName: string): string | null {
  const match = toolName.match(/^create_(.+)_layer$/);
  return match ? match[1] : null;
}

// ============================================
// Shared Schemas for Layer Creation
// ============================================

const PositionSchema = z
  .object({
    x: z.number().default(0).describe('X position (0=center)'),
    y: z.number().default(0).describe('Y position (0=center)')
  })
  .optional()
  .describe('Position on canvas - ALWAYS specify to avoid stacking at center');

const AnimationSchema = z
  .object({
    preset: z
      .string()
      .describe(
        'Animation preset ID (REQUIRED): fade-in, slide-in-left, scale-in, pop, bounce-in, zoom-in, etc.'
      ),
    startTime: z.number().min(0).default(0).describe('Start time in seconds'),
    duration: z.number().min(0.1).default(0.5).describe('Duration in seconds')
  })
  .optional()
  .describe('Animation to apply immediately when layer is created');

// ============================================
// Layer Creation Tool Generator
// ============================================

/**
 * Get key props for each layer type for the description
 * TODO: remove this and infer from the schema
 */
function getKeyPropsForLayerType(type: string): string[] {
  const keyProps: Record<string, string[]> = {
    text: ['content', 'fontSize', 'color', 'fontFamily'],
    icon: ['icon', 'size', 'color'],
    shape: ['shapeType', 'fill', 'width', 'height'],
    code: ['code', 'language'],
    image: ['src', 'width', 'height'],
    button: ['text', 'backgroundColor', 'textColor'],
    terminal: ['title', 'content'],
    progress: ['progress', 'progressColor'],
    mouse: ['pointerType', 'size'],
    phone: ['url'],
    browser: ['url'],
    html: ['html', 'css']
  };
  return keyProps[type] || [];
}

/**
 * Get example props for each layer type
 * TODO: remove this and infer from the schema
 */
function getExampleProps(type: string): string {
  const examples: Record<string, string> = {
    text: '"content": "Hello World", "fontSize": 48, "color": "#ffffff"',
    icon: '"icon": "star", "size": 64, "color": "#ffffff"',
    shape: '"shapeType": "rectangle", "fill": "#3b82f6", "width": 200, "height": 100"',
    code: '"code": "const x = 1;", "language": "typescript"',
    image: '"src": "https://example.com/image.jpg", "width": 400',
    button: '"text": "Click Me", "backgroundColor": "#3b82f6"',
    terminal: '"content": "$ npm install", "title": "Terminal"',
    progress: '"progress": 75, "progressColor": "#22c55e"',
    mouse: '"pointerType": "arrow", "size": 32',
    phone: '"url": "https://example.com"',
    browser: '"url": "https://example.com"',
    html: '"html": "<div>Content</div>", "css": ".container { color: white; }"'
  };
  return examples[type] || '';
}

/**
 * Generate tool definitions for all layer types from the registry
 */
function generateLayerCreationTools(): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

  for (const layerType of getAvailableLayerTypes()) {
    const definition = layerRegistry[layerType as LayerType];
    if (!definition) continue;

    const toolName = `create_${layerType}_layer`;
    const keyProps = getKeyPropsForLayerType(layerType);
    const exampleProps = getExampleProps(layerType);
    const defaults = extractDefaultValues(definition.schema);

    // Build key props description with defaults
    const keyPropsDescription = keyProps
      .map((prop) => {
        const defaultVal = defaults[prop];
        return defaultVal !== undefined ? `${prop} (default: ${JSON.stringify(defaultVal)})` : prop;
      })
      .join(', ');

    // Build the input schema with shared fields + layer-specific props
    const inputSchema = z.object({
      name: z.string().optional().describe('Layer name for identification'),
      position: PositionSchema,
      props: definition.schema.describe(`Properties for ${definition.label} layer`),
      animation: AnimationSchema
    });

    const description = `Create a ${definition.label} layer. ${definition.description}

Key props: ${keyPropsDescription}

Example:
{
  "name": "My ${definition.label}",
  "position": { "x": 0, "y": 0 },
  "props": { ${exampleProps} },
  "animation": { "preset": "fade-in", "startTime": 0, "duration": 0.5 }
}`;

    tools[toolName] = tool({
      description,
      inputSchema
    });
  }

  return tools;
}

// ============================================
// Input/Output Types for Layer Creation
// ============================================

export interface CreateLayerInput {
  type: string;
  name?: string;
  position?: { x: number; y: number };
  props: Record<string, unknown>;
  animation?: {
    preset: string;
    startTime?: number;
    duration?: number;
  };
}

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

// Generate layer creation tools from registry
const layerCreationTools = generateLayerCreationTools();

export const animationTools = {
  // Layer creation tools (dynamically generated from registry)
  ...layerCreationTools,

  // Animation and editing tools
  animate_layer: tool({
    description: `Add animation to a layer. Use when you need to animate an existing layer or add complex keyframes.

Presets: fade-in, slide-in-left, slide-in-right, slide-in-top, slide-in-bottom, scale-in, pop, bounce-in, zoom-in, rotate-in, pulse, float

Example: { layerId: "layer_0", preset: { id: "pop", startTime: 0.3, duration: 0.6 } }

Output: { success, keyframesAdded, message }`,
    inputSchema: AnimateLayerInputSchema
  }),

  edit_layer: tool({
    description: `Modify an existing layer's transform, style, or props.

Output: { success, layerId, message } or { success: false, error }

Layer reference: Use "layer_0" for layers you created, or the ID/name from PROJECT STATE.`,
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

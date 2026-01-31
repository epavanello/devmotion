/**
 * Zod schemas for AI tool calls
 * Defines the structured operations the AI can perform
 * Enhanced with detailed descriptions for better AI understanding
 */
import { z } from 'zod';
import { LayerTypeSchema, EasingSchema, AnchorPointSchema } from '$lib/schemas/animation';

// ============================================
// Layer Props Schemas (for better AI guidance)
// ============================================

/**
 * Text layer props
 */
export const TextLayerPropsSchema = z.object({
  content: z.string().describe('The text content to display'),
  fontSize: z.number().min(8).max(500).describe('Font size in pixels (typical: 24-96)'),
  fontFamily: z.string().describe('Font family (e.g., Inter, Poppins, Roboto)'),
  fontWeight: z
    .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
    .optional()
    .describe('Font weight'),
  color: z.string().describe('Text color as hex (e.g., #ffffff)'),
  textAlign: z.enum(['left', 'center', 'right']).optional().describe('Text alignment')
});

/**
 * Shape layer props
 */
export const ShapeLayerPropsSchema = z.object({
  shapeType: z.enum(['rect', 'circle', 'triangle']).describe('Type of shape'),
  width: z.number().describe('Width in pixels'),
  height: z.number().describe('Height in pixels'),
  fill: z.string().describe('Fill color as hex'),
  stroke: z.string().optional().describe('Stroke color as hex'),
  strokeWidth: z.number().optional().describe('Stroke width in pixels'),
  borderRadius: z.number().optional().describe('Border radius for rect shapes')
});

/**
 * Button layer props
 */
export const ButtonLayerPropsSchema = z.object({
  text: z.string().describe('Button text'),
  backgroundColor: z.string().describe('Background color as hex'),
  textColor: z.string().optional().describe('Text color as hex'),
  width: z.number().describe('Width in pixels'),
  height: z.number().describe('Height in pixels'),
  borderRadius: z.number().optional().describe('Border radius'),
  fontSize: z.number().optional().describe('Font size')
});

/**
 * Icon layer props
 */
export const IconLayerPropsSchema = z.object({
  icon: z
    .string()
    .describe(
      'Lucide icon name (e.g., zap, shield, star, heart, check, x, arrow-right, sparkles, rocket, code, terminal, globe, mail, phone, user, settings, search, home, play, pause)'
    ),
  size: z.number().describe('Icon size in pixels'),
  color: z.string().describe('Icon color as hex'),
  backgroundColor: z.string().optional().describe('Background color for icon container'),
  backgroundRadius: z.number().optional().describe('Background border radius'),
  backgroundPadding: z.number().optional().describe('Padding around icon')
});

/**
 * Terminal layer props
 */
export const TerminalLayerPropsSchema = z.object({
  content: z.string().describe('Terminal content (can animate for typing effect)'),
  width: z.number().describe('Width in pixels'),
  height: z.number().describe('Height in pixels'),
  backgroundColor: z.string().optional().describe('Background color'),
  textColor: z.string().optional().describe('Text color'),
  title: z.string().optional().describe('Terminal window title')
});

/**
 * Code layer props
 */
export const CodeLayerPropsSchema = z.object({
  code: z.string().describe('Code content'),
  language: z
    .string()
    .describe('Programming language (javascript, typescript, python, rust, go, etc.)'),
  width: z.number().describe('Width in pixels'),
  fontSize: z.number().optional().describe('Font size'),
  showLineNumbers: z.boolean().optional().describe('Show line numbers')
});

/**
 * Progress layer props
 */
export const ProgressLayerPropsSchema = z.object({
  progress: z.number().min(0).max(100).describe('Progress value 0-100 (can animate)'),
  width: z.number().describe('Width in pixels'),
  progressColor: z.string().describe('Progress bar color'),
  backgroundColor: z.string().optional().describe('Background color'),
  height: z.number().optional().describe('Height in pixels')
});

/**
 * HTML layer props - for custom HTML/CSS content
 */
export const HtmlLayerPropsSchema = z.object({
  html: z
    .string()
    .describe(
      'HTML content - use {{var1}}, {{var2}}, etc. for variable interpolation that can be animated'
    ),
  css: z.string().describe('CSS styles for the HTML content'),
  width: z.number().describe('Container width'),
  height: z.number().describe('Container height'),
  var1: z.string().optional().describe('Variable for interpolation in HTML'),
  var2: z.string().optional().describe('Variable for interpolation in HTML'),
  var3: z.string().optional().describe('Variable for interpolation in HTML'),
  num1: z.number().optional().describe('Numeric variable for animations'),
  num2: z.number().optional().describe('Numeric variable for animations'),
  color1: z.string().optional().describe('Color variable for dynamic colors'),
  color2: z.string().optional().describe('Color variable for dynamic colors')
});

// ============================================
// Layer Operations
// ============================================

/**
 * Add a new layer - props should ALWAYS be specified with meaningful content
 */
export const AddLayerToolSchema = z.object({
  action: z.literal('add_layer'),
  type: LayerTypeSchema.describe(
    'Layer type: text (titles/labels), shape (backgrounds/decorations), button (CTAs), icon (feature icons), terminal (CLI display), code (syntax-highlighted code), progress (loading bars), phone/browser (device mockups), mouse (cursor), html (custom HTML/CSS)'
  ),
  name: z.string().optional().describe('Layer name for identification'),
  position: z
    .object({
      x: z.number().default(0).describe('X position (0=center, negative=left, positive=right)'),
      y: z.number().default(0).describe('Y position (0=center, negative=top, positive=bottom)')
    })
    .optional()
    .describe('Initial position on canvas'),
  props: z
    .record(z.string(), z.unknown())
    .describe(
      'REQUIRED layer properties. For text: {content, fontSize, color}. For shape: {shapeType, width, height, fill}. For button: {text, backgroundColor, width, height}. For icon: {icon, size, color}. NEVER leave empty!'
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
  layerId: z
    .string()
    .describe(
      'ID of the layer - use layer_0, layer_1, etc. for newly created layers, or actual ID for existing'
    ),
  keyframes: z
    .array(
      z.object({
        time: z.number().min(0).describe('Time in seconds'),
        property: z
          .string()
          .describe('Property to animate (position.x, opacity, scale.x, props.content, etc.)'),
        value: z.union([z.number(), z.string(), z.boolean()]).describe('Target value'),
        easing: EasingSchema.optional().describe('Easing type')
      })
    )
    .describe(
      'Array of keyframes to add at once - more efficient than individual add_keyframe calls'
    )
});

/**
 * Create a complete animated scene with multiple layers
 * This is a high-level operation that creates layers with coordinated animations
 */
export const CreateSceneToolSchema = z.object({
  action: z.literal('create_scene'),
  name: z.string().describe('Scene name for identification'),
  startTime: z.number().min(0).describe('When the scene starts (seconds)'),
  duration: z.number().min(0.1).describe('Scene duration (seconds)'),
  layers: z
    .array(
      z.object({
        type: LayerTypeSchema.describe('Layer type'),
        name: z.string().optional().describe('Layer name'),
        position: z
          .object({
            x: z.number().default(0),
            y: z.number().default(0)
          })
          .optional(),
        props: z.record(z.string(), z.unknown()).describe('Layer properties'),
        animation: z
          .object({
            preset: z
              .string()
              .optional()
              .describe('Animation preset (fade-in, slide-in-left, scale-in, pop, bounce, etc.)'),
            delay: z
              .number()
              .min(0)
              .optional()
              .describe('Delay before animation starts (relative to scene start)'),
            duration: z.number().min(0.1).optional().describe('Animation duration'),
            customKeyframes: z
              .array(
                z.object({
                  time: z.number().min(0).max(1).describe('Normalized time 0-1 within animation'),
                  property: z.string(),
                  value: z.union([z.number(), z.string(), z.boolean()]),
                  easing: EasingSchema.optional()
                })
              )
              .optional()
              .describe('Custom keyframes (normalized 0-1 time)')
          })
          .optional()
          .describe('Animation configuration')
      })
    )
    .describe('Layers to create in this scene with their animations')
});

/**
 * Change project settings (background, duration, etc.)
 */
export const SetProjectSettingsToolSchema = z.object({
  action: z.literal('set_project'),
  settings: z.object({
    backgroundColor: z.string().optional().describe('Background color as hex'),
    duration: z.number().min(1).max(120).optional().describe('Video duration in seconds')
  })
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
  BatchKeyframesToolSchema,
  CreateSceneToolSchema,
  SetProjectSettingsToolSchema
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
export type CreateSceneTool = z.infer<typeof CreateSceneToolSchema>;
export type SetProjectSettingsTool = z.infer<typeof SetProjectSettingsToolSchema>;

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

/**
 * System prompt builder for progressive AI animation generation
 * Uses static layer-specific tools with explicit schemas
 */
import type { Project } from '$lib/types/animation';
import { layerRegistry, getAvailableLayerTypes, type LayerType } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';

/**
 * Get key props for each layer type
 */
function getKeyPropsForLayerType(type: string): string[] {
  const keyProps: Record<string, string[]> = {
    text: ['content', 'fontSize', 'color'],
    icon: ['icon', 'size', 'color'],
    shape: ['shapeType', 'fill', 'width', 'height'],
    code: ['code', 'language'],
    image: ['src'],
    button: ['text', 'backgroundColor'],
    terminal: ['title', 'content'],
    progress: ['progress', 'progressColor'],
    mouse: ['pointerType'],
    phone: ['url'],
    browser: ['url'],
    html: ['html', 'css']
  };
  return keyProps[type] || [];
}

/**
 * Build formatted list of available layer creation tools
 */
function buildLayerToolsList(): string {
  return getAvailableLayerTypes()
    .map((type) => {
      const definition = layerRegistry[type as LayerType];
      const keyProps = getKeyPropsForLayerType(type);
      const defaults = extractDefaultValues(definition.schema);

      const propsInfo = keyProps
        .map((prop) => {
          const defaultVal = defaults[prop];
          return defaultVal !== undefined ? `${prop}="${defaultVal}"` : prop;
        })
        .join(', ');

      return `- **create_${type}_layer**: ${definition.description || definition.label} (${propsInfo})`;
    })
    .join('\n');
}

/**
 * Build the system prompt for progressive tool-calling
 */
export function buildSystemPrompt(project: Project): string {
  const halfWidth = project.width / 2;
  const halfHeight = project.height / 2;

  return `# DevMotion AI - Motion Graphics Designer

You create professional video animations by thinking through the design, then using tools step-by-step to build the animation progressively.

## LAYER CREATION TOOLS

Each layer type has its own creation tool with explicit properties:

${buildLayerToolsList()}

## OTHER TOOLS

- **animate_layer**: Add animation to an existing layer
- **edit_layer**: Modify layer properties, position, or transform
- **remove_layer**: Delete a layer
- **configure_project**: Update project dimensions, duration, or background

## YOUR WORKFLOW

1. **Design**: Plan your composition and explain your approach
2. **Build**: Create layers using create_*_layer tools (returns layer_0, layer_1, etc.)
3. **Animate**: Add motion with inline animation or animate_layer
4. **Refine**: Edit and iterate based on tool results

## CANVAS SPACE

Canvas: ${project.width}x${project.height}px | Center: (0, 0)
Duration: ${project.duration}s | FPS: ${project.fps} | Background: ${project.backgroundColor}

Coordinate system:
- Center: (0, 0)
- Left edge: x = -${halfWidth} | Right edge: x = +${halfWidth}
- Top edge: y = -${halfHeight} | Bottom edge: y = +${halfHeight}

## CURRENT PROJECT STATE
${buildCanvasState(project)}

## MOTION DESIGN PRINCIPLES

- **Timing**: Entrances 0.3-0.6s, exits 0.2-0.4s, stagger 0.1-0.2s
- **Easing**: ease-out (entrances), ease-in (exits), ease-in-out (movements)
- **Hierarchy**: Animate hero elements first, then supporting elements
- **Polish**: Subtle overshoot (scale: 1 → 1.05 → 1) adds polish

## LAYER REFERENCES

**For layers YOU create:** Use layer_0, layer_1, etc. (assigned in creation order)
**For EXISTING layers:** Use the exact ID or name shown in PROJECT STATE below

Example: If PROJECT STATE shows '0. "Title" (id: "abc123", type: text)':
- Use "abc123" or "Title" to reference it
- layer_0 will NOT work (it only tracks layers you create)

## ANIMATION IS REQUIRED

**Every layer MUST have animation.** Static layers are not acceptable for motion graphics.

Options to animate:
1. **Inline animation**: Pass \`animation: { preset: "fade-in", startTime: 0, duration: 0.5 }\` in create tool
2. **Separate call**: Use animate_layer after creating the layer

Available presets: fade-in, fade-out, slide-in-left, slide-in-right, slide-in-top, slide-in-bottom, scale-in, pop, bounce-in, rotate-in, zoom-in, pulse, float

Stagger timing: Start each layer's animation 0.1-0.3s after the previous one for professional flow.

## PROPS ARE IMPORTANT

Every layer should have meaningful props that match the user's intent.

**Position matters!** Don't stack everything at (0,0). Plan your composition:
- Title at top: y = -${project.height / 3}
- Main content: y = 0
- Subtitle/footer: y = +${project.height / 3}
- Use x offset for side-by-side elements

**GOOD example:**
\`\`\`json
create_text_layer({
  "name": "Hero Title",
  "position": { "x": 0, "y": -150 },
  "props": { "content": "DevMotion", "fontSize": 96, "fontWeight": "bold", "color": "#ffffff" },
  "animation": { "preset": "slide-in-bottom", "startTime": 0.2, "duration": 0.6 }
})
\`\`\`

## KEY RULES

1. Use the specific create tool for each layer type (create_text_layer, create_icon_layer, etc.)
2. ALWAYS add animation to every layer (inline or via animate_layer)
3. ALWAYS include meaningful props - the tool shows you exactly what's available
4. ALWAYS position layers intentionally - don't stack at center
5. Build progressively - create layers one by one
6. Use staggered timing for multi-layer animations

Now help the user create their animation.`;
}

/**
 * Build visual canvas state
 */
function buildCanvasState(project: Project): string {
  if (project.layers.length === 0) {
    return `Canvas is EMPTY. Start by creating layers.`;
  }

  const halfHeight = project.height / 2;

  // Group layers by rough vertical position
  const topLayers = project.layers.filter((l) => l.transform.y < -halfHeight / 3);
  const middleLayers = project.layers.filter(
    (l) => l.transform.y >= -halfHeight / 3 && l.transform.y <= halfHeight / 3
  );
  const bottomLayers = project.layers.filter((l) => l.transform.y > halfHeight / 3);

  let spatial = '';
  if (topLayers.length > 0) {
    spatial += `TOP:    ${topLayers.map((l) => `[${l.name}]`).join(' ')}\n`;
  }
  if (middleLayers.length > 0) {
    spatial += `CENTER: ${middleLayers.map((l) => `[${l.name}]`).join(' ')}\n`;
  }
  if (bottomLayers.length > 0) {
    spatial += `BOTTOM: ${bottomLayers.map((l) => `[${l.name}]`).join(' ')}\n`;
  }

  // Detailed layer list
  const layerList = project.layers
    .map((layer, index) => {
      const animatedProps = [...new Set(layer.keyframes.map((k) => k.property))];
      const propsPreview = Object.entries(layer.props)
        .slice(0, 3)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(', ');

      return `${index}. "${layer.name}" (id: "${layer.id}", type: ${layer.type})
   pos: (${layer.transform.x}, ${layer.transform.y}) | opacity: ${layer.style.opacity}
   props: {${propsPreview}${Object.keys(layer.props).length > 3 ? ', ...' : ''}}
   animated: [${animatedProps.join(', ') || 'none'}]`;
    })
    .join('\n');

  return `${spatial}
LAYERS (${project.layers.length} total):
${layerList}`;
}

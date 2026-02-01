/**
 * System prompt builder for progressive AI animation generation
 * Focuses on workflow and design principles, delegating specifics to tool documentation
 */
import type { Project } from '$lib/types/animation';
import { layerRegistry, getAvailableLayerTypes, type LayerType } from '$lib/layers/registry';

/**
 * Build formatted list of available layer types
 */
function buildLayerTypesList(): string {
  return getAvailableLayerTypes()
    .map((type) => {
      const definition = layerRegistry[type as LayerType];
      return `- **${type}**: ${definition.description || definition.label}`;
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

## AVAILABLE LAYER TYPES

${buildLayerTypesList()}

## YOUR WORKFLOW

1. **Discover**: ALWAYS call get_layer_info before creating a layer type you haven't used yet
2. **Design**: Plan your composition and explain your approach
3. **Build**: Create layers with create_layer (returns layer_0, layer_1, etc.)
4. **Animate**: Add motion with animate_layer
5. **Refine**: Edit and iterate based on tool results

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

## KEY RULES

1. ALWAYS call get_layer_info before using a layer type for the first time
2. Check PROJECT STATE to see existing layers and their IDs
3. Build progressively - create layers one by one, verify results
4. Read tool result messages - they confirm success or explain errors

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

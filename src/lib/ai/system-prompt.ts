/**
 * System prompt builder for progressive AI animation generation.
 *
 * Design goals:
 * - Keep the prompt short and non-repetitive (LLMs degrade with long context).
 * - Do NOT duplicate information already present in tool schemas/descriptions
 *   (preset lists, key props, etc. live in the tool definitions).
 * - Derive everything possible from the registry/schemas at runtime.
 */
import type { Project } from '$lib/types/animation';

/**
 * Build the system prompt for progressive tool-calling
 */
export function buildSystemPrompt(project: Project): string {
  const halfWidth = project.width / 2;
  const halfHeight = project.height / 2;
  const thirdHeight = Math.round(project.height / 3);

  return `You are a motion-graphics designer. You create professional video animations by calling tools step-by-step.

## Workflow

1. **configure_project** first if the user wants a specific format, background, or duration.
2. **Create layers** with create_*_layer tools. Each call returns a reference (layer_0, layer_1, ...) you can reuse.
3. **Animate every layer** — pass an \`animation\` object inline when creating, or call animate_layer after. No layer should be static.
4. **Refine** with edit_layer or remove_layer as needed.

## Canvas

${project.width}x${project.height}px, center at (0,0). X: -${halfWidth}..+${halfWidth}. Y: -${halfHeight}..+${halfHeight}.
Duration: ${project.duration}s | FPS: ${project.fps} | Background: ${project.background}

## Layout guidelines

Distribute layers across the canvas — never stack everything at (0,0).
- Title area: y ≈ -${thirdHeight}
- Main content: y ≈ 0
- Footer / subtitle: y ≈ +${thirdHeight}

## Layer references

- **Layers you create**: use layer_0, layer_1, ... (assigned in creation order within this conversation).
- **Pre-existing layers**: use the exact \`id\` or \`name\` shown in PROJECT STATE. layer_N does NOT work for pre-existing layers.

## Animation tips

- Stagger start times by 0.1–0.3 s between layers for a professional sequence.
- Entrances: 0.3–0.6 s with ease-out. Exits: 0.2–0.4 s with ease-in.
- Animate hero elements first, then supporting ones.

## Rules

1. Always set meaningful props (content, colors, sizes) — do not rely on defaults for visible content.
2. Always position layers intentionally.
3. Always animate every layer.
4. Create layers one at a time; do not batch unrelated layers in a single call.

## Project state
${buildCanvasState(project)}`;
}

/**
 * Build a compact view of the current canvas state for the AI.
 */
function buildCanvasState(project: Project): string {
  if (project.layers.length === 0) {
    return 'Empty canvas — no layers yet.';
  }

  const layerList = project.layers
    .map((layer, index) => {
      // Show ALL props
      const propsPreview = Object.entries(layer.props)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(', ');

      // Group keyframes by property and show all details
      const keyframesByProp = new Map<string, typeof layer.keyframes>();
      for (const kf of layer.keyframes) {
        if (!keyframesByProp.has(kf.property)) {
          keyframesByProp.set(kf.property, []);
        }
        keyframesByProp.get(kf.property)!.push(kf);
      }

      // Build detailed keyframe info
      let keyframesDetail = '';
      if (keyframesByProp.size > 0) {
        keyframesDetail = '\n   keyframes:';
        for (const [prop, kfs] of keyframesByProp) {
          const kfList = kfs
            .sort((a, b) => a.time - b.time)
            .map(
              (kf) =>
                `t=${kf.time}s: ${JSON.stringify(kf.value)}${kf.easing ? ` (${kf.easing})` : ''}`
            )
            .join(', ');
          keyframesDetail += `\n     ${prop}: [${kfList}]`;
        }
      }

      return `${index}. "${layer.name}" (id: "${layer.id}", type: ${layer.type})
   pos: (${layer.transform.x}, ${layer.transform.y}) | scale: (${layer.transform.scaleX}, ${layer.transform.scaleY}) | rotation: ${layer.transform.rotationZ}° | opacity: ${layer.style.opacity}
   props: {${propsPreview || 'none'}}${keyframesDetail || '\n   keyframes: none'}`;
    })
    .join('\n\n');

  return `${project.layers.length} layer(s):\n${layerList}`;
}

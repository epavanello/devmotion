/**
 * System prompt builder for AI animation generation
 * Optimized for clarity, spatial awareness, and creative output
 */
import { layerRegistry, type LayerType } from '$lib/layers/registry';
import { extractDefaultValues } from '$lib/layers/base';
import type { Project } from '$lib/types/animation';
import { animationPresets } from '$lib/engine/presets';

/**
 * Build the system prompt for the AI model
 */
export function buildSystemPrompt(project: Project): string {
  const halfWidth = project.width / 2;
  const halfHeight = project.height / 2;

  return `# DevMotion AI - Professional Motion Graphics Designer

You create stunning video animations by generating precise layer and keyframe operations.

## CANVAS SPACE
\`\`\`
┌─────────────────────────────────────────┐
│            y = -${halfHeight} (TOP)              │
│                    ▲                    │
│                    │                    │
│  x = -${halfWidth} ◄──── (0,0) ────► x = +${halfWidth}  │
│   (LEFT)           │           (RIGHT)  │
│                    ▼                    │
│           y = +${halfHeight} (BOTTOM)            │
└─────────────────────────────────────────┘
Canvas: ${project.width}x${project.height}px | Duration: ${project.duration}s | FPS: ${project.fps}
Background: ${project.backgroundColor}
\`\`\`

## TIMELINE STRUCTURE (${project.duration}s video)
${buildTimelineStructure(project.duration)}

## YOUR CAPABILITIES

### Layer Types
${buildLayerTypesCompact()}

### Animation Presets (use apply_preset)
${animationPresets.map((p) => `• ${p.id}`).join(' | ')}

### Animatable Properties
- **Transform**: position.x, position.y, position.z, scale.x, scale.y, scale.z, rotation.x, rotation.y, rotation.z
- **Style**: opacity (0-1)
- **Props**: props.<propName> (e.g., props.content, props.fontSize, props.color)

### Easing Types
linear | ease-in | ease-out | ease-in-out | cubic-bezier

## CURRENT CANVAS STATE
${buildCanvasState(project)}

## OPERATION FORMAT

Return JSON:
\`\`\`json
{
  "message": "Brief description (max 100 chars)",
  "operations": [/* operations array */]
}
\`\`\`

### Operations:

**add_layer** - Create layer
\`\`\`json
{"action": "add_layer", "type": "text", "position": {"x": 0, "y": -200}, "props": {"content": "Title", "fontSize": 72, "color": "#ffffff"}}
\`\`\`

**add_keyframe** - Animate property
\`\`\`json
{"action": "add_keyframe", "layerId": "layer_0", "keyframe": {"time": 0, "property": "opacity", "value": 0, "easing": {"type": "ease-out"}}}
\`\`\`

**apply_preset** - Apply animation
\`\`\`json
{"action": "apply_preset", "layerId": "layer_0", "presetId": "fade-in", "startTime": 0, "duration": 0.5}
\`\`\`

**batch_keyframes** - Multiple keyframes at once
\`\`\`json
{"action": "batch_keyframes", "layerId": "layer_0", "keyframes": [
  {"time": 0, "property": "opacity", "value": 0},
  {"time": 0, "property": "scale.x", "value": 0.8},
  {"time": 0.5, "property": "opacity", "value": 1, "easing": {"type": "ease-out"}},
  {"time": 0.5, "property": "scale.x", "value": 1, "easing": {"type": "ease-out"}}
]}
\`\`\`

**edit_layer** - Modify existing layer
\`\`\`json
{"action": "edit_layer", "layerId": "existing-id", "updates": {"props": {"content": "New text"}}}
\`\`\`

**create_scene** - Create complete scene with coordinated animations (HIGH-LEVEL)
\`\`\`json
{
  "action": "create_scene",
  "name": "Hero Intro",
  "startTime": 0,
  "duration": 2,
  "layers": [
    {
      "type": "text",
      "name": "Title",
      "position": {"x": 0, "y": -100},
      "props": {"content": "Welcome", "fontSize": 72, "color": "#ffffff"},
      "animation": {"preset": "scale-in", "delay": 0, "duration": 0.6}
    },
    {
      "type": "text",
      "name": "Subtitle",
      "position": {"x": 0, "y": 50},
      "props": {"content": "Your tagline here", "fontSize": 32, "color": "#a0a0a0"},
      "animation": {"preset": "fade-in", "delay": 0.3, "duration": 0.5}
    }
  ]
}
\`\`\`

**set_project** - Change project settings
\`\`\`json
{"action": "set_project", "settings": {"backgroundColor": "#1a1a2e", "duration": 10}}
\`\`\`

## CRITICAL RULES

1. **Layer IDs**: For NEW layers use layer_0, layer_1, layer_2... (index-based). For EXISTING layers use their actual ID.

2. **ALWAYS specify props**: Never create layers with empty props. Text needs content, shapes need fill, etc.

3. **Complete animations**: Every animated element needs START keyframe (usually time=0) and END keyframe.

4. **Timing**:
   - Entrance: 0.3-0.6s
   - Exit: 0.2-0.4s
   - Stagger between elements: 0.1-0.2s

5. **Visual hierarchy**: Hero → Supporting → CTA (stagger entrances)

6. **Use batch_keyframes** for efficiency when adding multiple keyframes to same layer.

## MOTION DESIGN PRINCIPLES

- **ease-out** for entrances (arriving)
- **ease-in** for exits (leaving)
- **ease-in-out** for movements within frame
- Add slight overshoot (scale 1.05→1) for "pop" effect
- Stagger element entrances for rhythm

Now create professional-quality animations based on the user's request.`;
}

/**
 * Build timeline structure based on duration
 */
function buildTimelineStructure(duration: number): string {
  if (duration <= 3) {
    return `\`\`\`
[0s]─────[${(duration * 0.3).toFixed(1)}s]─────[${(duration * 0.7).toFixed(1)}s]─────[${duration}s]
 │         │              │              │
 └─ENTER───┴───DISPLAY────┴───HOLD/EXIT──┘
\`\`\``;
  }

  if (duration <= 5) {
    return `\`\`\`
[0s]──[0.8s]──[1.5s]──[${(duration - 1).toFixed(1)}s]──[${duration}s]
 │      │       │         │        │
 └HERO──┴SUPPORT┴──CTA────┴─HOLD───┘
\`\`\`
- 0-0.8s: Hero entrance (title/main)
- 0.6-1.5s: Supporting elements (tagline)
- 1.0-2.0s: CTA/action elements
- Rest: Hold/display`;
  }

  if (duration <= 10) {
    return `\`\`\`
[0s]──[2s]──[4s]──[6s]──[8s]──[${duration}s]
 │     │     │     │     │      │
 └SC1──┴SC2──┴SC3──┴SC4──┴OUTRO─┘
\`\`\`
Structure as 3-4 scenes:
- Scene 1 (0-2s): Hero intro
- Scene 2 (2-4s): Features/benefits
- Scene 3 (4-6s): Details/proof
- Scene 4 (6-${duration}s): CTA + outro`;
  }

  const sceneCount = Math.floor(duration / 3);
  return `Structure as ${sceneCount} scenes of ~3s each:
${Array.from({ length: sceneCount }, (_, i) => `- Scene ${i + 1}: ${i * 3}-${Math.min((i + 1) * 3, duration)}s`).join('\n')}`;
}

/**
 * Build compact layer types reference
 */
function buildLayerTypesCompact(): string {
  const layerTypes = Object.keys(layerRegistry) as LayerType[];

  return layerTypes
    .map((type) => {
      const definition = layerRegistry[type];
      const defaults = extractDefaultValues(definition.schema);
      const requiredProps = getRequiredPropsForType(type);

      const propsStr = requiredProps
        .map((prop) => {
          const def = defaults[prop];
          return def !== undefined ? `${prop}=${JSON.stringify(def)}` : `${prop}`;
        })
        .join(', ');

      return `• **${type}**: ${getLayerUsageHint(type)} | Required: {${propsStr}}`;
    })
    .join('\n');
}

/**
 * Build visual canvas state
 */
function buildCanvasState(project: Project): string {
  if (project.layers.length === 0) {
    return `Canvas is EMPTY. Create layers to build your animation.`;
  }

  const halfHeight = project.height / 2;

  // Build a simple spatial representation
  let spatial = `\`\`\`
SPATIAL VIEW (approximate positions):
`;

  // Group layers by rough vertical position
  const topLayers = project.layers.filter((l) => l.transform.y < -halfHeight / 3);
  const middleLayers = project.layers.filter(
    (l) => l.transform.y >= -halfHeight / 3 && l.transform.y <= halfHeight / 3
  );
  const bottomLayers = project.layers.filter((l) => l.transform.y > halfHeight / 3);

  if (topLayers.length > 0) {
    spatial += `TOP:    ${topLayers.map((l) => `[${l.name}]`).join(' ')}\n`;
  }
  if (middleLayers.length > 0) {
    spatial += `CENTER: ${middleLayers.map((l) => `[${l.name}]`).join(' ')}\n`;
  }
  if (bottomLayers.length > 0) {
    spatial += `BOTTOM: ${bottomLayers.map((l) => `[${l.name}]`).join(' ')}\n`;
  }

  spatial += `\`\`\`\n`;

  // Build timeline view
  let timeline = `TIMELINE VIEW:\n`;
  for (const layer of project.layers) {
    const keyframeTimes = [...new Set(layer.keyframes.map((k) => k.time))].sort((a, b) => a - b);
    const timelineBar = buildTimelineBar(keyframeTimes, project.duration);
    timeline += `${layer.name.padEnd(15)} ${timelineBar}\n`;
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
${timeline}
LAYERS (use these IDs for editing):
${layerList}`;
}

/**
 * Build a simple ASCII timeline bar
 */
function buildTimelineBar(keyframeTimes: number[], duration: number): string {
  const width = 40;
  const bar = Array(width).fill('─');

  for (const time of keyframeTimes) {
    const pos = Math.round((time / duration) * (width - 1));
    bar[pos] = '●';
  }

  return `[${bar.join('')}] ${duration}s`;
}

/**
 * Get required props for each layer type
 */
function getRequiredPropsForType(type: LayerType): string[] {
  const required: Record<string, string[]> = {
    text: ['content', 'fontSize', 'color'],
    shape: ['shapeType', 'width', 'height', 'fill'],
    terminal: ['content', 'width', 'height'],
    button: ['text', 'backgroundColor', 'width', 'height'],
    phone: ['width', 'height'],
    browser: ['width', 'height'],
    mouse: ['pointerType'],
    icon: ['icon', 'size', 'color'],
    progress: ['progress', 'width', 'progressColor'],
    code: ['code', 'language', 'width'],
    html: ['html', 'width', 'height']
  };
  return required[type] || [];
}

/**
 * Get usage hints for each layer type
 */
function getLayerUsageHint(type: LayerType): string {
  const hints: Record<string, string> = {
    text: 'Titles, labels, text content',
    shape: 'Backgrounds, decorations, geometric elements',
    terminal: 'CLI/command display with typing effect',
    button: 'CTAs, clickable elements',
    phone: 'Mobile device mockup',
    browser: 'Desktop browser mockup',
    mouse: 'Cursor animations',
    icon: 'Lucide icons for features/UI',
    progress: 'Loading bars, progress indicators',
    code: 'Syntax-highlighted code snippets',
    html: 'Custom HTML/CSS content with variable interpolation'
  };
  return hints[type] || '';
}

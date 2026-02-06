/**
 * Shared mutation logic for AI tools (Web App & MCP)
 *
 * This module provides pure mutation functions that modify Project objects.
 * These functions are used by:
 * - Web app: Client-side project modifications (ai-operations.svelte.ts)
 * - MCP server: Server-side project modifications (+server.ts)
 *
 * All mutations accept a MutationContext and return typed results.
 * The context includes the project and optional layer ID tracking for
 * resolving temporary layer references (layer_0, layer_1, etc.).
 */
import { nanoid } from 'nanoid';
import type { LayerType, Easing, AnimatableProperty, Keyframe } from '$lib/types/animation';
import { createLayer } from '$lib/engine/layer-factory';
import { getPresetById } from '$lib/engine/presets';
import type {
  CreateLayerInput,
  CreateLayerOutput,
  AnimateLayerInput,
  AnimateLayerOutput,
  EditLayerInput,
  EditLayerOutput,
  RemoveLayerInput,
  RemoveLayerOutput,
  ConfigureProjectInput,
  ConfigureProjectOutput
} from './schemas';
import type { ProjectData } from '$lib/schemas/animation';

/**
 * Context for resolving layer IDs (e.g. "layer_0" -> "actual-uuid")
 */
export interface MutationContext {
  project: ProjectData;
  /**
   * Map of temporary IDs (e.g. from tool calls) to actual layer IDs.
   * This should be persisted/passed along if you want continuity between calls.
   */
  layerIdMap?: Map<number, string>;

  /**
   * Current index for assigning new temporary IDs (layer_0, layer_1...)
   */
  layerCreationIndex?: number;
}

/**
 * Helper to update the context after layer creation
 */
export interface MutationResult<T> {
  output: T;
  nextLayerCreationIndex?: number;
}

// ============================================
// Layer Resolution
// ============================================

function resolveLayerId(
  project: ProjectData,
  ref: string,
  layerIdMap?: Map<number, string>
): string | null {
  // Check for "layer_N" pattern
  const layerMatch = ref.match(/^layer_(\d+)$/);
  if (layerMatch && layerIdMap) {
    const index = parseInt(layerMatch[1], 10);
    const resolvedId = layerIdMap.get(index);
    if (resolvedId) {
      return resolvedId;
    }
  }

  // Check if it's an actual layer ID
  const existingLayer = project.layers.find((l) => l.id === ref);
  if (existingLayer) {
    return ref;
  }

  // Check by name (case-insensitive)
  const layerByName = project.layers.find((l) => l.name.toLowerCase() === ref.toLowerCase());
  if (layerByName) {
    return layerByName.id;
  }

  return null;
}

/**
 * Build an error string listing available layers so the AI can self-correct.
 */
function layerNotFoundError(project: ProjectData, ref: string): string {
  if (project.layers.length === 0) {
    return `Layer "${ref}" not found. The project has no layers — create one first.`;
  }
  const available = project.layers.map((l) => `"${l.name}" (id: ${l.id})`).join(', ');
  return (
    `Layer "${ref}" not found. ` +
    `Use layer_N for layers you just created in this conversation, ` +
    `or reference existing layers by id/name. ` +
    `Available layers: ${available}`
  );
}

// ============================================
// Mutations
// ============================================

export function mutateCreateLayer(
  ctx: MutationContext,
  input: CreateLayerInput
): MutationResult<CreateLayerOutput> {
  try {
    const layer = createLayer(
      input.type as LayerType,
      input.props || {},
      input.position || { x: 0, y: 0 }
    );

    if (input.name) {
      layer.name = input.name;
    }

    // Set enter/exit time if provided in input
    if (input.enterTime !== undefined) {
      layer.enterTime = input.enterTime;
    }
    if (input.exitTime !== undefined) {
      layer.exitTime = input.exitTime;
    }

    // Set content duration and offset if provided (for video/audio layers)
    if (input.contentDuration !== undefined) {
      layer.contentDuration = input.contentDuration;
    }
    if (input.contentOffset !== undefined) {
      layer.contentOffset = input.contentOffset;
    }

    // Mutate project
    ctx.project.layers.push(layer);

    // Track ID
    let nextIndex = ctx.layerCreationIndex ?? 0;
    if (ctx.layerIdMap) {
      ctx.layerIdMap.set(nextIndex, layer.id);
      nextIndex++;
    }

    // Apply animation
    if (input.animation?.preset) {
      applyPresetToProject(
        ctx.project,
        layer.id,
        input.animation.preset,
        input.animation.startTime ?? 0,
        input.animation.duration ?? 0.5
      );
    }

    return {
      output: {
        success: true,
        layerId: layer.id,
        layerIndex: ctx.layerCreationIndex, // Return the index used for this layer
        layerName: layer.name,
        message: `Created ${input.type} layer "${layer.name}"`
      },
      nextLayerCreationIndex: nextIndex
    };
  } catch (err) {
    return {
      output: {
        success: false,
        message: 'Failed to create layer',
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    };
  }
}

export function mutateAnimateLayer(
  ctx: MutationContext,
  input: AnimateLayerInput
): AnimateLayerOutput {
  const resolvedId = resolveLayerId(ctx.project, input.layerId, ctx.layerIdMap);

  if (!resolvedId) {
    const errMsg = layerNotFoundError(ctx.project, input.layerId);
    return { success: false, message: errMsg, error: errMsg };
  }

  const layer = ctx.project.layers.find((l) => l.id === resolvedId);
  if (!layer) {
    return {
      success: false,
      message: 'Layer was removed',
      error: 'The layer no longer exists in the project.'
    };
  }

  let keyframesAdded = 0;

  try {
    // Apply preset
    if (input.preset) {
      applyPresetToProject(
        ctx.project,
        resolvedId,
        input.preset.id,
        input.preset.startTime ?? 0,
        input.preset.duration ?? 0.5
      );
      keyframesAdded += 4; // Approximate
    }

    // Add custom keyframes
    if (input.keyframes) {
      for (const kf of input.keyframes) {
        const easing: Easing = kf.easing
          ? { type: kf.easing.type as Easing['type'], bezier: kf.easing.bezier }
          : { type: 'ease-in-out' };

        const clampedTime = Math.max(0, Math.min(kf.time, ctx.project.duration));

        addKeyframeToProject(ctx.project, resolvedId, {
          id: nanoid(),
          time: clampedTime,
          property: kf.property as AnimatableProperty,
          value: kf.value as number | string | boolean,
          easing
        });
        keyframesAdded++;
      }
    }

    return {
      success: true,
      layerId: resolvedId,
      keyframesAdded,
      message: `Added ${keyframesAdded} keyframes to "${layer.name}"`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to animate layer',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export function mutateEditLayer(ctx: MutationContext, input: EditLayerInput): EditLayerOutput {
  const resolvedId = resolveLayerId(ctx.project, input.layerId, ctx.layerIdMap);
  if (!resolvedId) {
    const errMsg = layerNotFoundError(ctx.project, input.layerId);
    return { success: false, message: errMsg, error: errMsg };
  }

  const layerIndex = ctx.project.layers.findIndex((l) => l.id === resolvedId);
  if (layerIndex === -1) {
    return {
      success: false,
      message: 'Layer was removed',
      error: 'The layer no longer exists'
    };
  }

  const layer = ctx.project.layers[layerIndex];

  try {
    if (input.updates.name !== undefined) layer.name = input.updates.name;
    if (input.updates.visible !== undefined) layer.visible = input.updates.visible;
    if (input.updates.locked !== undefined) layer.locked = input.updates.locked;

    if (input.updates.position) {
      layer.transform.x = input.updates.position.x ?? layer.transform.x;
      layer.transform.y = input.updates.position.y ?? layer.transform.y;
    }

    if (input.updates.scale) {
      layer.transform.scaleX = input.updates.scale.x ?? layer.transform.scaleX;
      layer.transform.scaleY = input.updates.scale.y ?? layer.transform.scaleY;
    }

    if (input.updates.rotation !== undefined) {
      layer.transform.rotationZ = (input.updates.rotation * Math.PI) / 180;
    }

    if (input.updates.opacity !== undefined) {
      layer.style.opacity = input.updates.opacity;
    }

    if (input.updates.props) {
      layer.props = { ...layer.props, ...input.updates.props };
    }

    // Update enter/exit times
    if (input.updates.enterTime !== undefined) {
      layer.enterTime = Math.max(0, input.updates.enterTime);
    }
    if (input.updates.exitTime !== undefined) {
      layer.exitTime = Math.max(0, input.updates.exitTime);
    }

    // Update content duration and offset (for video/audio layers)
    if (input.updates.contentDuration !== undefined) {
      layer.contentDuration = Math.max(0, input.updates.contentDuration);
    }
    if (input.updates.contentOffset !== undefined) {
      layer.contentOffset = Math.max(0, input.updates.contentOffset);
    }

    return {
      success: true,
      layerId: resolvedId,
      message: `Updated layer "${layer.name}"`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to edit layer',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export function mutateRemoveLayer(
  ctx: MutationContext,
  input: RemoveLayerInput
): RemoveLayerOutput {
  const resolvedId = resolveLayerId(ctx.project, input.layerId, ctx.layerIdMap);
  if (!resolvedId) {
    const errMsg = layerNotFoundError(ctx.project, input.layerId);
    return { success: false, message: errMsg, error: errMsg };
  }

  const index = ctx.project.layers.findIndex((l) => l.id === resolvedId);
  if (index === -1) {
    // Already removed?
    return { success: true, message: 'Layer already removed or not found' };
  }

  const name = ctx.project.layers[index].name;
  ctx.project.layers.splice(index, 1);

  return {
    success: true,
    message: `Removed layer "${name}"`
  };
}

export function mutateConfigureProject(
  ctx: MutationContext,
  input: ConfigureProjectInput
): ConfigureProjectOutput {
  try {
    const changes: string[] = [];

    if (input.name !== undefined) {
      ctx.project.name = input.name;
      changes.push(`name="${input.name}"`);
    }

    if (input.width !== undefined) {
      ctx.project.width = input.width;
      changes.push(`width=${input.width}`);
    }

    if (input.height !== undefined) {
      ctx.project.height = input.height;
      changes.push(`height=${input.height}`);
    }

    if (input.duration !== undefined) {
      ctx.project.duration = input.duration;
      changes.push(`duration=${input.duration}s`);
    }

    if (input.backgroundColor !== undefined) {
      ctx.project.background = input.backgroundColor;
      changes.push(`background=${input.backgroundColor}`);
    }

    if (changes.length === 0) {
      return {
        success: true,
        message: 'No changes specified'
      };
    }

    return {
      success: true,
      message: `Updated project: ${changes.join(', ')}`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to configure project',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

// ============================================
// Internal Helpers (duplicated/adapted from store/logic)
// ============================================

function addKeyframeToProject(project: ProjectData, layerId: string, keyframe: Keyframe) {
  const layer = project.layers.find((l) => l.id === layerId);
  if (layer) {
    layer.keyframes.push(keyframe);
    layer.keyframes.sort((a, b) => a.time - b.time);
  }
}

function applyPresetToProject(
  project: ProjectData,
  layerId: string,
  presetId: string,
  startTime: number,
  duration: number
) {
  const layer = project.layers.find((l) => l.id === layerId);
  if (!layer) return;

  const preset = getPresetById(presetId);
  if (!preset) return;

  for (const kf of preset.keyframes) {
    const scaledTime = startTime + kf.time * duration;
    const clampedTime = Math.max(0, Math.min(scaledTime, project.duration));

    let value = kf.value;
    if (kf.property === 'position.x' && typeof kf.value === 'number') {
      value = layer.transform.x + kf.value;
    } else if (kf.property === 'position.y' && typeof kf.value === 'number') {
      value = layer.transform.y + kf.value;
    }

    addKeyframeToProject(project, layerId, {
      id: nanoid(),
      time: clampedTime,
      property: kf.property,
      value,
      easing: kf.easing
    });
  }
}

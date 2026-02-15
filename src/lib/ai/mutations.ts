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
import type { Interpolation, AnimatableProperty, Keyframe } from '$lib/types/animation';
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
  ConfigureProjectOutput,
  GroupLayersInput,
  GroupLayersOutput,
  UngroupLayersInput,
  UngroupLayersOutput,
  UpdateKeyframeInput,
  UpdateKeyframeOutput,
  RemoveKeyframeInput,
  RemoveKeyframeOutput
} from './schemas';
import type { Layer, ProjectData } from '$lib/schemas/animation';

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
    const layer = createLayer(input.type, {
      props: input.props,
      transform: input.transform,
      projectDimensions: {
        width: ctx.project.width,
        height: ctx.project.height
      }
    });

    if (input.name) {
      layer.name = input.name;
    }

    // Set visible and locked if provided
    if (input.visible !== undefined) {
      layer.visible = input.visible;
    }
    if (input.locked !== undefined) {
      layer.locked = input.locked;
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
        // Default to continuous ease-in-out interpolation
        const interpolation: Interpolation = kf.interpolation ?? {
          family: 'continuous',
          strategy: 'ease-in-out'
        };

        const clampedTime = Math.max(0, Math.min(kf.time, ctx.project.duration));

        addKeyframeToProject(ctx.project, resolvedId, {
          id: nanoid(),
          time: clampedTime,
          property: kf.property as AnimatableProperty,
          value: kf.value as number | string | boolean,
          interpolation
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
    if (input.updates.name !== undefined) {
      layer.name = input.updates.name;
    }
    if (input.updates.visible !== undefined) {
      layer.visible = input.updates.visible;
    }
    if (input.updates.locked !== undefined) {
      layer.locked = input.updates.locked;
    }

    if (input.updates.transform) {
      layer.transform = { ...layer.transform, ...input.updates.transform };
    }

    // Handle anchor point
    if (input.updates.anchor !== undefined) {
      layer.transform.anchor = input.updates.anchor;
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
    return { success: true, message: 'Layer already removed or not found' };
  }

  const layer = ctx.project.layers[index];
  const name = layer.name;

  // If removing a group, also remove all children
  if (layer.type === 'group') {
    ctx.project.layers = ctx.project.layers.filter(
      (l) => l.id !== resolvedId && l.parentId !== resolvedId
    );
  } else {
    ctx.project.layers.splice(index, 1);
  }

  return {
    success: true,
    message: `Removed layer "${name}"`
  };
}

// ============================================
// Group Mutations
// ============================================

export function mutateGroupLayers(
  ctx: MutationContext,
  input: GroupLayersInput
): GroupLayersOutput {
  try {
    const resolvedIds: string[] = [];
    for (const ref of input.layerIds) {
      const id = resolveLayerId(ctx.project, ref, ctx.layerIdMap);
      if (!id) {
        return {
          success: false,
          message: layerNotFoundError(ctx.project, ref),
          error: `Layer "${ref}" not found`
        };
      }
      resolvedIds.push(id);
    }

    if (resolvedIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 layers to create a group',
        error: 'Insufficient layers'
      };
    }

    // Validate none are already in a group or are groups themselves
    for (const id of resolvedIds) {
      const layer = ctx.project.layers.find((l) => l.id === id);
      if (layer?.parentId) {
        return {
          success: false,
          message: `Layer "${layer.name}" is already in a group`,
          error: 'Layer already grouped'
        };
      }
      if (layer?.type === 'group') {
        return {
          success: false,
          message: `Cannot nest group "${layer.name}" inside another group`,
          error: 'Cannot nest groups'
        };
      }
    }

    const groupId = nanoid();

    // Create the group layer
    const groupLayer: Layer = {
      id: groupId,
      name: input.name ?? 'Group',
      type: 'group' as const,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1 },
        anchor: 'center' as const
      },
      style: { opacity: 1 },
      visible: true,
      locked: false,
      keyframes: [],
      props: { collapsed: false }
    };

    // Find insertion point (earliest child position)
    const childIdSet = new Set(resolvedIds);
    const indices = ctx.project.layers
      .map((l, i) => (childIdSet.has(l.id) ? i : -1))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    const insertIndex = indices[0];

    // Set parentId on children
    for (const layer of ctx.project.layers) {
      if (childIdSet.has(layer.id)) {
        layer.parentId = groupId;
      }
    }

    // Move children out, insert group + children at the right position
    const childLayers = ctx.project.layers.filter((l) => childIdSet.has(l.id));
    const otherLayers = ctx.project.layers.filter((l) => !childIdSet.has(l.id));
    otherLayers.splice(insertIndex, 0, groupLayer, ...childLayers);
    ctx.project.layers = otherLayers;

    return {
      success: true,
      groupId,
      message: `Created group "${groupLayer.name}" with ${resolvedIds.length} layers`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to create group',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export function mutateUngroupLayers(
  ctx: MutationContext,
  input: UngroupLayersInput
): UngroupLayersOutput {
  const resolvedId = resolveLayerId(ctx.project, input.groupId, ctx.layerIdMap);
  if (!resolvedId) {
    const errMsg = layerNotFoundError(ctx.project, input.groupId);
    return { success: false, message: errMsg, error: errMsg };
  }

  const group = ctx.project.layers.find((l) => l.id === resolvedId);
  if (!group || group.type !== 'group') {
    return {
      success: false,
      message: `Layer "${input.groupId}" is not a group`,
      error: 'Not a group layer'
    };
  }

  const gt = group.transform;
  const gs = group.style;

  // Bake group transform into children and remove parentId
  for (const layer of ctx.project.layers) {
    if (layer.parentId === resolvedId) {
      layer.parentId = undefined;
      layer.transform.position.x += gt.position.x;
      layer.transform.position.y += gt.position.y;
      layer.transform.position.z += gt.position.z;
      layer.transform.rotation.x += gt.rotation.x;
      layer.transform.rotation.y += gt.rotation.y;
      layer.transform.rotation.z += gt.rotation.z;
      layer.transform.scale.x *= gt.scale.x;
      layer.transform.scale.y *= gt.scale.y;
      layer.style.opacity *= gs.opacity;
    }
  }

  // Remove the group layer
  ctx.project.layers = ctx.project.layers.filter((l) => l.id !== resolvedId);

  return {
    success: true,
    message: `Ungrouped "${group.name}"`
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
// Keyframe Mutations
// ============================================

export function mutateUpdateKeyframe(
  ctx: MutationContext,
  input: UpdateKeyframeInput
): UpdateKeyframeOutput {
  const resolvedId = resolveLayerId(ctx.project, input.layerId, ctx.layerIdMap);
  if (!resolvedId) {
    const errMsg = layerNotFoundError(ctx.project, input.layerId);
    return { success: false, message: errMsg, error: errMsg };
  }

  const layer = ctx.project.layers.find((l) => l.id === resolvedId);
  if (!layer) {
    return { success: false, message: 'Layer not found', error: 'Layer was removed' };
  }

  const keyframeIndex = layer.keyframes.findIndex((k) => k.id === input.keyframeId);
  if (keyframeIndex === -1) {
    return {
      success: false,
      message: `Keyframe "${input.keyframeId}" not found`,
      error: 'Keyframe ID not found in layer'
    };
  }

  try {
    const keyframe = layer.keyframes[keyframeIndex];

    if (input.updates.time !== undefined) {
      keyframe.time = Math.max(0, Math.min(input.updates.time, ctx.project.duration));
    }
    if (input.updates.value !== undefined) {
      keyframe.value = input.updates.value;
    }
    if (input.updates.interpolation !== undefined) {
      keyframe.interpolation = input.updates.interpolation;
    }

    // Re-sort keyframes by time
    layer.keyframes.sort((a, b) => a.time - b.time);

    return {
      success: true,
      message: `Updated keyframe on "${layer.name}"`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to update keyframe',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export function mutateRemoveKeyframe(
  ctx: MutationContext,
  input: RemoveKeyframeInput
): RemoveKeyframeOutput {
  const resolvedId = resolveLayerId(ctx.project, input.layerId, ctx.layerIdMap);
  if (!resolvedId) {
    const errMsg = layerNotFoundError(ctx.project, input.layerId);
    return { success: false, message: errMsg, error: errMsg };
  }

  const layer = ctx.project.layers.find((l) => l.id === resolvedId);
  if (!layer) {
    return { success: false, message: 'Layer not found', error: 'Layer was removed' };
  }

  if (!input.keyframeId) {
    return { success: false, message: 'keyframeId is required', error: 'Missing keyframeId' };
  }

  const keyframeIndex = layer.keyframes.findIndex((k) => k.id === input.keyframeId);
  if (keyframeIndex === -1) {
    return {
      success: false,
      message: `Keyframe "${input.keyframeId}" not found`,
      error: 'Keyframe ID not found in layer'
    };
  }

  try {
    layer.keyframes.splice(keyframeIndex, 1);
    return {
      success: true,
      message: `Removed keyframe from "${layer.name}"`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to remove keyframe',
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
      value = layer.transform.position.x + kf.value;
    } else if (kf.property === 'position.y' && typeof kf.value === 'number') {
      value = layer.transform.position.y + kf.value;
    }

    addKeyframeToProject(project, layerId, {
      id: nanoid(),
      time: clampedTime,
      property: kf.property,
      value,
      interpolation: kf.interpolation
    });
  }
}

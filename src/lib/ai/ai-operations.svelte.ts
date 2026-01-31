import { projectStore } from '$lib/stores/project.svelte';
import { createLayer } from '$lib/engine/layer-factory';
import { getPresetById } from '$lib/engine/presets';
import { nanoid } from 'nanoid';
import type {
  AIToolCall,
  AddLayerTool,
  EditLayerTool,
  RemoveLayerTool,
  AddKeyframeTool,
  EditKeyframeTool,
  RemoveKeyframeTool,
  ApplyPresetTool,
  BatchKeyframesTool,
  CreateSceneTool,
  SetProjectSettingsTool
} from '$lib/ai/schemas';
import type { LayerType, Easing, AnimatableProperty } from '$lib/types/animation';
import { SvelteMap } from 'svelte/reactivity';

// Track newly created layer IDs for keyframe resolution
// Maps index (layer_0 = 0, layer_1 = 1) to actual layer ID
const newLayerIds = new SvelteMap<number, string>();

/**
 * Execute all AI operations with layer ID tracking
 */
export function executeOperations(operations: AIToolCall[]) {
  let addLayerIndex = 0;
  newLayerIds.clear();

  for (const op of operations) {
    try {
      switch (op.action) {
        case 'add_layer':
          executeAddLayer(op, addLayerIndex++, newLayerIds);
          break;
        case 'edit_layer':
          executeEditLayer(op, newLayerIds);
          break;
        case 'remove_layer':
          executeRemoveLayer(op, newLayerIds);
          break;
        case 'add_keyframe':
          executeAddKeyframe(op, newLayerIds);
          break;
        case 'edit_keyframe':
          executeEditKeyframe(op, newLayerIds);
          break;
        case 'remove_keyframe':
          executeRemoveKeyframe(op, newLayerIds);
          break;
        case 'apply_preset':
          executeApplyPreset(op, newLayerIds);
          break;
        case 'batch_keyframes':
          executeBatchKeyframes(op, newLayerIds);
          break;
        case 'create_scene':
          executeCreateScene(op, newLayerIds);
          break;
        case 'set_project':
          executeSetProject(op);
          break;
      }
    } catch (error) {
      console.error(`Failed to execute operation: ${op.action}`, error);
    }
  }
}

function executeAddLayer(op: AddLayerTool, index: number) {
  const layer = createLayer(op.type as LayerType, op.props || {}, op.position || { x: 0, y: 0 });

  if (op.name) {
    layer.name = op.name;
  }

  // Track this layer ID for keyframe resolution
  newLayerIds.set(index, layer.id);

  projectStore.addLayer(layer);
  projectStore.selectedLayerId = layer.id;
}

function executeEditLayer(op: EditLayerTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  const layer = projectStore.project.layers.find((l) => l.id === resolvedLayerId);
  if (!layer) {
    console.warn(`Layer not found: ${op.layerId} (resolved: ${resolvedLayerId})`);
    return;
  }

  const updates: Record<string, unknown> = {};

  if (op.updates.name !== undefined) {
    updates.name = op.updates.name;
  }

  if (op.updates.visible !== undefined) {
    updates.visible = op.updates.visible;
  }

  if (op.updates.locked !== undefined) {
    updates.locked = op.updates.locked;
  }

  if (op.updates.transform) {
    updates.transform = {
      ...layer.transform,
      ...op.updates.transform
    };
  }

  if (op.updates.style) {
    updates.style = {
      ...layer.style,
      ...op.updates.style
    };
  }

  if (op.updates.props) {
    updates.props = {
      ...layer.props,
      ...op.updates.props
    };
  }

  projectStore.updateLayer(resolvedLayerId, updates);
}

function executeRemoveLayer(op: RemoveLayerTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  projectStore.removeLayer(resolvedLayerId);
}

/**
 * Resolve a layer ID from AI output to actual layer ID
 * Supports:
 * - "layer_0", "layer_1", etc. for newly created layers
 * - "new_layer_0", "new_layer_1", etc. (legacy format)
 * - Actual layer IDs from project state
 * - Layer names as fallback
 */
function resolveLayerId(layerId: string): string {
  // Check for "layer_N" pattern (preferred)
  const layerMatch = layerId.match(/^layer_(\d+)$/);
  if (layerMatch) {
    const index = parseInt(layerMatch[1], 10);
    const resolvedId = newLayerIds.get(index);
    if (resolvedId) {
      return resolvedId;
    }
  }

  // Check for "new_layer_N" pattern (legacy)
  const newLayerMatch = layerId.match(/^new_layer_(\d+)$/);
  if (newLayerMatch) {
    const index = parseInt(newLayerMatch[1], 10);
    const resolvedId = newLayerIds.get(index);
    if (resolvedId) {
      return resolvedId;
    }
  }

  // Check if layerId matches any existing layer ID
  const existingLayer = projectStore.project.layers.find((l) => l.id === layerId);
  if (existingLayer) {
    return layerId;
  }

  // Check if layerId matches any existing layer name
  const layerByName = projectStore.project.layers.find(
    (l) => l.name.toLowerCase() === layerId.toLowerCase()
  );
  if (layerByName) {
    console.warn(`Layer "${layerId}" matched by name, using id: ${layerByName.id}`);
    return layerByName.id;
  }

  // Fallback: try to find the most recently added layer
  const lastLayer = projectStore.project.layers[projectStore.project.layers.length - 1];
  if (lastLayer) {
    console.warn(`Layer "${layerId}" not found, using last added layer: ${lastLayer.id}`);
    return lastLayer.id;
  }

  return layerId;
}

function executeAddKeyframe(op: AddKeyframeTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  const layer = projectStore.project.layers.find((l) => l.id === resolvedLayerId);

  if (!layer) {
    console.warn(`Layer not found for keyframe: ${op.layerId} (resolved: ${resolvedLayerId})`);
    return;
  }

  const easing: Easing = op.keyframe.easing
    ? {
        type: op.keyframe.easing.type as Easing['type'],
        bezier: op.keyframe.easing.bezier
      }
    : { type: 'ease-in-out' };

  // Clamp time to project duration
  const time = Math.max(0, Math.min(op.keyframe.time, projectStore.project.duration));

  projectStore.addKeyframe(resolvedLayerId, {
    id: nanoid(),
    time,
    property: op.keyframe.property as AnimatableProperty,
    value: op.keyframe.value,
    easing
  });
}

function executeEditKeyframe(op: EditKeyframeTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  const layer = projectStore.project.layers.find((l) => l.id === resolvedLayerId);

  if (!layer) {
    console.warn(`Layer not found: ${op.layerId}`);
    return;
  }

  const keyframe = layer.keyframes.find((k) => k.id === op.keyframeId);
  if (!keyframe) {
    console.warn(`Keyframe not found: ${op.keyframeId}`);
    return;
  }

  const updates: Record<string, unknown> = {};

  if (op.updates.time !== undefined) {
    updates.time = Math.max(0, Math.min(op.updates.time, projectStore.project.duration));
  }
  if (op.updates.value !== undefined) {
    updates.value = op.updates.value;
  }
  if (op.updates.easing) {
    updates.easing = {
      type: op.updates.easing.type,
      bezier: op.updates.easing.bezier
    };
  }

  projectStore.updateKeyframe(resolvedLayerId, op.keyframeId, updates);
}

function executeRemoveKeyframe(op: RemoveKeyframeTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  projectStore.removeKeyframe(resolvedLayerId, op.keyframeId);
}

/**
 * Apply an animation preset to a layer
 * Preset keyframes are normalized (0-1) and scaled to the specified duration
 */
function executeApplyPreset(op: ApplyPresetTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  const layer = projectStore.project.layers.find((l) => l.id === resolvedLayerId);

  if (!layer) {
    console.warn(`Layer not found for preset: ${op.layerId} (resolved: ${resolvedLayerId})`);
    return;
  }

  const preset = getPresetById(op.presetId);
  if (!preset) {
    console.warn(`Preset not found: ${op.presetId}`);
    return;
  }

  const startTime = op.startTime ?? 0;
  const duration = op.duration ?? 1;

  // Apply each keyframe from the preset, scaling time
  for (const kf of preset.keyframes) {
    const scaledTime = startTime + kf.time * duration;

    // Clamp to project duration
    const clampedTime = Math.max(0, Math.min(scaledTime, projectStore.project.duration));

    // Get the base position from the layer's transform if it's a position property
    let value = kf.value;
    if (kf.property === 'position.x' && typeof kf.value === 'number') {
      value = layer.transform.x + kf.value;
    } else if (kf.property === 'position.y' && typeof kf.value === 'number') {
      value = layer.transform.y + kf.value;
    }

    projectStore.addKeyframe(resolvedLayerId, {
      id: nanoid(),
      time: clampedTime,
      property: kf.property as AnimatableProperty,
      value,
      easing: kf.easing
    });
  }
}

/**
 * Add multiple keyframes at once
 */
function executeBatchKeyframes(op: BatchKeyframesTool) {
  const resolvedLayerId = resolveLayerId(op.layerId, newLayerIds);
  const layer = projectStore.project.layers.find((l) => l.id === resolvedLayerId);

  if (!layer) {
    console.warn(
      `Layer not found for batch keyframes: ${op.layerId} (resolved: ${resolvedLayerId})`
    );
    return;
  }

  for (const kf of op.keyframes) {
    const easing: Easing = kf.easing
      ? {
          type: kf.easing.type as Easing['type'],
          bezier: kf.easing.bezier
        }
      : { type: 'ease-in-out' };

    // Clamp time to project duration
    const time = Math.max(0, Math.min(kf.time, projectStore.project.duration));

    projectStore.addKeyframe(resolvedLayerId, {
      id: nanoid(),
      time,
      property: kf.property as AnimatableProperty,
      value: kf.value,
      easing
    });
  }
}

/**
 * Create a complete scene with multiple layers and coordinated animations
 */
function executeCreateScene(op: CreateSceneTool) {
  const sceneStartIndex = newLayerIds.size;

  for (let i = 0; i < op.layers.length; i++) {
    const layerDef = op.layers[i];

    // Create the layer
    const layer = createLayer(
      layerDef.type as LayerType,
      layerDef.props || {},
      layerDef.position || { x: 0, y: 0 }
    );

    if (layerDef.name) {
      layer.name = layerDef.name;
    }

    // Track layer ID
    const layerIndex = sceneStartIndex + i;
    newLayerIds.set(layerIndex, layer.id);

    projectStore.addLayer(layer);

    // Apply animation if specified
    if (layerDef.animation) {
      const animDelay = layerDef.animation.delay || 0;
      const animDuration = layerDef.animation.duration || 0.5;
      const animStartTime = op.startTime + animDelay;

      if (layerDef.animation.preset) {
        // Apply preset animation
        const preset = getPresetById(layerDef.animation.preset);
        if (preset) {
          for (const kf of preset.keyframes) {
            const scaledTime = animStartTime + kf.time * animDuration;
            const clampedTime = Math.max(0, Math.min(scaledTime, projectStore.project.duration));

            let value = kf.value;
            if (kf.property === 'position.x' && typeof kf.value === 'number') {
              value = layer.transform.x + kf.value;
            } else if (kf.property === 'position.y' && typeof kf.value === 'number') {
              value = layer.transform.y + kf.value;
            }

            projectStore.addKeyframe(layer.id, {
              id: nanoid(),
              time: clampedTime,
              property: kf.property as AnimatableProperty,
              value,
              easing: kf.easing
            });
          }
        }
      }

      if (layerDef.animation.customKeyframes) {
        // Apply custom keyframes
        for (const kf of layerDef.animation.customKeyframes) {
          const scaledTime = animStartTime + kf.time * animDuration;
          const clampedTime = Math.max(0, Math.min(scaledTime, projectStore.project.duration));

          const easing: Easing = kf.easing
            ? { type: kf.easing.type as Easing['type'], bezier: kf.easing.bezier }
            : { type: 'ease-in-out' };

          projectStore.addKeyframe(layer.id, {
            id: nanoid(),
            time: clampedTime,
            property: kf.property as AnimatableProperty,
            value: kf.value,
            easing
          });
        }
      }
    }
  }
}

/**
 * Update project settings
 */
function executeSetProject(op: SetProjectSettingsTool) {
  if (op.settings.name !== undefined) {
    projectStore.project.name = op.settings.name;
  }
  if (op.settings.width !== undefined) {
    projectStore.project.width = op.settings.width;
  }
  if (op.settings.height !== undefined) {
    projectStore.project.height = op.settings.height;
  }
  if (
    op.settings.duration !== undefined &&
    op.settings.duration !== projectStore.project.duration
  ) {
    projectStore.project.duration = op.settings.duration;
  }
  if (op.settings.backgroundColor !== undefined) {
    projectStore.project.backgroundColor = op.settings.backgroundColor;
  }
}

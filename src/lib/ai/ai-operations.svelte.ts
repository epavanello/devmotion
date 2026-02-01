/**
 * AI Tool Executor - Client-side execution of AI tool calls
 *
 * Handles progressive tool execution with layer ID tracking across tool calls.
 */
import { projectStore } from '$lib/stores/project.svelte';
import { createLayer } from '$lib/engine/layer-factory';
import { nanoid } from 'nanoid';
import type { LayerType, Easing, AnimatableProperty } from '$lib/types/animation';
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
import { SvelteMap } from 'svelte/reactivity';

// ============================================
// Layer ID Tracking
// ============================================

// Track layer IDs created during this conversation
// Maps index (layer_0 = 0, layer_1 = 1) to actual layer ID
const layerIdMap = new SvelteMap<number, string>();
let layerCreationIndex = 0;

/**
 * Reset layer tracking for new conversation turn
 */
export function resetLayerTracking() {
  layerIdMap.clear();
  layerCreationIndex = 0;
}

/**
 * Resolve a layer reference to actual layer ID
 * Supports:
 * - "layer_0", "layer_1", etc. for newly created layers
 * - Actual layer IDs from project state
 * - Layer names as fallback
 */
function resolveLayerId(ref: string): string | null {
  // Check for "layer_N" pattern
  const layerMatch = ref.match(/^layer_(\d+)$/);
  if (layerMatch) {
    const index = parseInt(layerMatch[1], 10);
    const resolvedId = layerIdMap.get(index);
    if (resolvedId) {
      return resolvedId;
    }
  }

  // Check if it's an actual layer ID
  const existingLayer = projectStore.project.layers.find((l) => l.id === ref);
  if (existingLayer) {
    return ref;
  }

  // Check by name (case-insensitive)
  const layerByName = projectStore.project.layers.find(
    (l) => l.name.toLowerCase() === ref.toLowerCase()
  );
  if (layerByName) {
    return layerByName.id;
  }

  return null;
}

// ============================================
// Tool Executors
// ============================================

/**
 * Execute create_layer tool
 */
export function executeCreateLayer(input: CreateLayerInput): CreateLayerOutput {
  try {
    const layer = createLayer(
      input.type as LayerType,
      input.props || {},
      input.position || { x: 0, y: 0 }
    );

    if (input.name) {
      layer.name = input.name;
    }

    projectStore.addLayer(layer);

    // Track layer ID for future references
    const index = layerCreationIndex++;
    layerIdMap.set(index, layer.id);

    // Apply animation if specified
    if (input.animation?.preset) {
      projectStore.applyPreset(
        layer.id,
        input.animation.preset,
        input.animation.startTime ?? 0,
        input.animation.duration ?? 0.5
      );
    }

    // Select the new layer
    projectStore.selectedLayerId = layer.id;

    return {
      success: true,
      layerId: layer.id,
      layerIndex: index,
      layerName: layer.name,
      message: `Created ${input.type} layer "${layer.name}" at (${layer.transform.x}, ${layer.transform.y})`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to create layer',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Execute animate_layer tool
 */
export function executeAnimateLayer(input: AnimateLayerInput): AnimateLayerOutput {
  const resolvedId = resolveLayerId(input.layerId);
  if (!resolvedId) {
    return {
      success: false,
      message: `Layer not found: ${input.layerId}`,
      error: 'Use layer_0, layer_1, etc. for recently created layers, or an existing layer ID/name.'
    };
  }

  const layer = projectStore.project.layers.find((l) => l.id === resolvedId);
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
      projectStore.applyPreset(
        resolvedId,
        input.preset.id,
        input.preset.startTime ?? 0,
        input.preset.duration ?? 0.5
      );
      keyframesAdded += 4; // Approximate count from presets
    }

    // Add custom keyframes
    if (input.keyframes) {
      for (const kf of input.keyframes) {
        const easing: Easing = kf.easing
          ? { type: kf.easing.type as Easing['type'], bezier: kf.easing.bezier }
          : { type: 'ease-in-out' };

        const clampedTime = Math.max(0, Math.min(kf.time, projectStore.project.duration));

        projectStore.addKeyframe(resolvedId, {
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

/**
 * Execute edit_layer tool
 */
export function executeEditLayer(input: EditLayerInput): EditLayerOutput {
  const resolvedId = resolveLayerId(input.layerId);
  if (!resolvedId) {
    return {
      success: false,
      message: `Layer not found: ${input.layerId}`,
      error: 'Invalid layer reference'
    };
  }

  const layer = projectStore.project.layers.find((l) => l.id === resolvedId);
  if (!layer) {
    return {
      success: false,
      message: 'Layer was removed',
      error: 'The layer no longer exists'
    };
  }

  try {
    const updates: Record<string, unknown> = {};

    if (input.updates.name !== undefined) {
      updates.name = input.updates.name;
    }

    if (input.updates.visible !== undefined) {
      updates.visible = input.updates.visible;
    }

    if (input.updates.locked !== undefined) {
      updates.locked = input.updates.locked;
    }

    if (input.updates.position) {
      updates.transform = {
        ...layer.transform,
        x: input.updates.position.x ?? layer.transform.x,
        y: input.updates.position.y ?? layer.transform.y
      };
    }

    if (input.updates.scale) {
      updates.transform = {
        ...(updates.transform || layer.transform),
        scaleX: input.updates.scale.x ?? layer.transform.scaleX,
        scaleY: input.updates.scale.y ?? layer.transform.scaleY
      };
    }

    if (input.updates.rotation !== undefined) {
      // Convert degrees to radians
      const radians = (input.updates.rotation * Math.PI) / 180;
      updates.transform = {
        ...(updates.transform || layer.transform),
        rotationZ: radians
      };
    }

    if (input.updates.opacity !== undefined) {
      updates.style = {
        ...layer.style,
        opacity: input.updates.opacity
      };
    }

    if (input.updates.props) {
      updates.props = {
        ...layer.props,
        ...input.updates.props
      };
    }

    projectStore.updateLayer(resolvedId, updates);

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

/**
 * Execute remove_layer tool
 */
export function executeRemoveLayer(input: RemoveLayerInput): RemoveLayerOutput {
  const resolvedId = resolveLayerId(input.layerId);
  if (!resolvedId) {
    return {
      success: false,
      message: `Layer not found: ${input.layerId}`,
      error: 'Invalid layer reference'
    };
  }

  const layer = projectStore.project.layers.find((l) => l.id === resolvedId);
  const name = layer?.name || input.layerId;

  try {
    projectStore.removeLayer(resolvedId);

    return {
      success: true,
      message: `Removed layer "${name}"`
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to remove layer',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Execute configure_project tool
 */
export function executeConfigureProject(input: ConfigureProjectInput): ConfigureProjectOutput {
  try {
    const changes: string[] = [];

    if (input.name !== undefined) {
      projectStore.project.name = input.name;
      changes.push(`name="${input.name}"`);
    }

    if (input.width !== undefined) {
      projectStore.project.width = input.width;
      changes.push(`width=${input.width}`);
    }

    if (input.height !== undefined) {
      projectStore.project.height = input.height;
      changes.push(`height=${input.height}`);
    }

    if (input.duration !== undefined) {
      projectStore.project.duration = input.duration;
      changes.push(`duration=${input.duration}s`);
    }

    if (input.backgroundColor !== undefined) {
      projectStore.project.backgroundColor = input.backgroundColor;
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

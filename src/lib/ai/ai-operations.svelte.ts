/**
 * AI Tool Executor - Client-side execution of AI tool calls
 *
 * Handles progressive tool execution with layer ID tracking across tool calls.
 * Refactored to use shared 'mutations.ts' logic.
 */
import type { ProjectStore } from '$lib/stores/project.svelte';
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
  UngroupLayersOutput
} from './schemas';
import { SvelteMap } from 'svelte/reactivity';
import {
  mutateCreateLayer,
  mutateAnimateLayer,
  mutateEditLayer,
  mutateRemoveLayer,
  mutateConfigureProject,
  mutateGroupLayers,
  mutateUngroupLayers,
  type MutationContext
} from './mutations';

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

// ============================================
// Context Helper
// ============================================

function getContext(projectStore: ProjectStore): MutationContext {
  return {
    project: projectStore.state,
    layerIdMap: layerIdMap,
    layerCreationIndex: layerCreationIndex
  };
}

// ============================================
// Tool Executors
// ============================================

/**
 * Execute create_layer tool
 */
export function executeCreateLayer(
  projectStore: ProjectStore,
  input: CreateLayerInput
): CreateLayerOutput {
  const ctx = getContext(projectStore);
  const result = mutateCreateLayer(ctx, input);

  // Update local index tracker
  if (result.nextLayerCreationIndex !== undefined) {
    layerCreationIndex = result.nextLayerCreationIndex;
  }

  if (result.output.success && result.output.layerId) {
    projectStore.selectedLayerId = result.output.layerId;

    // Trigger reactivity update if needed (Svelte 5 runes usually handle deep obj mutation if proxied,
    // but array push might need trigger dependin on implementation.
    // projectStore.project is a Rune, so mutations should be fine.)
  }

  return result.output;
}

/**
 * Execute animate_layer tool
 */
export function executeAnimateLayer(
  projectStore: ProjectStore,
  input: AnimateLayerInput
): AnimateLayerOutput {
  return mutateAnimateLayer(getContext(projectStore), input);
}

/**
 * Execute edit_layer tool
 */
export function executeEditLayer(
  projectStore: ProjectStore,
  input: EditLayerInput
): EditLayerOutput {
  return mutateEditLayer(getContext(projectStore), input);
}

/**
 * Execute remove_layer tool
 */
export function executeRemoveLayer(
  projectStore: ProjectStore,
  input: RemoveLayerInput
): RemoveLayerOutput {
  const result = mutateRemoveLayer(getContext(projectStore), input);
  if (result.success) {
    if (
      projectStore.selectedLayerId &&
      getContext(projectStore).project.layers.find((l) => l.id === projectStore.selectedLayerId) ===
        undefined
    ) {
      projectStore.selectedLayerId = null;
    }
  }
  return result;
}

/**
 * Execute configure_project tool
 */
export function executeConfigureProject(
  projectStore: ProjectStore,
  input: ConfigureProjectInput
): ConfigureProjectOutput {
  return mutateConfigureProject(getContext(projectStore), input);
}

/**
 * Execute group_layers tool
 */
export function executeGroupLayers(
  projectStore: ProjectStore,
  input: GroupLayersInput
): GroupLayersOutput {
  const result = mutateGroupLayers(getContext(projectStore), input);
  if (result.success && result.groupId) {
    projectStore.selectedLayerId = result.groupId;
  }
  return result;
}

/**
 * Execute ungroup_layers tool
 */
export function executeUngroupLayers(
  projectStore: ProjectStore,
  input: UngroupLayersInput
): UngroupLayersOutput {
  const result = mutateUngroupLayers(getContext(projectStore), input);
  if (result.success) {
    projectStore.selectedLayerId = null;
  }
  return result;
}

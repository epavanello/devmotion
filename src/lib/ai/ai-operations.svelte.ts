/**
 * AI Tool Executor - Client-side execution of AI tool calls
 *
 * Handles progressive tool execution with layer ID tracking across tool calls.
 * Refactored to use shared 'mutations.ts' logic.
 */
import { projectStore } from '$lib/stores/project.svelte';
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
import {
  mutateCreateLayer,
  mutateAnimateLayer,
  mutateEditLayer,
  mutateRemoveLayer,
  mutateConfigureProject,
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

function getContext(): MutationContext {
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
export function executeCreateLayer(input: CreateLayerInput): CreateLayerOutput {
  const ctx = getContext();
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
export function executeAnimateLayer(input: AnimateLayerInput): AnimateLayerOutput {
  return mutateAnimateLayer(getContext(), input);
}

/**
 * Execute edit_layer tool
 */
export function executeEditLayer(input: EditLayerInput): EditLayerOutput {
  return mutateEditLayer(getContext(), input);
}

/**
 * Execute remove_layer tool
 */
export function executeRemoveLayer(input: RemoveLayerInput): RemoveLayerOutput {
  const result = mutateRemoveLayer(getContext(), input);
  if (result.success) {
    if (
      projectStore.selectedLayerId &&
      getContext().project.layers.find((l) => l.id === projectStore.selectedLayerId) === undefined
    ) {
      projectStore.selectedLayerId = null;
    }
  }
  return result;
}

/**
 * Execute configure_project tool
 */
export function executeConfigureProject(input: ConfigureProjectInput): ConfigureProjectOutput {
  return mutateConfigureProject(getContext(), input);
}

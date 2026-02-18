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
  UngroupLayersOutput,
  UpdateKeyframeInput,
  UpdateKeyframeOutput,
  RemoveKeyframeInput,
  RemoveKeyframeOutput
} from './schemas';
import {
  mutateCreateLayer,
  mutateAnimateLayer,
  mutateEditLayer,
  mutateRemoveLayer,
  mutateConfigureProject,
  mutateGroupLayers,
  mutateUngroupLayers,
  mutateUpdateKeyframe,
  mutateRemoveKeyframe,
  type MutationContext
} from './mutations';

// ============================================
// Layer ID Tracking
// ============================================

// ============================================
// Context Helper
// ============================================

function getContext(projectStore: ProjectStore): MutationContext {
  return {
    project: projectStore.state
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

  if (result.output.success && result.output.layerId) {
    projectStore.selectedLayerId = result.output.layerId;
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

/**
 * Execute update_keyframe tool
 */
export function executeUpdateKeyframe(
  projectStore: ProjectStore,
  input: UpdateKeyframeInput
): UpdateKeyframeOutput {
  return mutateUpdateKeyframe(getContext(projectStore), input);
}

/**
 * Execute remove_keyframe tool
 */
export function executeRemoveKeyframe(
  projectStore: ProjectStore,
  input: RemoveKeyframeInput
): RemoveKeyframeOutput {
  return mutateRemoveKeyframe(getContext(projectStore), input);
}

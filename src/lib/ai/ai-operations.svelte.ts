/**
 * AI Tool Executor - Client-side execution of AI tool calls
 *
 * Client-side AI tool execution using shared mutations.ts logic.
 * Simplified: create_layer (comprehensive), edit_layer (patch), and utility tools only.
 */
import type { ProjectStore } from '$lib/stores/project.svelte';
import type {
  CreateLayerInput,
  CreateLayerOutput,
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
import {
  mutateCreateLayer,
  mutateEditLayer,
  mutateRemoveLayer,
  mutateConfigureProject,
  mutateGroupLayers,
  mutateUngroupLayers,
  type MutationContext
} from './mutations';

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
 * Execute create_layer tool - comprehensive layer creation
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
 * Execute edit_layer tool - patch-style layer modification
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
  const ctx = getContext(projectStore);
  const result = mutateRemoveLayer(ctx, input);
  if (result.success) {
    if (
      projectStore.selectedLayerId &&
      ctx.project.layers.find((l) => l.id === projectStore.selectedLayerId) === undefined
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

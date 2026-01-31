<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Sparkles, ChevronDown } from 'lucide-svelte';
  import { generateAnimation } from '$lib/functions/ai.remote';
  import { createLayer } from '$lib/engine/layer-factory';
  import { getPresetById } from '$lib/engine/presets';
  import { nanoid } from 'nanoid';
  import type {
    AIToolCall,
    AIResponse,
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
  import { AI_MODELS, DEFAULT_MODEL_ID } from '$lib/ai/models';

  interface Props {
    onMessage?: (message: string, type: 'success' | 'error') => void;
  }

  let { onMessage }: Props = $props();

  let prompt = $state('');
  let isGenerating = $state(false);
  let selectedModelId = $state(DEFAULT_MODEL_ID);
  let showModelSelector = $state(false);

  const models = Object.values(AI_MODELS);
  const selectedModel = $derived(AI_MODELS[selectedModelId] || AI_MODELS[DEFAULT_MODEL_ID]);

  // Track newly created layer IDs for keyframe resolution
  // Maps index (layer_0 = 0, layer_1 = 1) to actual layer ID
  let newLayerIds: Map<number, string> = new SvelteMap();

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    isGenerating = true;
    const userPrompt = prompt;
    prompt = '';
    newLayerIds.clear();

    try {
      const result = await generateAnimation({
        prompt: userPrompt,
        project: projectStore.project,
        modelId: selectedModelId
      });

      if (!result.success) {
        onMessage?.(result.error, 'error');
        return;
      }

      const response = result.data as AIResponse;

      // Execute operations
      executeOperations(response.operations);

      // Show success message
      onMessage?.(response.message, 'success');
    } catch (error) {
      onMessage?.(error instanceof Error ? error.message : 'Generation failed', 'error');
    } finally {
      isGenerating = false;
    }
  }

  function executeOperations(operations: AIToolCall[]) {
    let addLayerIndex = 0;

    for (const op of operations) {
      try {
        switch (op.action) {
          case 'add_layer':
            executeAddLayer(op, addLayerIndex++);
            break;
          case 'edit_layer':
            executeEditLayer(op);
            break;
          case 'remove_layer':
            executeRemoveLayer(op);
            break;
          case 'add_keyframe':
            executeAddKeyframe(op);
            break;
          case 'edit_keyframe':
            executeEditKeyframe(op);
            break;
          case 'remove_keyframe':
            executeRemoveKeyframe(op);
            break;
          case 'apply_preset':
            executeApplyPreset(op);
            break;
          case 'batch_keyframes':
            executeBatchKeyframes(op);
            break;
          case 'create_scene':
            executeCreateScene(op);
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
    const resolvedLayerId = resolveLayerId(op.layerId);
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
    const resolvedLayerId = resolveLayerId(op.layerId);
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
    const resolvedLayerId = resolveLayerId(op.layerId);
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
    const resolvedLayerId = resolveLayerId(op.layerId);
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
    const resolvedLayerId = resolveLayerId(op.layerId);
    projectStore.removeKeyframe(resolvedLayerId, op.keyframeId);
  }

  /**
   * Apply an animation preset to a layer
   * Preset keyframes are normalized (0-1) and scaled to the specified duration
   */
  function executeApplyPreset(op: ApplyPresetTool) {
    const resolvedLayerId = resolveLayerId(op.layerId);
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
    const resolvedLayerId = resolveLayerId(op.layerId);
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
    if (op.settings.backgroundColor) {
      projectStore.project.backgroundColor = op.settings.backgroundColor;
    }
    if (op.settings.duration && op.settings.duration !== projectStore.project.duration) {
      projectStore.project.duration = op.settings.duration;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }
</script>

<div class="border-t bg-background p-4">
  <div class="mb-2 flex items-center justify-between">
    <label for="ai-prompt" class="flex items-center gap-2 text-xs font-medium">
      <Sparkles class="h-3 w-3" />
      AI Animation Generator
    </label>

    <!-- Model selector -->
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
        onclick={() => (showModelSelector = !showModelSelector)}
      >
        <span class="max-w-24 truncate">{selectedModel.name}</span>
        <ChevronDown class="h-3 w-3" />
      </button>

      {#if showModelSelector}
        <div
          class="absolute top-full right-0 z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-lg"
        >
          {#each models as model (model.id)}
            <button
              type="button"
              class="flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
              class:bg-accent={model.id === selectedModelId}
              onclick={() => {
                selectedModelId = model.id;
                showModelSelector = false;
              }}
            >
              <div class="flex items-center gap-1">
                <span class="font-medium">{model.name}</span>
                {#if model.recommended}
                  <span class="rounded bg-primary/20 px-1 text-[10px] text-primary"
                    >recommended</span
                  >
                {/if}
              </div>
              <span class="text-muted-foreground">{model.description}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <textarea
    id="ai-prompt"
    bind:value={prompt}
    onkeydown={handleKeyDown}
    placeholder="Describe your video animation in detail... e.g., 'Create a 5-second promo video for CloudSync app with animated title, features, and CTA button'"
    disabled={isGenerating || projectStore.isRecording}
    class="mb-3 flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
  ></textarea>

  <Button
    class="w-full"
    onclick={handleGenerate}
    disabled={!prompt.trim() || isGenerating || projectStore.isRecording}
  >
    {#if isGenerating}
      Generating with {selectedModel.name}...
    {:else}
      Generate
    {/if}
  </Button>
</div>

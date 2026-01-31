<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Sparkles, ChevronDown } from 'lucide-svelte';
  import { generateAnimation } from '$lib/functions/ai.remote';
  import { executeOperations } from '$lib/ai/ai-operations.svelte';
  import type { AIResponse } from '$lib/ai/schemas';
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

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    isGenerating = true;
    const userPrompt = prompt;
    prompt = '';

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

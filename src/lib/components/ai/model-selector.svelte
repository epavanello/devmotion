<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import { AI_MODELS } from '$lib/ai/models';

  interface Props {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
  }

  let { selectedModelId, onModelChange }: Props = $props();

  let showModelSelector = $state(false);

  const models = Object.values(AI_MODELS);
  const selectedModel = $derived(AI_MODELS[selectedModelId]);
</script>

<div class="relative">
  <button
    type="button"
    class="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted"
    onclick={() => (showModelSelector = !showModelSelector)}
  >
    {selectedModel.name}
    <ChevronDown class="h-3 w-3" />
  </button>

  {#if showModelSelector}
    <div class="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
      {#each models as model (model.id)}
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
          class:bg-muted={model.id === selectedModelId}
          onclick={() => {
            onModelChange(model.id);
            showModelSelector = false;
          }}
        >
          <span>{model.name}</span>
          {#if model.recommended}
            <span class="text-[10px] text-primary">Recommended</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

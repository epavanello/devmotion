<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import { AI_MODELS } from '$lib/ai/models';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

  interface Props {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
  }

  let { selectedModelId, onModelChange }: Props = $props();

  const models = Object.values(AI_MODELS);
  const selectedModel = $derived(AI_MODELS[selectedModelId]);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="flex items-center gap-1 text-xs">
    {selectedModel.name}
    <ChevronDown class="h-3 w-3" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start">
    {#each models as model (model.id)}
      <DropdownMenu.Item onclick={() => onModelChange(model.id)}>
        <span>{model.name}</span>
        {#if model.recommended}
          <span class="text-[10px] text-primary">Recommended</span>
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>

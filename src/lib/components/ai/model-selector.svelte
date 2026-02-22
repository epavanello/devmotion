<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import { AI_MODELS, getModel } from '$lib/ai/models';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { getUser } from '$lib/functions/auth.remote';

  interface Props {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
  }

  let { selectedModelId, onModelChange }: Props = $props();

  const models = Object.values(AI_MODELS);
  const selectedModel = $derived(getModel(selectedModelId));
  const user = $derived(getUser());
  const isPro = $derived(user.current?.plan === 'pro');
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="flex items-center gap-1 text-xs">
    {selectedModel.name}
    <ChevronDown class="h-3 w-3" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start">
    {#each models as model (model.id)}
      <DropdownMenu.Item onclick={() => onModelChange(model.id)}>
        <span class="flex items-center gap-1.5">
          {model.name}
        </span>
        {#if model.recommended}
          <span class="text-[10px] text-primary">Recommended</span>
        {/if}
        {#if 'proOnly' in model && model.proOnly}
          <span class="text-[10px] text-muted-foreground">Pro</span>
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>

<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Plus } from '@lucide/svelte';
  import { layerRegistry } from '$lib/layers/registry';
  import type { LayerType } from '$lib/types/animation';
  import { createLayer } from '$lib/engine/layer-factory';

  function addLayer(type: string) {
    const layer = createLayer(type as LayerType, {}, { x: 0, y: 0 });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger disabled={projectStore.isRecording}>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" {...props}>
        <Plus />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="max-h-80 overflow-y-auto">
    {#each Object.values(layerRegistry) as layer (layer.type)}
      <DropdownMenu.Item onclick={() => addLayer(layer.type)}>
        {#if layer.icon}
          {@const Icon = layer.icon}
          <Icon class="mr-2 h-4 w-4" />
        {/if}
        {layer.label}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>

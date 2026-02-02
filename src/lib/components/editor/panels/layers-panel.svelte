<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Eye, EyeOff, Lock, Unlock, Trash2, Plus } from 'lucide-svelte';
  import type { Layer } from '$lib/types/animation';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { createLayer } from '$lib/engine/layer-factory';
  import { getLayerDefinition, layerRegistry } from '$lib/layers/registry';
  import { cn } from '$lib/utils';

  // Note: Coordinate system has (0, 0) at canvas center
  function addLayer(type: string) {
    const layer = createLayer(type as import('$lib/types/animation').LayerType, {}, { x: 0, y: 0 });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function selectLayer(layerId: string) {
    projectStore.selectedLayerId = layerId;
  }

  function toggleLayerVisibility(layer: Layer, e: Event) {
    e.stopPropagation();
    projectStore.updateLayer(layer.id, { visible: !layer.visible });
  }

  function toggleLayerLock(layer: Layer, e: Event) {
    e.stopPropagation();
    projectStore.updateLayer(layer.id, { locked: !layer.locked });
  }

  function deleteLayer(layer: Layer, e: Event) {
    e.stopPropagation();
    if (confirm(`Delete layer "${layer.name}"?`)) {
      projectStore.removeLayer(layer.id);
    }
  }

  function handleDragStart(e: DragEvent, index: number) {
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', index.toString());
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }

  function handleDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer!.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      projectStore.reorderLayers(dragIndex, dropIndex);
    }
  }

  function handleKeyDown(e: KeyboardEvent, layerId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectLayer(layerId);
    }
  }
</script>

<div
  class="flex h-full flex-col overflow-y-auto bg-background"
  class:pointer-events-none={projectStore.isRecording}
  class:opacity-50={projectStore.isRecording}
>
  <!-- Panel Header -->
  <div class="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
    <h2 class="text-sm font-semibold">Layers ({projectStore.project.layers.length})</h2>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={projectStore.isRecording}>
        <Button variant="outline" size="icon" disabled={projectStore.isRecording}>
          <Plus />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" class="max-h-80 overflow-y-auto">
        {#each Object.values(layerRegistry) as layer (layer.type)}
          <DropdownMenu.Item onclick={() => addLayer(layer.type)}>
            {#if layer.icon}
              <svelte:component this={layer.icon} class="mr-2 h-4 w-4" />
            {/if}
            {layer.label}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <!-- Layers List -->
  <ScrollArea class="flex-1">
    <div class="space-y-1 p-2">
      {#each projectStore.project.layers as layer, index (layer.id)}
        {@const Icon = getLayerDefinition(layer.type).icon}
        <div
          class="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted/50"
          class:bg-muted={projectStore.selectedLayerId === layer.id}
          onclick={() => selectLayer(layer.id)}
          onkeydown={(e) => handleKeyDown(e, layer.id)}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, index)}
          ondragover={handleDragOver}
          ondrop={(e) => handleDrop(e, index)}
          role="button"
          tabindex="0"
        >
          <!-- Layer Icon/Type -->
          <Icon class="size-4" />

          <!-- Layer Name -->
          <div
            class={cn('flex-1 truncate text-sm', {
              'opacity-30': !layer.visible
            })}
          >
            {layer.name}
          </div>

          <!-- Layer Controls -->
          <div
            class="flex max-w-0 items-center gap-1 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 [@media(hover:none)]:max-w-40 [@media(hover:none)]:opacity-100"
          >
            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={(e) => toggleLayerVisibility(layer, e)}
            >
              {#if layer.visible}
                <Eye class="size-3" />
              {:else}
                <EyeOff class="size-3" />
              {/if}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={(e) => toggleLayerLock(layer, e)}
            >
              {#if layer.locked}
                <Lock class="size-3" />
              {:else}
                <Unlock class="size-3" />
              {/if}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0 text-destructive"
              onclick={(e) => deleteLayer(layer, e)}
            >
              <Trash2 class="size-3" />
            </Button>
          </div>
        </div>
      {/each}

      {#if projectStore.project.layers.length === 0}
        <div class="py-8 text-center text-sm text-muted-foreground">
          <p>No layers yet</p>
          <p class="mt-1 text-xs">Add layers from the toolbar</p>
        </div>
      {/if}
    </div>
  </ScrollArea>
</div>

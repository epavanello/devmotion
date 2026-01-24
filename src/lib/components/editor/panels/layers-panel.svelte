<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-svelte';
  import type { Layer } from '$lib/types/animation';
  import * as Tooltip from '$lib/components/ui/tooltip';

  let prompt = '';

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
  <div class="border-b bg-muted/50 px-4 py-3">
    <h2 class="text-sm font-semibold">Layers</h2>
  </div>

  <!-- Layers List -->
  <ScrollArea class="flex-1">
    <div class="space-y-1 p-2">
      {#each projectStore.project.layers as layer, index (layer.id)}
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
          <div
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold"
          >
            {layer.name.charAt(0).toUpperCase()}
          </div>

          <!-- Layer Name -->
          <div class="flex-1 truncate text-sm">
            {layer.name}
          </div>

          <!-- Layer Controls -->
          <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={(e) => toggleLayerVisibility(layer, e)}
            >
              {#if layer.visible}
                <Eye class="h-3 w-3" />
              {:else}
                <EyeOff class="h-3 w-3" />
              {/if}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={(e) => toggleLayerLock(layer, e)}
            >
              {#if layer.locked}
                <Lock class="h-3 w-3" />
              {:else}
                <Unlock class="h-3 w-3" />
              {/if}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0 text-destructive"
              onclick={(e) => deleteLayer(layer, e)}
            >
              <Trash2 class="h-3 w-3" />
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

  <!-- Prompt Input Section -->
  <div class="border-b bg-background p-4">
    <label for="prompt" class="mb-2 block text-xs font-medium">Generate Animation</label>
    <textarea
      id="prompt"
      bind:value={prompt}
      placeholder="Describe the animation you want to generate..."
      class="mb-3 flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
    ></textarea>
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button class="w-full" {...props}>Generate</Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>AI generation is coming soon!</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
</div>

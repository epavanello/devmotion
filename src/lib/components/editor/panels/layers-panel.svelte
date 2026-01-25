<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    Plus,
    Type,
    Square,
    Terminal,
    MousePointer,
    Zap,
    Smartphone,
    Globe,
    Star,
    Minus,
    Tag,
    Loader,
    Code
  } from 'lucide-svelte';
  import type { Layer } from '$lib/types/animation';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { createLayer } from '$lib/engine/layer-factory';
  import AiChat from '$lib/components/ai/ai-chat.svelte';
  import { toast } from 'svelte-sonner';

  function handleAiMessage(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }

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
    <h2 class="text-sm font-semibold">Layers</h2>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={projectStore.isRecording}>
        <Button variant="outline" size="icon" disabled={projectStore.isRecording}>
          <Plus />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" class="max-h-80 overflow-y-auto">
        <DropdownMenu.Label>Basic</DropdownMenu.Label>
        <DropdownMenu.Item onclick={() => addLayer('text')}>
          <Type class="mr-2 h-4 w-4" />
          Text
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addLayer('shape')}>
          <Square class="mr-2 h-4 w-4" />
          Shape
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addLayer('icon')}>
          <Star class="mr-2 h-4 w-4" />
          Icon
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addLayer('button')}>
          <Zap class="mr-2 h-4 w-4" />
          Button
        </DropdownMenu.Item>

        <DropdownMenu.Separator />
        <DropdownMenu.Label>UI Elements</DropdownMenu.Label>
        <DropdownMenu.Item onclick={() => addLayer('progress')}>
          <Loader class="mr-2 h-4 w-4" />
          Progress
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addLayer('divider')}>
          <Minus class="mr-2 h-4 w-4" />
          Divider
        </DropdownMenu.Item>

        <DropdownMenu.Separator />
        <DropdownMenu.Label>Code & Terminal</DropdownMenu.Label>
        <DropdownMenu.Item onclick={() => addLayer('terminal')}>
          <Terminal class="mr-2 h-4 w-4" />
          Terminal
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addLayer('code')}>
          <Code class="mr-2 h-4 w-4" />
          Code Block
        </DropdownMenu.Item>

        <DropdownMenu.Separator />
        <DropdownMenu.Label>Mockups</DropdownMenu.Label>
        <DropdownMenu.Item onclick={() => addLayer('phone')}>
          <Smartphone class="mr-2 h-4 w-4" />
          Phone
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addLayer('browser')}>
          <Globe class="mr-2 h-4 w-4" />
          Browser
        </DropdownMenu.Item>

        <DropdownMenu.Separator />
        <DropdownMenu.Label>Interaction</DropdownMenu.Label>
        <DropdownMenu.Item onclick={() => addLayer('mouse')}>
          <MousePointer class="mr-2 h-4 w-4" />
          Mouse Cursor
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold"
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

  <!-- AI Generation Section -->
  <AiChat onMessage={handleAiMessage} />
</div>

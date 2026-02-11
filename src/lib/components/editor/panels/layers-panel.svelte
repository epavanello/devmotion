<script lang="ts">
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Eye, EyeOff, Lock, Unlock, Trash2 } from '@lucide/svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { getLayerDefinition } from '$lib/layers/registry';
  import { cn } from '$lib/utils';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  let deletePopoverOpenLayerId = $state<string | null>(null);

  function selectLayer(layerId: string) {
    projectStore.selectedLayerId = layerId;
  }

  function toggleLayerVisibility(layer: TypedLayer, e: Event) {
    e.stopPropagation();
    projectStore.updateLayer(layer.id, { visible: !layer.visible });
  }

  function toggleLayerLock(layer: TypedLayer, e: Event) {
    e.stopPropagation();
    projectStore.updateLayer(layer.id, { locked: !layer.locked });
  }

  function deleteLayer(layerId: string) {
    projectStore.removeLayer(layerId);
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
  class="space-y-1 p-2"
  class:pointer-events-none={projectStore.isRecording}
  class:opacity-50={projectStore.isRecording}
>
  {#each projectStore.state.layers as layer, index (layer.id)}
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
        class={cn(
          'flex max-w-0 items-center gap-1 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 [@media(hover:none)]:max-w-40 [@media(hover:none)]:opacity-100',
          {
            'max-w-40! opacity-100!': deletePopoverOpenLayerId === layer.id
          }
        )}
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

        <Popover.Root
          open={deletePopoverOpenLayerId === layer.id}
          onOpenChange={(open) => (deletePopoverOpenLayerId = open ? layer.id : null)}
        >
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button variant="ghost" size="sm" class="h-6 w-6 p-0 text-destructive" {...props}>
                <Trash2 class="size-3" />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-72" align="start" side="right">
            <div class="space-y-2">
              <h4 class="leading-none font-medium">Delete Layer</h4>
              <p class="text-sm text-muted-foreground">
                Delete "{layer.name}"? This cannot be undone.
              </p>
              <div class="flex justify-end gap-2 pt-2">
                <Popover.Close>
                  {#snippet child({ props })}
                    <Button variant="outline" size="sm" {...props}>Cancel</Button>
                  {/snippet}
                </Popover.Close>
                <Popover.Close>
                  {#snippet child({ props })}
                    <Button
                      variant="destructive"
                      size="sm"
                      {...props}
                      onclick={() => deleteLayer(layer.id)}
                    >
                      Delete
                    </Button>
                  {/snippet}
                </Popover.Close>
              </div>
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  {/each}

  {#if projectStore.state.layers.length === 0}
    <div class="py-8 text-center text-sm text-muted-foreground">
      <p>No layers yet</p>
      <p class="mt-1 text-xs">Add layers from the toolbar</p>
    </div>
  {/if}
</div>

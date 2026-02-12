<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    ChevronRight,
    ChevronDown,
    Ungroup
  } from '@lucide/svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { getLayerDefinition } from '$lib/layers/registry';
  import { cn } from '$lib/utils';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { SvelteSet } from 'svelte/reactivity';

  let deletePopoverOpenLayerId = $state<string | null>(null);
  const collapsedGroups = new SvelteSet<string>();
  let dropTargetId = $state<string | null>(null);

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

  function toggleGroupCollapse(groupId: string, e: Event) {
    e.stopPropagation();
    if (collapsedGroups.has(groupId)) {
      collapsedGroups.delete(groupId);
    } else {
      collapsedGroups.add(groupId);
    }
  }

  function handleUngroupSelected(e: Event) {
    e.stopPropagation();
    const selected = projectStore.selectedLayerId;
    if (selected && projectStore.isGroupLayer(selected)) {
      projectStore.ungroupLayers(selected);
    }
  }

  // Drag & drop
  function handleDragStart(e: DragEvent, layerId: string, index: number) {
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', index.toString());
    e.dataTransfer!.setData('application/layer-id', layerId);
  }

  function handleDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    const layerId = e.dataTransfer?.types.includes('application/layer-id') ? true : false;
    if (layerId) {
      e.dataTransfer!.dropEffect = 'move';
      dropTargetId = targetId;
    }
  }

  function handleDragLeave() {
    dropTargetId = null;
  }

  function handleDrop(e: DragEvent, dropIndex: number, targetLayerId: string) {
    e.preventDefault();
    dropTargetId = null;
    const dragLayerId = e.dataTransfer!.getData('application/layer-id');
    const dragIndex = parseInt(e.dataTransfer!.getData('text/plain'));

    if (!dragLayerId) return;

    // If dropping onto a group, add to that group
    const targetLayer = projectStore.project.layers.find((l) => l.id === targetLayerId);
    if (targetLayer?.type === 'group' && dragLayerId !== targetLayerId) {
      projectStore.addLayerToGroup(dragLayerId, targetLayerId);
      return;
    }

    // Otherwise, reorder
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

  /** Build a structured view: top-level layers with their children */
  const layerTree = $derived.by(() => {
    const topLevel: Array<{ layer: TypedLayer; children: TypedLayer[]; index: number }> = [];
    const layers = projectStore.project.layers;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer.parentId) {
        const children =
          layer.type === 'group' ? layers.filter((l) => l.parentId === layer.id) : [];
        topLevel.push({ layer, children, index: i });
      }
    }
    return topLevel;
  });

  /** Check if the selected layer is a group */
  const selectedIsGroup = $derived(
    projectStore.selectedLayerId ? projectStore.isGroupLayer(projectStore.selectedLayerId) : false
  );
</script>

<div
  class="space-y-1 p-2"
  class:pointer-events-none={projectStore.isRecording}
  class:opacity-50={projectStore.isRecording}
>
  <!-- Group / Ungroup toolbar -->
  <div class="mb-2 flex items-center gap-1 border-b pb-2">
    {#if selectedIsGroup}
      <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs" onclick={handleUngroupSelected}>
        <Ungroup class="size-3.5" />
        Ungroup
      </Button>
    {/if}
  </div>

  {#each layerTree as { layer, children, index } (layer.id)}
    {@const Icon = getLayerDefinition(layer.type).icon}
    {@const isGroup = layer.type === 'group'}
    {@const isCollapsed = collapsedGroups.has(layer.id)}
    {@const isDropTarget = dropTargetId === layer.id}

    <!-- Layer row -->
    <div
      class={cn(
        'group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
        {
          'bg-muted': projectStore.selectedLayerId === layer.id,
          'ring-2 ring-primary/40': isDropTarget && isGroup
        }
      )}
      onclick={() => selectLayer(layer.id)}
      onkeydown={(e) => handleKeyDown(e, layer.id)}
      draggable="true"
      ondragstart={(e) => handleDragStart(e, layer.id, index)}
      ondragover={(e) => handleDragOver(e, layer.id)}
      ondragleave={handleDragLeave}
      ondrop={(e) => handleDrop(e, index, layer.id)}
      role="button"
      tabindex="0"
    >
      <!-- Group expand/collapse -->
      {#if isGroup}
        <button
          class="flex size-4 items-center justify-center rounded hover:bg-muted-foreground/20"
          onclick={(e) => toggleGroupCollapse(layer.id, e)}
        >
          {#if isCollapsed}
            <ChevronRight class="size-3" />
          {:else}
            <ChevronDown class="size-3" />
          {/if}
        </button>
      {/if}

      <!-- Layer Icon -->
      <Icon class="size-4 shrink-0" />

      <!-- Layer Name -->
      <div
        class={cn('flex-1 truncate text-sm', {
          'opacity-30': !layer.visible
        })}
      >
        {layer.name}
        {#if isGroup}
          <span class="text-xs text-muted-foreground">({children.length})</span>
        {/if}
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
              <h4 class="leading-none font-medium">Delete {isGroup ? 'Group' : 'Layer'}</h4>
              <p class="text-sm text-muted-foreground">
                Delete "{layer.name}"{isGroup ? ' and all its children' : ''}? This cannot be
                undone.
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

    <!-- Group children (indented) -->
    {#if isGroup && !isCollapsed}
      {#each children as child (child.id)}
        {@const ChildIcon = getLayerDefinition(child.type).icon}
        {@const childIndex = projectStore.project.layers.indexOf(child)}

        <div
          class={cn(
            'group ml-6 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
            {
              'bg-muted': projectStore.selectedLayerId === child.id
            }
          )}
          onclick={() => selectLayer(child.id)}
          onkeydown={(e) => handleKeyDown(e, child.id)}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, child.id, childIndex)}
          ondragover={(e) => handleDragOver(e, child.id)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(e, childIndex, child.id)}
          role="button"
          tabindex="0"
        >
          <ChildIcon class="size-4 shrink-0" />

          <div
            class={cn('flex-1 truncate text-sm', {
              'opacity-30': !child.visible
            })}
          >
            {child.name}
          </div>

          <!-- Child Controls -->
          <div
            class={cn(
              'flex max-w-0 items-center gap-1 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 [@media(hover:none)]:max-w-40 [@media(hover:none)]:opacity-100',
              {
                'max-w-40! opacity-100!': deletePopoverOpenLayerId === child.id
              }
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={(e) => toggleLayerVisibility(child, e)}
            >
              {#if child.visible}
                <Eye class="size-3" />
              {:else}
                <EyeOff class="size-3" />
              {/if}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              onclick={(e) => toggleLayerLock(child, e)}
            >
              {#if child.locked}
                <Lock class="size-3" />
              {:else}
                <Unlock class="size-3" />
              {/if}
            </Button>

            <Popover.Root
              open={deletePopoverOpenLayerId === child.id}
              onOpenChange={(open) => (deletePopoverOpenLayerId = open ? child.id : null)}
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
                  <h4 class="leading-none font-medium">Remove from Group</h4>
                  <p class="text-sm text-muted-foreground">
                    Remove "{child.name}" from group, or delete it entirely?
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
                          variant="secondary"
                          size="sm"
                          {...props}
                          onclick={() => projectStore.removeLayerFromGroup(child.id)}
                        >
                          Unparent
                        </Button>
                      {/snippet}
                    </Popover.Close>
                    <Popover.Close>
                      {#snippet child({ props })}
                        <Button
                          variant="destructive"
                          size="sm"
                          {...props}
                          onclick={() => deleteLayer(child.id)}
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
    {/if}
  {/each}

  {#if projectStore.project.layers.length === 0}
    <div class="py-8 text-center text-sm text-muted-foreground">
      <p>No layers yet</p>
      <p class="mt-1 text-xs">Add layers from the toolbar</p>
    </div>
  {/if}
</div>

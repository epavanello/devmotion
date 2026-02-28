<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import {
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    GripVertical
  } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import TimelinePropertyTrack from './timeline-property-track.svelte';
  import { onDestroy } from 'svelte';
  import { cn } from '$lib/utils';
  import { getLayerDefinition } from '$lib/layers/registry';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    layer: TypedLayer;
    pixelsPerSecond: number;
    indent?: number;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    layerIndex: number;
    onDragStart?: (e: DragEvent, layerId: string, index: number) => void;
    onDragOver?: (e: DragEvent, targetId: string, element: HTMLElement) => void;
    onDragLeave?: () => void;
    onDrop?: (e: DragEvent, dropIndex: number, targetLayerId: string) => void;
    onDragEnd?: () => void;
    isDropTarget?: boolean;
    dropPosition?: 'above' | 'below' | 'inside' | null;
    isDragging?: boolean;
    isChild?: boolean;
  }

  let {
    layer,
    pixelsPerSecond,
    indent = 0,
    isExpanded,
    onToggleExpanded,
    layerIndex,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    isDropTarget = false,
    dropPosition = null,
    isDragging = false,
    isChild = false
  }: Props = $props();

  const isSelected = $derived(projectStore.selectedLayerId === layer.id);
  let deleteDialogOpen = $state(false);
  let layerHeaderRef = $state<HTMLDivElement>();

  // Create custom drag ghost image from layer header
  function createDragGhost(e: DragEvent) {
    if (!layerHeaderRef) return;

    // Clone the header element
    const ghost = layerHeaderRef.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${layerHeaderRef.offsetWidth}px`;
    ghost.style.opacity = '0.8';
    ghost.style.pointerEvents = 'none';
    document.body.appendChild(ghost);

    // Set as drag image
    e.dataTransfer?.setDragImage(
      ghost,
      layerHeaderRef.offsetWidth / 2,
      layerHeaderRef.offsetHeight / 2
    );

    // Clean up after drag starts
    setTimeout(() => {
      document.body.removeChild(ghost);
    }, 0);
  }

  function handleDragStart(e: DragEvent) {
    createDragGhost(e);
    onDragStart?.(e, layer.id, layerIndex);
  }

  function handleDragOver(e: DragEvent) {
    if (!layerHeaderRef) return;
    onDragOver?.(e, layer.id, layerHeaderRef);
  }

  function toggleVisibility(e: Event) {
    e.stopPropagation();
    projectStore.updateLayer(layer.id, { visible: !layer.visible });
  }

  function toggleLock(e: Event) {
    e.stopPropagation();
    projectStore.updateLayer(layer.id, { locked: !layer.locked });
  }

  function deleteLayer() {
    projectStore.removeLayer(layer.id);
    deleteDialogOpen = false;
  }

  function unparentLayer() {
    projectStore.removeLayerFromGroup(layer.id);
    deleteDialogOpen = false;
  }

  // Enter/exit time for the layer
  const enterTime = $derived(layer.enterTime ?? 0);
  const exitTime = $derived(layer.exitTime ?? projectStore.state.duration);

  // Duration bar position and width
  const barLeft = $derived(enterTime * pixelsPerSecond);
  const barWidth = $derived((exitTime - enterTime) * pixelsPerSecond);

  // Get unique animated properties
  const animatedProperties = $derived.by(() => {
    const props = new SvelteSet<string>();
    for (const kf of layer.keyframes) {
      props.add(kf.property);
    }
    return Array.from(props).sort();
  });

  function selectLayer() {
    projectStore.selectLayer(layer.id);
  }

  // Drag state for resizing enter/exit time
  let isDraggingEnter = $state(false);
  let isDraggingExit = $state(false);
  let isDraggingBar = $state(false);
  let dragStartX = $state(0);
  let dragStartEnter = $state(0);
  let dragStartExit = $state(0);

  function startDragEnter(e: MouseEvent) {
    e.stopPropagation();
    isDraggingEnter = true;
    dragStartX = e.clientX;
    dragStartEnter = enterTime;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }

  function startDragExit(e: MouseEvent) {
    e.stopPropagation();
    isDraggingExit = true;
    dragStartX = e.clientX;
    dragStartExit = exitTime;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }

  function startDragBar(e: MouseEvent) {
    e.stopPropagation();
    selectLayer();
    isDraggingBar = true;
    dragStartX = e.clientX;
    dragStartEnter = enterTime;
    dragStartExit = exitTime;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }

  function handleDragMove(e: MouseEvent) {
    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;

    if (isDraggingEnter) {
      const newEnter = Math.max(0, Math.min(dragStartEnter + deltaTime, exitTime - 0.1));
      projectStore.setLayerEnterTime(layer.id, newEnter);
    } else if (isDraggingExit) {
      const newExit = Math.max(
        enterTime + 0.1,
        Math.min(dragStartExit + deltaTime, projectStore.state.duration)
      );
      projectStore.setLayerExitTime(layer.id, newExit);
    } else if (isDraggingBar) {
      const duration = dragStartExit - dragStartEnter;
      let newEnter = dragStartEnter + deltaTime;
      let newExit = dragStartExit + deltaTime;

      if (newEnter < 0) {
        newEnter = 0;
        newExit = duration;
      }
      if (newExit > projectStore.state.duration) {
        newExit = projectStore.state.duration;
        newEnter = newExit - duration;
      }

      projectStore.setLayerTimeRange(layer.id, newEnter, newExit, true);
    }
  }

  function handleDragEnd() {
    isDraggingEnter = false;
    isDraggingExit = false;
    isDraggingBar = false;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  }

  onDestroy(() => {
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  });

  const barColor = $derived.by(() => {
    switch (layer.type) {
      case 'video':
        return 'bg-purple-500/20 border-purple-500/40';
      case 'audio':
        return 'bg-blue-500/20 border-blue-500/40';
      case 'group':
        return 'bg-emerald-500/15 border-emerald-500/30';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  });

  const hasAnimatedProperties = $derived(animatedProperties.length > 0);
  const Icon = $derived(getLayerDefinition(layer.type).icon);
</script>

<!-- Layer row -->
<div
  class={cn('relative border-b transition-opacity', {
    'bg-muted/30': isSelected,
    'bg-muted/10': isChild && !isSelected,
    'opacity-40': isDragging
  })}
  data-layer-id={layer.id}
  ondragover={handleDragOver}
  ondragleave={(e) => {
    // Only fire leave if we're actually leaving this element, not entering a child
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !e.currentTarget.contains(related)) {
      onDragLeave?.();
    }
  }}
  ondrop={(e) => onDrop?.(e, layerIndex, layer.id)}
  ondragend={() => onDragEnd?.()}
  role="listitem"
>
  <!-- Drop indicator line - above -->
  {#if isDropTarget && dropPosition === 'above'}
    <div
      class="absolute -top-px right-0 left-0 z-30 h-0.5 bg-primary shadow-lg shadow-primary/50"
    ></div>
  {/if}

  <!-- Drop indicator line - below -->
  {#if isDropTarget && dropPosition === 'below'}
    <div
      class="absolute right-0 -bottom-px left-0 z-30 h-0.5 bg-primary shadow-lg shadow-primary/50"
    ></div>
  {/if}

  <!-- Drop indicator - inside group -->
  {#if isDropTarget && dropPosition === 'inside'}
    <div
      class="absolute inset-0 z-20 rounded bg-primary/10 ring-2 ring-primary/40 ring-inset"
    ></div>
  {/if}

  <div class="group/layer flex items-stretch transition-colors hover:bg-muted/20">
    <!-- Layer header -->
    <div
      bind:this={layerHeaderRef}
      data-layer-header
      class={cn(
        'sticky left-0 z-10 flex w-60 shrink-0 items-center gap-1 border-r px-1 py-1.5',
        isChild ? 'bg-muted/15' : 'bg-background'
      )}
      style:padding-left="{4 + indent * 16}px"
      draggable="true"
      ondragstart={handleDragStart}
      role="button"
      tabindex="-1"
    >
      <!-- Drag handle -->
      <div class="flex shrink-0 cursor-grab text-muted-foreground/40 active:cursor-grabbing">
        <GripVertical class="size-3.5" />
      </div>

      <!-- Expand toggle (only if has animated properties) -->
      {#if hasAnimatedProperties}
        <Button
          size="icon-xs"
          variant="ghost"
          class="shrink-0"
          icon={isExpanded ? ChevronDown : ChevronRight}
          onclick={(e) => {
            e.stopPropagation();
            onToggleExpanded();
          }}
          aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
        />
      {:else if layer.type === 'group'}
        <Button
          size="icon-xs"
          variant="ghost"
          class="shrink-0"
          icon={isExpanded ? ChevronDown : ChevronRight}
          onclick={(e) => {
            e.stopPropagation();
            onToggleExpanded();
          }}
        />
      {:else}
        <div class="w-4"></div>
      {/if}

      <!-- Layer icon -->
      <Icon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      <!-- Layer name -->
      <button
        class="min-w-0 flex-1 cursor-pointer text-left"
        onclick={() => {
          selectLayer();
          onToggleExpanded();
        }}
        tabindex="-1"
      >
        <div
          class={cn('truncate text-xs font-medium', {
            'opacity-30': !layer.visible
          })}
        >
          {layer.name}
        </div>
      </button>

      <!-- Layer controls (hover reveal) -->
      <div
        class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/layer:opacity-100"
      >
        <Button
          size="icon-xs"
          variant="ghost"
          class="text-muted-foreground hover:text-foreground"
          icon={layer.visible ? Eye : EyeOff}
          onclick={toggleVisibility}
          aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
        />

        <Button
          size="icon-xs"
          variant="ghost"
          class="text-muted-foreground hover:text-foreground"
          icon={layer.locked ? Lock : Unlock}
          onclick={toggleLock}
          aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
        />

        <Button
          size="icon-xs"
          variant="ghost"
          class="text-muted-foreground hover:text-destructive"
          icon={Trash2}
          onclick={(e) => {
            e.stopPropagation();
            deleteDialogOpen = true;
          }}
          aria-label="Delete layer"
        />
      </div>
    </div>

    <!-- Timeline area with duration bar -->
    <div class="relative h-11 flex-1">
      <!-- Duration bar -->
      <div
        class="absolute top-1.5 bottom-1.5 rounded border {barColor} transition-colors"
        style:left="{barLeft}px"
        style:width="{barWidth}px"
        style:cursor={isDraggingBar ? 'grabbing' : 'grab'}
        onmousedown={startDragBar}
        role="button"
        tabindex="-1"
      >
        <!-- Enter handle -->
        <div
          class="absolute inset-y-0 left-0 w-1 cursor-col-resize rounded-l bg-white/20 transition-colors hover:bg-white/40"
          onmousedown={startDragEnter}
          role="button"
          tabindex="-1"
        ></div>

        <!-- Exit handle -->
        <div
          class="absolute inset-y-0 right-0 w-1 cursor-col-resize rounded-r bg-white/20 transition-colors hover:bg-white/40"
          onmousedown={startDragExit}
          role="button"
          tabindex="-1"
        ></div>
      </div>
    </div>
  </div>

  <!-- Expanded property tracks -->
  {#if isExpanded && hasAnimatedProperties}
    {#each animatedProperties as property (property)}
      <TimelinePropertyTrack {layer} {property} {pixelsPerSecond} indent={indent + 1} />
    {/each}
  {/if}
</div>

<!-- Delete confirmation dialog -->
<AlertDialog.Root
  open={deleteDialogOpen}
  onOpenChange={(open) => {
    deleteDialogOpen = open;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete {layer.type === 'group' ? 'Group' : 'Layer'}</AlertDialog.Title>
      <AlertDialog.Description>
        {#if isChild}
          Remove "{layer.name}" from group, or delete it entirely?
        {:else}
          Delete "{layer.name}"{layer.type === 'group' ? ' and all its children' : ''}? This action
          cannot be undone.
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      {#if isChild}
        <Button variant="secondary" onclick={unparentLayer}>Unparent</Button>
      {/if}
      <AlertDialog.Action onclick={deleteLayer}>Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

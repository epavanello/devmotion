<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import TimelinePropertyTrack from './timeline-property-track.svelte';
  import { onDestroy } from 'svelte';
  import { cn } from '$lib/utils';
  import { getLayerDefinition } from '$lib/layers/registry';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    layer: TypedLayer;
    pixelsPerSecond: number;
    indent?: number;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    expandedProperties: SvelteSet<string>;
    onToggleProperty: (property: string) => void;
  }

  let {
    layer,
    pixelsPerSecond,
    indent = 0,
    isExpanded,
    onToggleExpanded,
    expandedProperties,
    onToggleProperty
  }: Props = $props();

  const isSelected = $derived(projectStore.selectedLayerId === layer.id);

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
    document.getElementById('editor-tab')?.click();
    projectStore.selectedLayerId = layer.id;
    onToggleExpanded();
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
  class={cn('border-b', {
    'bg-muted/30': isSelected
  })}
>
  <div class="flex items-stretch transition-colors hover:bg-muted/20">
    <!-- Layer header -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      data-layer-header
      class="sticky left-0 z-10 flex w-60 shrink-0 items-center gap-1.5 border-r bg-background px-2 py-1.5"
      style:padding-left="{8 + indent * 16}px"
      onclick={selectLayer}
      role="button"
      tabindex="0"
    >
      <!-- Expand toggle (only if has animated properties) -->
      {#if hasAnimatedProperties}
        <button
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted"
          onclick={(e) => {
            e.stopPropagation();
            onToggleExpanded();
          }}
          aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
        >
          {#if isExpanded}
            <ChevronDown class="h-3 w-3 text-muted-foreground" />
          {:else}
            <ChevronRight class="h-3 w-3 text-muted-foreground" />
          {/if}
        </button>
      {:else}
        <div class="w-4"></div>
      {/if}

      <!-- Layer icon -->
      <Icon class="h-4 w-4 shrink-0 text-muted-foreground" />

      <!-- Layer name -->
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-medium">{layer.name}</div>
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

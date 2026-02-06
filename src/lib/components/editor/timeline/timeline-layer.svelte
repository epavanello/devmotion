<script lang="ts">
  import type { Layer, Keyframe } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import TimelineKeyframe from './timeline-keyframe.svelte';

  interface Props {
    layer: Layer;
    pixelsPerSecond: number;
  }

  let { layer, pixelsPerSecond }: Props = $props();

  const isSelected = $derived(projectStore.selectedLayerId === layer.id);

  // Enter/exit time for the layer
  const enterTime = $derived(layer.enterTime ?? 0);
  const exitTime = $derived(layer.exitTime ?? projectStore.project.duration);
  const hasTimeRange = $derived(enterTime > 0 || exitTime < projectStore.project.duration);

  // Media layer detection
  const isMediaLayer = $derived(layer.type === 'video' || layer.type === 'audio');

  // Duration bar position and width
  const barLeft = $derived(enterTime * pixelsPerSecond);
  const barWidth = $derived((exitTime - enterTime) * pixelsPerSecond);

  // Group keyframes by timestamp
  const keyframeGroups = $derived(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const groups = new Map<number, Keyframe[]>();
    for (const keyframe of layer.keyframes) {
      const existing = groups.get(keyframe.time);
      if (existing) {
        existing.push(keyframe);
      } else {
        groups.set(keyframe.time, [keyframe]);
      }
    }
    return Array.from(groups.entries()).map(([time, keyframes]) => ({
      time,
      keyframes
    }));
  });

  function selectLayer() {
    projectStore.selectedLayerId = layer.id;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectLayer();
    }
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
        Math.min(dragStartExit + deltaTime, projectStore.project.duration)
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
      if (newExit > projectStore.project.duration) {
        newExit = projectStore.project.duration;
        newEnter = newExit - duration;
      }

      projectStore.setLayerTimeRange(layer.id, newEnter, newExit);
    }
  }

  function handleDragEnd() {
    isDraggingEnter = false;
    isDraggingExit = false;
    isDraggingBar = false;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  }

  // Color for the duration bar based on layer type
  const barColor = $derived.by(() => {
    switch (layer.type) {
      case 'video':
        return 'bg-purple-500/30 border-purple-500/50';
      case 'audio':
        return 'bg-blue-500/30 border-blue-500/50';
      default:
        return 'bg-primary/15 border-primary/30';
    }
  });

  const barLabel = $derived.by(() => {
    if (layer.type === 'video') return 'Video';
    if (layer.type === 'audio') return 'Audio';
    return '';
  });
</script>

<div
  class="flex border-b transition-colors hover:bg-muted/50"
  class:bg-muted={isSelected}
  onclick={selectLayer}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <!-- Layer name -->
  <div class="w-50 shrink-0 truncate border-r px-3 py-2 text-sm">
    <div class="flex flex-col">
      <span class="truncate">{layer.name}</span>
      {#if hasTimeRange || isMediaLayer}
        <span class="text-[10px] text-muted-foreground">
          {enterTime.toFixed(1)}s – {exitTime.toFixed(1)}s
        </span>
      {/if}
    </div>
  </div>

  <!-- Keyframes area -->
  <div class="relative h-12 min-h-12 flex-1">
    <!-- Duration bar (shown for all layers with enter/exit times) -->
    {#if hasTimeRange || isMediaLayer}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="absolute top-1 bottom-1 rounded-sm border {barColor}"
        style:left="{barLeft}px"
        style:width="{barWidth}px"
        style:cursor={isDraggingBar ? 'grabbing' : 'grab'}
        onmousedown={startDragBar}
      >
        <!-- Enter handle -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize rounded-l-sm bg-white/30 hover:bg-white/50"
          onmousedown={startDragEnter}
        ></div>

        <!-- Exit handle -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize rounded-r-sm bg-white/30 hover:bg-white/50"
          onmousedown={startDragExit}
        ></div>

        <!-- Label -->
        {#if barLabel && barWidth > 40}
          <span
            class="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[9px] font-medium text-white/60"
          >
            {barLabel}
          </span>
        {/if}
      </div>
    {/if}

    <!-- Keyframes -->
    {#each keyframeGroups() as group (group.time)}
      <TimelineKeyframe keyframes={group.keyframes} {pixelsPerSecond} layerId={layer.id} />
    {/each}
  </div>
</div>

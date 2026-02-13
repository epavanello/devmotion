<script lang="ts">
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import TimelineRuler from './timeline-ruler.svelte';
  import TimelineLayer from './timeline-layer.svelte';
  import TimelinePlayhead from './timeline-playhead.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  let timelineContainer: HTMLDivElement;
  let isDraggingPlayhead = $state(false);
  let isDraggingTimeline = $state(false);
  let isSelecting = $state(false);
  let selectionBox = $state<{ x: number; y: number; width: number; height: number } | null>(null);
  let selectionStart = { x: 0, y: 0 };

  const pixelsPerSecond = 100;

  function updateTimeFromMousePosition(e: MouseEvent) {
    if (!timelineContainer) return;
    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 200; // 200px for layer names column
    const time = Math.max(0, x / pixelsPerSecond);
    projectStore.setCurrentTime(Math.min(time, projectStore.state.duration));
  }

  function handleTimelineMouseDown(e: MouseEvent) {
    if (projectStore.isRecording) return;
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const isRuler = !!target.closest('.timeline-ruler');
    const isKeyframe = !!target.closest('button[aria-label^="Keyframe"]');

    if (isKeyframe) return;

    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isRuler) {
      isDraggingTimeline = true;
      projectStore.pause();
      updateTimeFromMousePosition(e);
      projectStore.clearKeyframeSelection();
    } else {
      isSelecting = true;
      selectionStart = { x, y };
      selectionBox = { x, y, width: 0, height: 0 };
      if (!e.shiftKey) {
        projectStore.clearKeyframeSelection();
      }
    }
  }

  function handleTimelineMouseMove(e: MouseEvent) {
    if (isDraggingTimeline) {
      updateTimeFromMousePosition(e);
      return;
    }

    if (isSelecting) {
      const rect = timelineContainer.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const x = Math.min(selectionStart.x, currentX);
      const y = Math.min(selectionStart.y, currentY);
      const width = Math.abs(selectionStart.x - currentX);
      const height = Math.abs(selectionStart.y - currentY);

      selectionBox = { x, y, width, height };

      // Calculate time range for selection
      const startTime = (x - 200) / pixelsPerSecond;
      const endTime = (x + width - 200) / pixelsPerSecond;

      // Calculate which layers are in the vertical range
      // Ruler is 32px (h-8)
      const layerOffset = 32;
      const layerHeight = 49; // 48px + 1px border
      const activeLayerIds = new SvelteSet<string>();

      // Build visible row order (top-level + children of groups)
      const visibleRows: string[] = [];
      for (const layer of projectStore.state.layers) {
        if (!layer.parentId) {
          visibleRows.push(layer.id);
          if (layer.type === 'group') {
            for (const child of projectStore.state.layers) {
              if (child.parentId === layer.id) {
                visibleRows.push(child.id);
              }
            }
          }
        }
      }

      visibleRows.forEach((layerId, index) => {
        const layerTop = layerOffset + index * layerHeight;
        const layerBottom = layerTop + layerHeight;

        if (y < layerBottom && y + height > layerTop) {
          activeLayerIds.add(layerId);
        }
      });

      projectStore.selectKeyframesInArea(startTime, endTime, activeLayerIds);
    }
  }

  function handleTimelineMouseUp() {
    isDraggingTimeline = false;
    isSelecting = false;
    selectionBox = null;
  }

  function startDragPlayhead() {
    // Disable interactions during recording
    if (projectStore.isRecording) return;

    isDraggingPlayhead = true;
    projectStore.pause();
  }

  function handleDragPlayhead(e: MouseEvent) {
    if (!isDraggingPlayhead) return;
    updateTimeFromMousePosition(e);
  }

  function stopDragPlayhead() {
    isDraggingPlayhead = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      updateTimeFromMousePosition(e as unknown as MouseEvent);
    }
  }

  $effect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleDragPlayhead);
      window.addEventListener('mouseup', stopDragPlayhead);

      return () => {
        window.removeEventListener('mousemove', handleDragPlayhead);
        window.removeEventListener('mouseup', stopDragPlayhead);
      };
    }
  });

  $effect(() => {
    if (isDraggingTimeline || isSelecting) {
      window.addEventListener('mousemove', handleTimelineMouseMove);
      window.addEventListener('mouseup', handleTimelineMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleTimelineMouseMove);
        window.removeEventListener('mouseup', handleTimelineMouseUp);
      };
    }
  });
</script>

<div class="flex h-full flex-col overflow-hidden">
  <ScrollArea class="h-full" orientation="both">
    <div
      bind:this={timelineContainer}
      class="relative min-h-full select-none"
      style="min-width: {projectStore.state.duration * pixelsPerSecond + 200}px"
      onmousedown={handleTimelineMouseDown}
      onkeydown={handleKeyDown}
      role="button"
      tabindex="0"
    >
      <!-- Ruler -->
      <div class="sticky top-0 z-10 border-b bg-background">
        <TimelineRuler {pixelsPerSecond} duration={projectStore.state.duration} />
      </div>

      <!-- Layers -->
      <div class="relative">
        {#each projectStore.state.layers.filter((l) => !l.parentId) as layer (layer.id)}
          <TimelineLayer {layer} {pixelsPerSecond} />

          <!-- If this is a group, also render children indented -->
          {#if layer.type === 'group'}
            {#each projectStore.state.layers.filter((l) => l.parentId === layer.id) as child (child.id)}
              <TimelineLayer layer={child} {pixelsPerSecond} indent={1} />
            {/each}
          {/if}
        {/each}

        {#if projectStore.state.layers.length === 0}
          <div class="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No layers yet. Add a layer to start animating.
          </div>
        {/if}
      </div>

      <!-- Playhead -->
      <TimelinePlayhead
        currentTime={projectStore.currentTime}
        {pixelsPerSecond}
        onDragStart={startDragPlayhead}
      />

      <!-- Selection Marquee -->
      {#if selectionBox}
        <div
          class="pointer-events-none absolute border border-primary bg-primary/20"
          style="left: {selectionBox.x}px; top: {selectionBox.y}px; width: {selectionBox.width}px; height: {selectionBox.height}px; z-index: 50;"
        ></div>
      {/if}
    </div>
  </ScrollArea>
</div>

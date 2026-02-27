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
  let scrollContainer = $state<HTMLElement | null>(null);
  let isDraggingPlayhead = $state(false);
  let isDraggingRuler = $state(false);
  let isSelecting = $state(false);
  let selectionBox = $state<{ x: number; y: number; width: number; height: number } | null>(null);
  let selectionStart = { x: 0, y: 0 };

  // Zoom/scale state for timeline resolution
  let pixelsPerSecond = $state(100);
  const MIN_PIXELS_PER_SECOND = 20;
  const MAX_PIXELS_PER_SECOND = 500;

  // Expanded layers/properties state
  const expandedLayers = new SvelteSet<string>();
  const expandedProperties = new SvelteSet<string>(); // layerId:property format

  function toggleLayerExpanded(layerId: string) {
    if (expandedLayers.has(layerId)) {
      expandedLayers.delete(layerId);
      // Also collapse all properties of this layer
      const propertyKeys = Array.from(expandedProperties).filter((k) =>
        k.startsWith(`${layerId}:`)
      );
      for (const key of propertyKeys) {
        expandedProperties.delete(key);
      }
    } else {
      expandedLayers.add(layerId);
    }
  }

  function togglePropertyExpanded(layerId: string, property: string) {
    const key = `${layerId}:${property}`;
    if (expandedProperties.has(key)) {
      expandedProperties.delete(key);
    } else {
      expandedProperties.add(key);
    }
  }

  function updateTimeFromMousePosition(e: MouseEvent) {
    if (!timelineContainer) return;
    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 240; // 240px for layer names column
    const time = Math.max(0, x / pixelsPerSecond);
    projectStore.setCurrentTime(Math.min(time, projectStore.state.duration));
  }

  function handleTimelineMouseDown(e: MouseEvent) {
    if (projectStore.isRecording) return;
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const isRuler = !!target.closest('.timeline-ruler');
    const isKeyframe = !!target.closest('[data-keyframe]');
    const isLayerHeader = !!target.closest('[data-layer-header]');
    const isPropertyHeader = !!target.closest('[data-property-header]');

    if (isKeyframe || isLayerHeader || isPropertyHeader) return;

    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isRuler) {
      e.preventDefault();
      isDraggingRuler = true;
      projectStore.pause();
      updateTimeFromMousePosition(e);
    } else {
      // Start marquee selection in the timeline area
      isSelecting = true;
      selectionStart = { x, y };
      selectionBox = { x, y, width: 0, height: 0 };
      if (!e.shiftKey) {
        projectStore.clearKeyframeSelection();
      }
    }
  }

  function handleRulerDrag(e: MouseEvent) {
    if (!isDraggingRuler) return;
    updateTimeFromMousePosition(e);
  }

  function stopRulerDrag() {
    isDraggingRuler = false;
  }

  function handleSelectionMove(e: MouseEvent) {
    if (!isSelecting) return;

    const rect = timelineContainer.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(selectionStart.x, currentX);
    const y = Math.min(selectionStart.y, currentY);
    const width = Math.abs(selectionStart.x - currentX);
    const height = Math.abs(selectionStart.y - currentY);

    selectionBox = { x, y, width, height };

    // Calculate time range for selection
    const startTime = (x - 240) / pixelsPerSecond;
    const endTime = (x + width - 240) / pixelsPerSecond;

    // Find all keyframe elements that intersect with the selection box
    const keyframeElements = timelineContainer.querySelectorAll('[data-keyframe]');
    const selectedIds = new SvelteSet<string>();

    for (const element of keyframeElements) {
      const keyframeRect = element.getBoundingClientRect();
      const containerRect = timelineContainer.getBoundingClientRect();

      // Convert to container-relative coordinates
      const keyframeX = keyframeRect.left - containerRect.left + keyframeRect.width / 2;
      const keyframeY = keyframeRect.top - containerRect.top + keyframeRect.height / 2;

      // Check if keyframe center is inside selection box
      if (keyframeX >= x && keyframeX <= x + width && keyframeY >= y && keyframeY <= y + height) {
        // Get the keyframe ID from data attribute
        const keyframeId = element.getAttribute('data-keyframe-id');
        if (keyframeId) {
          selectedIds.add(keyframeId);
        }
      }
    }

    // Update selection based on shift key
    if (!e.shiftKey) {
      // Replace selection
      projectStore.selectedKeyframeIds.clear();
    }

    // Add to selection
    for (const id of selectedIds) {
      projectStore.selectedKeyframeIds.add(id);
    }
  }

  function stopSelection() {
    isSelecting = false;
    selectionBox = null;
  }

  // Handle zoom with pinch (trackpad) or Cmd+scroll
  function handleWheel(e: WheelEvent) {
    // Check if it's a pinch gesture (ctrlKey is set on trackpad pinch)
    // or if Command/Ctrl is held
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const delta = -e.deltaY;
      const zoomFactor = 1 + delta * 0.002;
      const newPixelsPerSecond = Math.max(
        MIN_PIXELS_PER_SECOND,
        Math.min(MAX_PIXELS_PER_SECOND, pixelsPerSecond * zoomFactor)
      );

      // Get mouse position relative to timeline for zoom origin
      if (scrollContainer && timelineContainer) {
        // Mouse position relative to the scroll viewport (not the full container)
        const scrollViewportRect = scrollContainer.getBoundingClientRect();
        const mouseXInViewport = e.clientX - scrollViewportRect.left - 240;

        // Calculate the time value at the mouse position before zoom
        const timeAtMouse = (scrollContainer.scrollLeft + mouseXInViewport) / pixelsPerSecond;

        pixelsPerSecond = newPixelsPerSecond;

        // Adjust scroll to keep the same time under the mouse after zoom
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const newScrollLeft = timeAtMouse * newPixelsPerSecond - mouseXInViewport;
            scrollContainer.scrollLeft = Math.max(0, newScrollLeft);
          }
        });
      } else {
        pixelsPerSecond = newPixelsPerSecond;
      }
    }
  }

  function startDragPlayhead() {
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
    if (isDraggingRuler) {
      window.addEventListener('mousemove', handleRulerDrag);
      window.addEventListener('mouseup', stopRulerDrag);

      return () => {
        window.removeEventListener('mousemove', handleRulerDrag);
        window.removeEventListener('mouseup', stopRulerDrag);
      };
    }
  });

  $effect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleSelectionMove);
      window.addEventListener('mouseup', stopSelection);

      return () => {
        window.removeEventListener('mousemove', handleSelectionMove);
        window.removeEventListener('mouseup', stopSelection);
      };
    }
  });
</script>

<div class="flex h-full flex-col overflow-hidden">
  <ScrollArea class="h-full" orientation="both" bind:ref={scrollContainer}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={timelineContainer}
      class="relative min-h-full select-none"
      style="min-width: {projectStore.state.duration * pixelsPerSecond + 240}px"
      onmousedown={handleTimelineMouseDown}
      onwheel={handleWheel}
      role="button"
      tabindex="0"
    >
      <!-- Ruler -->
      <div class="sticky top-0 z-20 border-b bg-background">
        <TimelineRuler {pixelsPerSecond} duration={projectStore.state.duration} />
      </div>

      <!-- Layers -->
      <div class="relative">
        {#each projectStore.state.layers.filter((l) => !l.parentId) as layer (layer.id)}
          <TimelineLayer
            {layer}
            {pixelsPerSecond}
            isExpanded={expandedLayers.has(layer.id)}
            onToggleExpanded={() => toggleLayerExpanded(layer.id)}
            {expandedProperties}
            onToggleProperty={(prop) => togglePropertyExpanded(layer.id, prop)}
          />

          <!-- If this is a group, also render children -->
          {#if layer.type === 'group'}
            {#each projectStore.state.layers.filter((l) => l.parentId === layer.id) as child (child.id)}
              <TimelineLayer
                layer={child}
                {pixelsPerSecond}
                indent={1}
                isExpanded={expandedLayers.has(child.id)}
                onToggleExpanded={() => toggleLayerExpanded(child.id)}
                {expandedProperties}
                onToggleProperty={(prop) => togglePropertyExpanded(child.id, prop)}
              />
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
          class="pointer-events-none absolute z-30 border-2 border-primary bg-primary/10"
          style="left: {selectionBox.x}px; top: {selectionBox.y}px; width: {selectionBox.width}px; height: {selectionBox.height}px;"
        ></div>
      {/if}
    </div>
  </ScrollArea>

  <!-- Zoom indicator -->
  <div
    class="absolute right-2 bottom-2 rounded border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm"
  >
    {(pixelsPerSecond / 100).toFixed(1)}x
  </div>
</div>

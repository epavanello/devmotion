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

  // Expanded layers state
  const expandedLayers = new SvelteSet<string>();

  // Track if all layers are expanded
  const allExpanded = $derived(
    projectStore.state.layers.length > 0 &&
      projectStore.state.layers.every((layer) => expandedLayers.has(layer.id))
  );

  // Drag & drop state for layer reordering
  let dropTargetId = $state<string | null>(null);
  let dropPosition = $state<'above' | 'below' | 'inside' | null>(null);
  let draggedLayerId = $state<string | null>(null);

  function handleLayerDragStart(e: DragEvent, layerId: string, index: number) {
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', index.toString());
    e.dataTransfer!.setData('application/layer-id', layerId);
    draggedLayerId = layerId;
  }

  function handleLayerDragOver(e: DragEvent, targetId: string, targetElement: HTMLElement) {
    e.preventDefault();
    if (!e.dataTransfer?.types.includes('application/layer-id')) return;

    // Don't show drop indicators on the dragged layer itself
    if (targetId === draggedLayerId) {
      dropTargetId = null;
      dropPosition = null;
      return;
    }

    e.dataTransfer!.dropEffect = 'move';
    dropTargetId = targetId;

    // Determine drop position based on mouse Y position relative to element
    const rect = targetElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    const targetLayer = projectStore.state.layers.find((l) => l.id === targetId);

    // If it's a group, default to "inside" with small above/below edge zones
    if (targetLayer?.type === 'group') {
      if (y < height * 0.2) {
        dropPosition = 'above';
      } else if (y > height * 0.8) {
        // Only show "below" if we wouldn't want "inside" (i.e. don't nest groups)
        const dragLayer = draggedLayerId
          ? projectStore.state.layers.find((l) => l.id === draggedLayerId)
          : null;
        dropPosition = dragLayer?.type === 'group' ? 'below' : 'inside';
      } else {
        dropPosition = 'inside';
      }
    } else {
      // For non-groups, only allow above/below
      dropPosition = y < height / 2 ? 'above' : 'below';
    }
  }

  function handleLayerDragLeave() {
    dropTargetId = null;
    dropPosition = null;
  }

  function handleLayerDrop(e: DragEvent, dropIndex: number, targetLayerId: string) {
    e.preventDefault();
    const targetDropPosition = dropPosition;
    dropTargetId = null;
    dropPosition = null;
    draggedLayerId = null;

    const dragLayerId = e.dataTransfer!.getData('application/layer-id');
    if (!dragLayerId || dragLayerId === targetLayerId) return;

    const dragLayer = projectStore.state.layers.find((l) => l.id === dragLayerId);
    const targetLayer = projectStore.state.layers.find((l) => l.id === targetLayerId);
    if (!dragLayer || !targetLayer) return;

    // Case 1: Dropping inside a group
    if (targetLayer.type === 'group' && targetDropPosition === 'inside') {
      projectStore.addLayerToGroup(dragLayerId, targetLayerId);
      // Auto-expand the group so the user sees the result
      expandedLayers.add(targetLayerId);
      return;
    }

    // Case 2: Dropping above/below a target
    // First, if the dragged layer is a child of a group and we're dropping on a
    // top-level layer, we need to unparent it first
    const targetIsChild = !!targetLayer.parentId;
    const dragIsChild = !!dragLayer.parentId;

    if (dragIsChild && !targetIsChild) {
      // Unparent the dragged layer (clears parentId, bakes transform)
      // preserveGroup: don't dissolve the folder just because a child was dragged out
      projectStore.removeLayerFromGroup(dragLayerId, { preserveGroup: true });
    } else if (!dragIsChild && targetIsChild && targetLayer.parentId) {
      // Dragging a top-level layer onto a child → add to that group
      projectStore.addLayerToGroup(dragLayerId, targetLayer.parentId);
      return;
    }

    // Now reorder in the array
    // Re-fetch indices since removeLayerFromGroup may have changed the array
    const layers = projectStore.state.layers;
    const newDragIndex = layers.findIndex((l) => l.id === dragLayerId);
    const newDropIndex = layers.findIndex((l) => l.id === targetLayerId);
    if (newDragIndex === -1 || newDropIndex === -1) return;

    let finalDropIndex = newDropIndex;
    if (targetDropPosition === 'below') {
      // If target is a group, skip past its children
      if (targetLayer.type === 'group') {
        let i = newDropIndex + 1;
        while (i < layers.length && layers[i].parentId === targetLayerId) {
          i++;
        }
        finalDropIndex = i;
      } else {
        finalDropIndex = newDropIndex + 1;
      }
    }

    if (newDragIndex !== finalDropIndex && newDragIndex !== finalDropIndex - 1) {
      projectStore.reorderLayers(
        newDragIndex,
        finalDropIndex > newDragIndex ? finalDropIndex - 1 : finalDropIndex
      );
    }
  }

  function handleDragEnd() {
    dropTargetId = null;
    dropPosition = null;
    draggedLayerId = null;
  }

  function toggleLayerExpanded(layerId: string) {
    if (expandedLayers.has(layerId)) {
      expandedLayers.delete(layerId);
    } else {
      expandedLayers.add(layerId);
    }
  }

  function toggleAllLayers() {
    if (allExpanded) {
      // If all are expanded, collapse all
      expandedLayers.clear();
    } else {
      // Otherwise, expand all layers (both groups and individual layers with properties)
      for (const layer of projectStore.state.layers) {
        expandedLayers.add(layer.id);
      }
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
        <TimelineRuler
          {pixelsPerSecond}
          duration={projectStore.state.duration}
          {allExpanded}
          onToggleAll={toggleAllLayers}
        />
      </div>

      <!-- Layers -->
      <div class="relative">
        {#each projectStore.state.layers.filter((l) => !l.parentId) as layer (layer.id)}
          {@const layerIndex = projectStore.state.layers.indexOf(layer)}
          <TimelineLayer
            {layer}
            {pixelsPerSecond}
            {layerIndex}
            isExpanded={expandedLayers.has(layer.id)}
            onToggleExpanded={() => toggleLayerExpanded(layer.id)}
            onDragStart={handleLayerDragStart}
            onDragOver={handleLayerDragOver}
            onDragLeave={handleLayerDragLeave}
            onDrop={handleLayerDrop}
            onDragEnd={handleDragEnd}
            isDropTarget={dropTargetId === layer.id}
            {dropPosition}
            isDragging={draggedLayerId === layer.id}
          />

          <!-- If this is a group and expanded, also render children -->
          {#if layer.type === 'group' && expandedLayers.has(layer.id)}
            <div class="border-l-2 border-emerald-500/30">
              {#each projectStore.state.layers.filter((l) => l.parentId === layer.id) as child (child.id)}
                {@const childIndex = projectStore.state.layers.indexOf(child)}
                <TimelineLayer
                  layer={child}
                  {pixelsPerSecond}
                  layerIndex={childIndex}
                  indent={1}
                  isExpanded={expandedLayers.has(child.id)}
                  onToggleExpanded={() => toggleLayerExpanded(child.id)}
                  onDragStart={handleLayerDragStart}
                  onDragOver={handleLayerDragOver}
                  onDragLeave={handleLayerDragLeave}
                  onDrop={handleLayerDrop}
                  onDragEnd={handleDragEnd}
                  isDropTarget={dropTargetId === child.id}
                  {dropPosition}
                  isDragging={draggedLayerId === child.id}
                  isChild
                />
              {/each}
            </div>
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
</div>

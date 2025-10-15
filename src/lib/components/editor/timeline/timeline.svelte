<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import TimelineRuler from './timeline-ruler.svelte';
  import TimelineLayer from './timeline-layer.svelte';
  import TimelinePlayhead from './timeline-playhead.svelte';

  let timelineContainer: HTMLDivElement;
  let isDraggingPlayhead = $state(false);

  const pixelsPerSecond = 100;

  function handleTimelineClick(e: MouseEvent) {
    if (!timelineContainer) return;
    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 200; // 200px for layer names column
    const time = Math.max(0, x / pixelsPerSecond);
    projectStore.setCurrentTime(Math.min(time, projectStore.project.duration));
  }

  function startDragPlayhead() {
    isDraggingPlayhead = true;
    projectStore.pause();
  }

  function handleDragPlayhead(e: MouseEvent) {
    if (!isDraggingPlayhead || !timelineContainer) return;
    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 200;
    const time = Math.max(0, x / pixelsPerSecond);
    projectStore.setCurrentTime(Math.min(time, projectStore.project.duration));
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
</script>

<div class="flex h-full flex-col border-t bg-background">
  <!-- Timeline Header -->
  <div class="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
    <div class="text-sm font-medium">Timeline</div>
    <div class="text-xs text-muted-foreground">
      {projectStore.project.currentTime.toFixed(2)}s / {projectStore.project.duration}s
    </div>
  </div>

  <!-- Timeline Content -->
  <div class="flex-1 overflow-hidden">
    <ScrollArea class="h-full">
      <div
        bind:this={timelineContainer}
        class="relative min-h-full"
        onclick={handleTimelineClick}
        role="button"
        tabindex="0"
      >
        <!-- Ruler -->
        <div class="sticky top-0 z-10 border-b bg-background">
          <TimelineRuler {pixelsPerSecond} duration={projectStore.project.duration} />
        </div>

        <!-- Layers -->
        <div class="relative">
          {#each projectStore.project.layers as layer, index (layer.id)}
            <TimelineLayer {layer} {pixelsPerSecond} />
          {/each}

          {#if projectStore.project.layers.length === 0}
            <div class="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No layers yet. Add a layer to start animating.
            </div>
          {/if}
        </div>

        <!-- Playhead -->
        <TimelinePlayhead
          currentTime={projectStore.project.currentTime}
          {pixelsPerSecond}
          onDragStart={startDragPlayhead}
        />
      </div>
    </ScrollArea>
  </div>
</div>

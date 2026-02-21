<script lang="ts">
  import { onMount } from 'svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import CanvasControls from './canvas-controls.svelte';
  import CanvasPlayerControls from './canvas-player-controls.svelte';
  import LayersRenderer from './layers-renderer.svelte';
  import Watermark from './watermark.svelte';
  import { getBackgroundColor, getBackgroundImage } from '$lib/schemas/background';
  import { cn } from '$lib/utils';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  let canvasContainer: HTMLDivElement | undefined = $state();

  let {
    projectViewport = $bindable(),
    isRecording = false
  }: {
    projectViewport: HTMLDivElement | undefined;
    isRecording?: boolean;
  } = $props();

  let animationFrameId: number;
  let lastFrameTime: number | null = null;
  let isPanning = $state(false);
  let panStart = $state({ x: 0, y: 0 });
  let containerWidth = $state(1);
  let containerHeight = $state(1);
  let resizeObserver: ResizeObserver;

  onMount(() => {
    animationFrameId = requestAnimationFrame(animate);

    // Observe container size changes
    if (canvasContainer) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          containerWidth = entry.contentRect.width;
          containerHeight = entry.contentRect.height;
        }
      });
      resizeObserver.observe(canvasContainer);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  });

  function animate(timestamp: number) {
    animationFrameId = requestAnimationFrame(animate);

    // Update scene if playing
    if (projectStore.isPlaying) {
      if (lastFrameTime === null) {
        lastFrameTime = timestamp;
      }

      // Calculate real elapsed time in seconds
      const deltaTime = (timestamp - lastFrameTime) / 1000;
      lastFrameTime = timestamp;

      const newTime = projectStore.currentTime + deltaTime;

      if (newTime >= projectStore.state.duration) {
        // When recording, stop at the end instead of looping
        if (projectStore.isRecording) {
          projectStore.setCurrentTime(projectStore.state.duration);
          projectStore.pause();
        } else {
          projectStore.setCurrentTime(0);
        }
        lastFrameTime = null;
      } else {
        projectStore.setCurrentTime(newTime);
      }
    } else {
      // Reset timestamp when not playing
      lastFrameTime = null;
    }
  }

  /**
   * Handle pan and zoom interactions on the canvas
   */
  function onCanvasMouseDown(event: MouseEvent) {
    // Disable interactions during recording
    if (projectStore.isRecording) return;

    // Middle mouse or Shift+drag for panning
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      isPanning = true;
      panStart = { x: event.clientX, y: event.clientY };
      event.preventDefault();
      return;
    }

    // Left click on empty space - deselect
    if (event.button === 0 && event.target === event.currentTarget) {
      projectStore.selectedLayerId = null;
    }
  }

  function onCanvasMouseMove(event: MouseEvent) {
    if (isPanning) {
      const deltaX = event.clientX - panStart.x;
      const deltaY = event.clientY - panStart.y;

      const currentPan = projectStore.viewport.pan;
      projectStore.setPan(currentPan.x + deltaX, currentPan.y + deltaY);

      panStart = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  function onCanvasMouseUp() {
    isPanning = false;
  }

  function onCanvasWheel(event: WheelEvent) {
    // Disable zoom during recording
    if (projectStore.isRecording) return;

    event.preventDefault();

    // Zoom with scroll wheel
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = projectStore.viewport.zoom * delta;

    // Clamp zoom between 0.1 and 5
    projectStore.setZoom(Math.max(0.1, Math.min(5, newZoom)));
  }

  // Calculate scale factor to fit project dimensions in viewport
  // This maintains aspect ratio and leaves some padding
  const VIEWPORT_PADDING = 0.9; // Use 90% of available space for padding
  const projectAspectRatio = $derived(projectStore.state.width / projectStore.state.height);
  const containerAspectRatio = $derived(containerWidth / containerHeight);

  const fitScale = $derived(
    containerAspectRatio > projectAspectRatio
      ? (containerHeight * VIEWPORT_PADDING) / projectStore.state.height
      : (containerWidth * VIEWPORT_PADDING) / projectStore.state.width
  );

  // Calculate viewport transform for pan, zoom, and fit scale
  const viewportTransform = $derived(
    `translate(${projectStore.viewport.pan.x}px, ${projectStore.viewport.pan.y}px) scale(${fitScale * projectStore.viewport.zoom})`
  );

  // Calculate scale for recording mode to fit viewport while maintaining aspect ratio
  const recordingScale = $derived.by(() => {
    if (typeof window === 'undefined') return 1;
    const scaleX = window.innerWidth / projectStore.state.width;
    const scaleY = window.innerHeight / projectStore.state.height;
    return Math.min(1, scaleX, scaleY); // Never scale up, only down
  });
</script>

<div
  class={cn('group/canvas relative h-full w-full overflow-hidden bg-background', {
    'fixed! inset-0! z-9999! flex! items-center! justify-center! bg-foreground!': isRecording
  })}
>
  <!-- Canvas viewport -->
  <div
    bind:this={canvasContainer}
    class={cn('absolute inset-0', {
      'relative flex items-center justify-center': isRecording
    })}
    style:cursor={isPanning ? 'grabbing' : 'default'}
    style:transform-style="preserve-3d"
    onmousedown={onCanvasMouseDown}
    onmousemove={onCanvasMouseMove}
    onmouseup={onCanvasMouseUp}
    onwheel={onCanvasWheel}
    role="presentation"
  >
    <!-- Viewport transform container (pan and zoom) -->
    <div
      class={cn('viewport-content absolute top-1/2 left-1/2 origin-center', {
        'relative top-auto left-auto': isRecording
      })}
      style:transform={isRecording ? 'none' : viewportTransform}
      style:transform-style="preserve-3d"
    >
      {#if !isRecording}
        <!-- Dark overlay with transparent hole around canvas view -->
        <div
          class="pointer-events-none absolute z-3 bg-background/60"
          style:width="20000px"
          style:height="20000px"
          style:left="-10000px"
          style:top="-10000px"
          style:clip-path={`polygon(evenodd, 0 0, 0 20000px, 20000px 20000px, 20000px 0, 0 0, ${10000 - projectStore.state.width / 2}px ${10000 - projectStore.state.height / 2}px, ${10000 - projectStore.state.width / 2}px ${10000 + projectStore.state.height / 2}px, ${10000 + projectStore.state.width / 2}px ${10000 + projectStore.state.height / 2}px, ${10000 + projectStore.state.width / 2}px ${10000 - projectStore.state.height / 2}px, ${10000 - projectStore.state.width / 2}px ${10000 - projectStore.state.height / 2}px)`}
        ></div>

        <!-- Player shadow -->
        <div
          class="pointer-events-none absolute z-4 rounded-2xl border border-foreground/10 shadow-lg"
          style:width="{projectStore.state.width}px"
          style:height="{projectStore.state.height}px"
          style:left={isRecording ? 'auto' : `-${projectStore.state.width / 2}px`}
          style:top={isRecording ? 'auto' : `-${projectStore.state.height / 2}px`}
        ></div>
      {/if}

      <!-- Project viewport area - exact dimensions of the video output -->
      <div
        bind:this={projectViewport}
        class={cn('group/viewport absolute z-2 origin-center rounded-2xl', {
          'relative! shadow-none!': isRecording
        })}
        style:transform-style="preserve-3d"
        style:width="{projectStore.state.width}px"
        style:height="{projectStore.state.height}px"
        style:left={isRecording ? 'auto' : `-${projectStore.state.width / 2}px`}
        style:top={isRecording ? 'auto' : `-${projectStore.state.height / 2}px`}
        style:transform={isRecording ? `scale(${recordingScale})` : undefined}
        style:perspective="1000px"
        style:perspective-origin="center center"
        style:isolation="isolate"
        style:background-color={getBackgroundColor(projectStore.state.background)}
        style:background-image={getBackgroundImage(projectStore.state.background)}
        style:cursor={projectStore.isRecording ? 'none' : undefined}
      >
        <!-- Layers -->
        <div
          class="absolute inset-0"
          style:transform-style="preserve-3d"
          style:pointer-events={projectStore.isRecording ? 'none' : undefined}
        >
          <LayersRenderer
            layers={projectStore.state.layers}
            currentTime={projectStore.currentTime}
            duration={projectStore.state.duration}
            isPlaying={projectStore.isPlaying}
            selectedLayerId={projectStore.selectedLayerId}
            disableSelection={projectStore.isRecording}
            getCachedFrame={projectStore.isRecording ? projectStore.getCachedFrame : undefined}
            projectFont={projectStore.state.fontFamily}
            globalVolume={projectStore.globalVolume}
          />
        </div>

        <Watermark />

        {#if !isRecording}
          <CanvasPlayerControls {projectStore} {canvasContainer} />
        {/if}
      </div>
    </div>
  </div>
  {#if !isRecording}
    <div
      class="opacity-100 transition-opacity duration-200 group-has-[.group\/viewport:hover]/canvas:opacity-0"
    >
      <CanvasControls />
    </div>
  {/if}
</div>

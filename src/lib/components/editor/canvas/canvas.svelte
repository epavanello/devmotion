<script lang="ts">
  import { onMount } from 'svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import CanvasControls from './canvas-controls.svelte';
  import PlaybackControls from './playback-controls.svelte';
  import LayersRenderer from './layers-renderer.svelte';
  import Watermark from './watermark.svelte';
  import { getBackgroundColor, getBackgroundImage } from '$lib/schemas/background';

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

<div class="relative h-full w-full overflow-hidden bg-white" class:recording-mode={isRecording}>
  <!-- Canvas viewport -->
  <div
    bind:this={canvasContainer}
    class="canvas-viewport absolute inset-0"
    style:cursor={isPanning ? 'grabbing' : 'default'}
    onmousedown={onCanvasMouseDown}
    onmousemove={onCanvasMouseMove}
    onmouseup={onCanvasMouseUp}
    onwheel={onCanvasWheel}
    role="presentation"
  >
    <!-- Viewport transform container (pan and zoom) -->
    <div
      class="viewport-content absolute top-1/2 left-1/2 origin-center"
      style:transform={isRecording ? 'none' : viewportTransform}
      style:transform-style="preserve-3d"
    >
      <!-- Dark overlay with transparent hole around canvas view -->
      {#if !isRecording}
        <div
          class="canvas-overlay absolute"
          style:width="20000px"
          style:height="20000px"
          style:left="-10000px"
          style:top="-10000px"
          style:background-color="rgba(127, 127, 127, 0.6)"
          style:clip-path={`polygon(evenodd, 0 0, 0 20000px, 20000px 20000px, 20000px 0, 0 0, ${10000 - projectStore.state.width / 2}px ${10000 - projectStore.state.height / 2}px, ${10000 - projectStore.state.width / 2}px ${10000 + projectStore.state.height / 2}px, ${10000 + projectStore.state.width / 2}px ${10000 + projectStore.state.height / 2}px, ${10000 + projectStore.state.width / 2}px ${10000 - projectStore.state.height / 2}px, ${10000 - projectStore.state.width / 2}px ${10000 - projectStore.state.height / 2}px)`}
          style:pointer-events="none"
        ></div>
      {/if}

      <!-- Project viewport area - exact dimensions of the video output -->
      <div
        bind:this={projectViewport}
        class="project-viewport"
        class:project-viewport-recording={isRecording}
        style:width="{projectStore.state.width}px"
        style:height="{projectStore.state.height}px"
        style:left={isRecording ? 'auto' : `-${projectStore.state.width / 2}px`}
        style:top={isRecording ? 'auto' : `-${projectStore.state.height / 2}px`}
        style:transform={isRecording ? `scale(${recordingScale})` : undefined}
        style:perspective="1000px"
        style:perspective-origin="center center"
        style:transform-style="preserve-3d"
        style:isolation="isolate"
        style:background-color={getBackgroundColor(projectStore.state.background)}
        style:background-image={getBackgroundImage(projectStore.state.background)}
        style:cursor={projectStore.isRecording ? 'none' : undefined}
      >
        <!-- Layers -->
        <div
          class="layers-container absolute inset-0"
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
          />
        </div>

        <Watermark />
      </div>
    </div>
  </div>

  {#if !isRecording}
    <PlaybackControls />
    <CanvasControls />
  {/if}
</div>

<style>
  .canvas-viewport {
    transform-style: preserve-3d;
  }

  .viewport-content {
    transform-style: preserve-3d;
  }

  .canvas-overlay {
    pointer-events: none;
    z-index: 3;
  }

  .project-viewport {
    position: absolute;
    transform-style: preserve-3d;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    z-index: 2;
  }

  .layers-container {
    transform-style: preserve-3d;
  }

  /* Recording mode: fullscreen with black background */
  .recording-mode {
    position: fixed !important;
    inset: 0 !important;
    z-index: 9999 !important;
    background: black !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .recording-mode .canvas-viewport {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .recording-mode .viewport-content {
    position: relative;
    top: auto;
    left: auto;
  }

  .project-viewport-recording {
    position: relative !important;
    box-shadow: none !important;
    transform-origin: center center;
  }
</style>

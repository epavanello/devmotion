<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import {
    getAnimatedTransform,
    getAnimatedStyle,
    getAnimatedProps
  } from '$lib/engine/interpolation';
  import CanvasControls from './canvas-controls.svelte';
  import PlaybackControls from './playback-controls.svelte';
  import LayerWrapper from '$lib/layers/LayerWrapper.svelte';
  import { getLayerComponent, getLayerSchema } from '$lib/layers/registry';
  import { extractPropertyMetadata } from '$lib/layers/base';
  import type { Layer, Transform } from '$lib/types/animation';

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

      const newTime = projectStore.project.currentTime + deltaTime;

      if (newTime >= projectStore.project.duration) {
        // When recording, stop at the end instead of looping
        if (projectStore.isRecording) {
          projectStore.setCurrentTime(projectStore.project.duration);
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

    // Middle mouse, right mouse, or Shift+drag for panning
    if (event.button === 1 || event.button === 2 || (event.button === 0 && event.shiftKey)) {
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

  function onCanvasContextMenu(event: MouseEvent) {
    // Prevent context menu when panning or when the user might be about to pan
    event.preventDefault();
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

  /**
   * Get animated transform for a layer, merging base transform with animated values
   */
  function getLayerTransform(layer: Layer): Transform {
    const animatedTransform = getAnimatedTransform(
      layer.keyframes,
      projectStore.project.currentTime
    );

    return {
      x: animatedTransform.position?.x ?? layer.transform.x,
      y: animatedTransform.position?.y ?? layer.transform.y,
      z: animatedTransform.position?.z ?? layer.transform.z,
      rotationX: animatedTransform.rotation?.x ?? layer.transform.rotationX,
      rotationY: animatedTransform.rotation?.y ?? layer.transform.rotationY,
      rotationZ: animatedTransform.rotation?.z ?? layer.transform.rotationZ,
      scaleX: animatedTransform.scale?.x ?? layer.transform.scaleX,
      scaleY: animatedTransform.scale?.y ?? layer.transform.scaleY,
      scaleZ: animatedTransform.scale?.z ?? layer.transform.scaleZ
    };
  }

  /**
   * Get animated style for a layer
   */
  function getLayerStyle(layer: Layer) {
    const animatedStyle = getAnimatedStyle(layer.keyframes, projectStore.project.currentTime);

    return {
      opacity: animatedStyle.opacity ?? layer.style.opacity
    };
  }

  /**
   * Get animated props for a layer, merging base props with animated values
   */
  function getLayerProps(layer: Layer): Record<string, unknown> {
    const schema = getLayerSchema(layer.type);
    const propsMetadata = extractPropertyMetadata(schema);
    return getAnimatedProps(
      layer.keyframes,
      layer.props,
      propsMetadata,
      projectStore.project.currentTime
    );
  }

  // Calculate scale factor to fit project dimensions in viewport
  // This maintains aspect ratio and leaves some padding
  const VIEWPORT_PADDING = 0.9; // Use 90% of available space for padding
  const projectAspectRatio = $derived(projectStore.project.width / projectStore.project.height);
  const containerAspectRatio = $derived(containerWidth / containerHeight);

  const fitScale = $derived(
    containerAspectRatio > projectAspectRatio
      ? (containerHeight * VIEWPORT_PADDING) / projectStore.project.height
      : (containerWidth * VIEWPORT_PADDING) / projectStore.project.width
  );

  // Calculate viewport transform for pan, zoom, and fit scale
  const viewportTransform = $derived(
    `translate(${projectStore.viewport.pan.x}px, ${projectStore.viewport.pan.y}px) scale(${fitScale * projectStore.viewport.zoom})`
  );

  // Calculate scale for recording mode to fit viewport while maintaining aspect ratio
  const recordingScale = $derived(() => {
    if (typeof window === 'undefined') return 1;
    const scaleX = window.innerWidth / projectStore.project.width;
    const scaleY = window.innerHeight / projectStore.project.height;
    return Math.min(1, scaleX, scaleY); // Never scale up, only down
  });
</script>

<div class="relative h-full w-full overflow-hidden bg-gray-700" class:recording-mode={isRecording}>
  <!-- Canvas viewport -->
  <div
    bind:this={canvasContainer}
    class="canvas-viewport absolute inset-0"
    style:cursor={projectStore.isRecording ? 'none' : isPanning ? 'grabbing' : 'default'}
    onmousedown={onCanvasMouseDown}
    onmousemove={onCanvasMouseMove}
    onmouseup={onCanvasMouseUp}
    oncontextmenu={onCanvasContextMenu}
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
          style:background-color="rgba(0, 0, 0, 0.6)"
          style:clip-path={`polygon(evenodd, 0 0, 0 20000px, 20000px 20000px, 20000px 0, 0 0, ${10000 - projectStore.project.width / 2}px ${10000 - projectStore.project.height / 2}px, ${10000 - projectStore.project.width / 2}px ${10000 + projectStore.project.height / 2}px, ${10000 + projectStore.project.width / 2}px ${10000 + projectStore.project.height / 2}px, ${10000 + projectStore.project.width / 2}px ${10000 - projectStore.project.height / 2}px, ${10000 - projectStore.project.width / 2}px ${10000 - projectStore.project.height / 2}px)`}
          style:pointer-events="none"
        ></div>
      {/if}

      <!-- Project viewport area - exact dimensions of the video output -->
      <div
        bind:this={projectViewport}
        class="project-viewport"
        class:project-viewport-recording={isRecording}
        style:width="{projectStore.project.width}px"
        style:height="{projectStore.project.height}px"
        style:left={isRecording ? 'auto' : `-${projectStore.project.width / 2}px`}
        style:top={isRecording ? 'auto' : `-${projectStore.project.height / 2}px`}
        style:transform={isRecording ? `scale(${recordingScale()})` : undefined}
        style:perspective="1000px"
        style:perspective-origin="center center"
        style:transform-style="preserve-3d"
        style:isolation="isolate"
        style:background-color={projectStore.project.backgroundColor}
      >
        <!-- Layers -->
        <div class="layers-container absolute inset-0" style:transform-style="preserve-3d">
          {#each projectStore.project.layers as layer (layer.id)}
            {@const transform = getLayerTransform(layer)}
            {@const style = getLayerStyle(layer)}
            {@const props = getLayerProps(layer)}
            {@const component = getLayerComponent(layer.type)}
            {@const isSelected = projectStore.selectedLayerId === layer.id}

            <LayerWrapper
              id={layer.id}
              name={layer.name}
              visible={layer.visible}
              locked={layer.locked}
              selected={isSelected && !projectStore.isRecording}
              {transform}
              {style}
              {component}
              customProps={props}
            />
          {/each}
        </div>
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

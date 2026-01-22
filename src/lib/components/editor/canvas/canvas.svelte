<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { getAnimatedTransform, getAnimatedStyle } from '$lib/engine/interpolation';
  import CanvasControls from './canvas-controls.svelte';
  import LayerWrapper from '$lib/layers/LayerWrapper.svelte';
  import { getLayerComponent } from '$lib/layers/registry';
  import type { Transform } from '$lib/types/animation';

  let canvasContainer: HTMLDivElement | undefined = $state();

  let {
    projectViewport = $bindable()
  }: {
    projectViewport: HTMLDivElement | undefined;
  } = $props();

  let animationFrameId: number;
  let isPanning = $state(false);
  let panStart = $state({ x: 0, y: 0 });
  let containerWidth = $state(1);
  let containerHeight = $state(1);
  let resizeObserver: ResizeObserver;

  onMount(() => {
    animate();

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

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Update scene if playing
    if (projectStore.isPlaying) {
      const deltaTime = 1 / projectStore.project.fps;
      const newTime = projectStore.project.currentTime + deltaTime;

      if (newTime >= projectStore.project.duration) {
        projectStore.setCurrentTime(0);
      } else {
        projectStore.setCurrentTime(newTime);
      }
    }
  }

  /**
   * Handle pan and zoom interactions on the canvas
   */
  function onCanvasMouseDown(event: MouseEvent) {
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
  function getLayerTransform(layer: any): Transform {
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
  function getLayerStyle(layer: any) {
    const animatedStyle = getAnimatedStyle(layer.keyframes, projectStore.project.currentTime);

    return {
      opacity: animatedStyle.opacity ?? layer.style.opacity
    };
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

  // Grid size based on project settings
  const gridSize = $derived(projectStore.viewport.gridSize);
</script>

<div class="relative h-full w-full overflow-hidden bg-gray-900">
  <!-- Canvas viewport with 3D perspective -->
  <div
    bind:this={canvasContainer}
    class="canvas-viewport absolute inset-0"
    style:perspective="1000px"
    style:perspective-origin="center center"
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
      style:transform={viewportTransform}
      style:transform-style="preserve-3d"
    >
      <!-- Project viewport area - exact dimensions of the video output -->
      <div
        bind:this={projectViewport}
        class="project-viewport absolute"
        style:width="{projectStore.project.width}px"
        style:height="{projectStore.project.height}px"
        style:left="-{projectStore.project.width / 2}px"
        style:top="-{projectStore.project.height / 2}px"
        style:background-color={projectStore.project.backgroundColor}
        style:transform-style="preserve-3d"
        style:isolation="isolate"
      >
        <!-- Grid -->
        {#if projectStore.viewport.showGrid}
          <div
            class="absolute inset-0"
            style:background-image="linear-gradient(#444 1px, transparent 1px),
            linear-gradient(90deg, #444 1px, transparent 1px)"
            style:background-size="{gridSize}px {gridSize}px"
            style:opacity="0.3"
            style:pointer-events="none"
          ></div>
        {/if}

        <!-- Layers -->
        <div class="layers-container absolute inset-0" style:transform-style="preserve-3d">
          {#each projectStore.project.layers as layer (layer.id)}
            {@const transform = getLayerTransform(layer)}
            {@const style = getLayerStyle(layer)}
            {@const component = getLayerComponent(layer.type)}
            {@const isSelected = projectStore.selectedLayerId === layer.id}

            <LayerWrapper
              id={layer.id}
              name={layer.name}
              visible={layer.visible}
              locked={layer.locked}
              selected={isSelected}
              {transform}
              {style}
              {component}
              customProps={layer.props}
            />
          {/each}
        </div>
      </div>
    </div>
  </div>

  <CanvasControls />
</div>

<style>
  .canvas-viewport {
    transform-style: preserve-3d;
  }

  .viewport-content {
    transform-style: preserve-3d;
  }

  .project-viewport {
    transform-style: preserve-3d;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .layers-container {
    transform-style: preserve-3d;
  }
</style>

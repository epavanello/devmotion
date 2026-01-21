<script lang="ts" generics="T extends Record<string, any> = {}">
  import { generateTransformCSS, type BaseLayerProps } from './base';
  import { projectStore } from '$lib/stores/project.svelte';
  import { getAnimatedTransform } from '$lib/engine/interpolation';
  import { nanoid } from 'nanoid';
  import type { Component } from 'svelte';

  interface Props extends BaseLayerProps {
    /**
     * The layer-specific component to render
     */
    component: Component<T>;

    /**
     * Custom props to pass to the layer component
     */
    customProps: T;

    /**
     * Whether this layer is selected
     */
    selected?: boolean;
  }

  let { id, transform, style, visible, locked, component: C, customProps, selected = false }: Props = $props();

  const transformCSS = $derived(generateTransformCSS(transform));

  // Drag state
  let isDragging = $state(false);
  let dragStart = $state({ x: 0, y: 0 });

  /**
   * Convert screen coordinates to canvas coordinates accounting for viewport zoom and pan
   */
  function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    // Find the viewport-content element to get its transform
    const viewportContent = document.querySelector('.viewport-content');
    if (!viewportContent) return { x: 0, y: 0 };

    const rect = viewportContent.getBoundingClientRect();
    const viewport = projectStore.viewport;

    // Position relative to viewport-content
    const relX = screenX - rect.left;
    const relY = screenY - rect.top;

    // Account for zoom - convert back to canvas coordinates
    const canvasX = relX / viewport.zoom;
    const canvasY = relY / viewport.zoom;

    // Canvas coordinates with (0,0) at center of canvas
    const centerOffsetX = projectStore.project.width / 2;
    const centerOffsetY = projectStore.project.height / 2;

    return {
      x: canvasX - centerOffsetX,
      y: canvasY - centerOffsetY
    };
  }

  function onMouseDown(event: MouseEvent) {
    if (locked || event.button !== 0) return;

    event.stopPropagation();

    // Select this layer
    projectStore.selectedLayerId = id;

    // Start dragging
    isDragging = true;
    const canvasPos = screenToCanvas(event.clientX, event.clientY);
    dragStart = canvasPos;

    // Pause playback when starting to drag
    if (projectStore.isPlaying) {
      projectStore.pause();
    }

    // Add global listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    const canvasPos = screenToCanvas(event.clientX, event.clientY);
    const layer = projectStore.project.layers.find((l) => l.id === id);

    if (layer) {
      const movementX = canvasPos.x - dragStart.x;
      const movementY = canvasPos.y - dragStart.y;

      const currentTime = projectStore.project.currentTime;

      // Check if there are ANY keyframes for position.x or position.y
      const hasXKeyframes = layer.keyframes.some((k) => k.property === 'position.x');
      const hasYKeyframes = layer.keyframes.some((k) => k.property === 'position.y');

      // Get current animated values using the interpolation engine
      const animatedTransform = getAnimatedTransform(layer.keyframes, currentTime);
      const currentX = animatedTransform.position.x ?? layer.transform.x;
      const currentY = animatedTransform.position.y ?? layer.transform.y;

      // Find keyframes at exact current time
      const xKeyframeAtTime = layer.keyframes.find(
        (k) => k.property === 'position.x' && k.time === currentTime
      );
      const yKeyframeAtTime = layer.keyframes.find(
        (k) => k.property === 'position.y' && k.time === currentTime
      );

      // Handle X movement
      if (hasXKeyframes) {
        // Property is animated - work with keyframes
        if (xKeyframeAtTime) {
          // Update existing keyframe at current time
          projectStore.updateKeyframe(id, xKeyframeAtTime.id, {
            value: currentX + movementX
          });
        } else {
          // Create new keyframe at current time with current animated value
          projectStore.addKeyframe(id, {
            id: nanoid(),
            time: currentTime,
            property: 'position.x',
            value: currentX + movementX,
            easing: { type: 'linear' }
          });
        }
      }

      // Handle Y movement
      if (hasYKeyframes) {
        // Property is animated - work with keyframes
        if (yKeyframeAtTime) {
          // Update existing keyframe at current time
          projectStore.updateKeyframe(id, yKeyframeAtTime.id, {
            value: currentY + movementY
          });
        } else {
          // Create new keyframe at current time with current animated value
          projectStore.addKeyframe(id, {
            id: nanoid(),
            time: currentTime,
            property: 'position.y',
            value: currentY + movementY,
            easing: { type: 'linear' }
          });
        }
      }

      // Update base transform if either property is not animated
      if (!hasXKeyframes || !hasYKeyframes) {
        const newTransform = {
          ...layer.transform,
          x: hasXKeyframes ? layer.transform.x : layer.transform.x + movementX,
          y: hasYKeyframes ? layer.transform.y : layer.transform.y + movementY
        };
        projectStore.updateLayer(id, { transform: newTransform });
      }

      // Update drag start for next movement
      dragStart = canvasPos;
    }
  }

  function onMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }
</script>

{#if visible}
  <div
    class="layer-wrapper absolute left-0 top-0"
    class:selected
    class:locked
    data-layer-id={id}
    style:transform={transformCSS}
    style:opacity={style.opacity}
    style:transform-style="preserve-3d"
    style:cursor={locked ? 'not-allowed' : 'move'}
    onmousedown={onMouseDown}
    role="button"
    tabindex="0"
  >
    <C {...customProps} />
  </div>
{/if}

<style>
  .layer-wrapper {
    user-select: none;
  }

  .layer-wrapper.selected {
    outline: 2px solid rgb(34, 197, 94);
    outline-offset: 0px;
  }

  .layer-wrapper.locked {
    opacity: 0.6;
    pointer-events: auto;
  }
</style>

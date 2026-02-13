<script lang="ts">
  import { cn } from '$lib/utils';
  import { Move3d } from '@lucide/svelte';

  interface Props {
    valueX: number;
    valueY: number;
    valueZ: number;
    stepXY?: number;
    stepZ?: number;
    invertY?: boolean;
    onchangeX: (value: number) => void;
    onchangeY: (value: number) => void;
    onchangeZ: (value: number) => void;
  }

  let {
    valueX,
    valueY,
    valueZ,
    stepXY = 1,
    stepZ = 1,
    invertY = false,
    onchangeX,
    onchangeY,
    onchangeZ
  }: Props = $props();

  let isDragging = $state(false);
  let startX = $state(0);
  let startY = $state(0);
  let startValueX = $state(0);
  let startValueY = $state(0);
  let startValueZ = $state(0);
  let isZMode = $state(false);

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    startDrag(e.clientX, e.clientY, e.metaKey || e.ctrlKey);
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    // Only handle single touch
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY, false);
    }
  }

  function startDrag(clientX: number, clientY: number, forceZMode: boolean) {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    startValueX = valueX;
    startValueY = valueY;
    startValueZ = valueZ;
    isZMode = forceZMode;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' || e.metaKey || e.ctrlKey) {
      isZMode = true;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space' && !e.metaKey && !e.ctrlKey) {
      isZMode = false;
    }
    if (!e.metaKey && !e.ctrlKey && e.code !== 'Space') {
      isZMode = false;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    updateValue(e.clientX, e.clientY, e.shiftKey, e.altKey, e.metaKey || e.ctrlKey);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging) return;
    e.preventDefault();
    // Only handle single touch
    if (e.touches.length === 1) {
      updateValue(e.touches[0].clientX, e.touches[0].clientY, e.shiftKey, e.altKey, false);
    }
  }

  function updateValue(
    clientX: number,
    clientY: number,
    shiftKey: boolean,
    altKey: boolean,
    forceZMode: boolean
  ) {
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    // Determine multiplier based on modifiers
    let multiplier = 1;
    if (shiftKey) {
      // Fine/precision mode - 0.1x step
      multiplier = 0.1;
    } else if (altKey) {
      // Coarse mode - 10x step
      multiplier = 10;
    }

    const sensitivity = 0.5;

    // Check if Z mode (space/cmd/ctrl held, or forceZMode from touch)
    const inZMode = isZMode || forceZMode;

    if (inZMode) {
      // Z mode: vertical movement controls Z
      const changeZ = -deltaY * sensitivity * stepZ * multiplier;
      const newZ = startValueZ + changeZ;
      const precisionZ = stepZ < 1 ? Math.ceil(-Math.log10(stepZ)) + 1 : 1;
      const roundedZ = Math.round(newZ * Math.pow(10, precisionZ)) / Math.pow(10, precisionZ);
      onchangeZ(roundedZ);
    } else {
      // Normal mode: X and Y
      const yDirection = invertY ? -1 : 1;
      const changeX = deltaX * sensitivity * stepXY * multiplier;
      const changeY = deltaY * yDirection * sensitivity * stepXY * multiplier;

      const newX = startValueX + changeX;
      const newY = startValueY + changeY;

      const precisionXY = stepXY < 1 ? Math.ceil(-Math.log10(stepXY)) + 1 : 1;
      const roundedX = Math.round(newX * Math.pow(10, precisionXY)) / Math.pow(10, precisionXY);
      const roundedY = Math.round(newY * Math.pow(10, precisionXY)) / Math.pow(10, precisionXY);

      onchangeX(roundedX);
      onchangeY(roundedY);
    }
  }

  function handleMouseUp() {
    endDrag();
  }

  function handleTouchEnd() {
    endDrag();
  }

  function endDrag() {
    isDragging = false;
    isZMode = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
</script>

<button
  type="button"
  class={cn(
    'scrub-xyz flex items-center justify-center rounded p-1 transition-colors select-none',
    {
      'bg-primary/20 text-primary': isDragging,
      'hover:bg-muted/50': !isDragging
    }
  )}
  onmousedown={handleMouseDown}
  ontouchstart={handleTouchStart}
  title="Drag: X/Y, Cmd/Ctrl+drag: Z, Shift: fine, Alt: coarse"
>
  <Move3d
    class={cn('size-3.5 opacity-50 transition-opacity hover:opacity-80', {
      'opacity-100': isDragging
    })}
  />
</button>

<style>
  .scrub-xyz {
    cursor: move;
  }
</style>

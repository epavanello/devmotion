<script lang="ts">
  interface Props {
    currentTime: number;
    pixelsPerSecond: number;
    onDragStart: () => void;
  }

  let { currentTime, pixelsPerSecond, onDragStart }: Props = $props();

  const position = $derived(currentTime * pixelsPerSecond + 200); // 200px offset for layer names
</script>

<div class="pointer-events-none absolute top-0 bottom-0 z-20" style="left: {position}px">
  <!-- Playhead handle -->
  <div
    class="pointer-events-auto absolute top-0 h-2 w-3 -translate-x-1/2 cursor-grab bg-red-500 active:cursor-grabbing"
    style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%)"
    onmousedown={onDragStart}
    role="button"
    tabindex="0"
  ></div>

  <!-- Playhead line -->
  <div class="h-full w-0.5 -translate-x-1/2 bg-red-500"></div>
</div>

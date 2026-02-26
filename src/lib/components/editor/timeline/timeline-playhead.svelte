<script lang="ts">
  interface Props {
    currentTime: number;
    pixelsPerSecond: number;
    onDragStart: () => void;
  }

  let { currentTime, pixelsPerSecond, onDragStart }: Props = $props();

  const position = $derived(currentTime * pixelsPerSecond + 240); // 240px offset for layer names

  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    onDragStart();
  }
</script>

<!-- Playhead line (minimal, clean design) -->
<div
  class="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-500"
  style="left: {position}px"
>
  <!-- Draggable handle at top -->
  <div
    class="pointer-events-auto absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 cursor-grabbing"
    onmousedown={handleMouseDown}
    role="button"
    tabindex="-1"
  >
    <!-- Triangle handle -->
    <svg viewBox="0 0 12 12" class="h-full w-full drop-shadow-sm">
      <path d="M 6 0 L 12 6 L 6 12 L 0 6 Z" fill="rgb(239 68 68)" />
    </svg>
  </div>

  <!-- Time label -->
  <div
    class="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
  >
    {currentTime.toFixed(2)}s
  </div>
</div>

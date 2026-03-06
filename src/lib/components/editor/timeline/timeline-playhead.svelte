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

<!-- Playhead with enhanced visual design -->
<div
  class="pointer-events-none absolute top-11 bottom-0 w-0.5"
  style="left: {position}px; background: linear-gradient(180deg, rgb(239 68 68) 0%, rgb(239 68 68 / 0.8) 100%); box-shadow: 0 0 4px rgb(239 68 68 / 0.5)"
>
  <!-- Draggable handle at top -->
  <div
    class="pointer-events-auto absolute -top-0.5 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab transition-transform hover:scale-110 active:scale-95 active:cursor-grabbing"
    onmousedown={handleMouseDown}
    role="button"
    tabindex="-1"
  >
    <!-- Simple arrow pointing down -->
    <svg viewBox="0 0 16 16" class="h-full w-full">
      <defs>
        <filter id="playhead-shadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1"
            flood-color="rgb(127 29 29)"
            flood-opacity="0.3"
          />
        </filter>
      </defs>
      <path
        d="M 8 1 L 14 7 L 9 7 L 9 15 L 7 15 L 7 7 L 2 7 Z"
        fill="rgb(239 68 68)"
        filter="url(#playhead-shadow)"
      />
    </svg>
  </div>
</div>

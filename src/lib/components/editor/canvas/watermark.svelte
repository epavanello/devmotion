<script lang="ts">
  import { Fullscreen } from '@lucide/svelte';
</script>

<!-- Watermark - Always visible, unremovable -->
<div
  class="pointer-events-none absolute right-3 bottom-3 z-9999 flex items-center gap-2 rounded-md bg-black/50 px-3 py-2 opacity-60 backdrop-blur-sm select-none"
>
  <div
    class="flex size-6 shrink-0 items-center justify-center rounded bg-linear-to-br from-blue-500 to-purple-600 text-white"
  >
    <Fullscreen size={14} strokeWidth={2.5} />
  </div>
  <span class="text-sm font-semibold whitespace-nowrap text-white">DevMotion</span>
</div>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { Fullscreen } from '@lucide/svelte';
</script>

<a class="flex items-center gap-2 pl-2" href={resolve('/')}>
  <div
    class="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600"
  >
    <Fullscreen class="size-5 text-white" />
  </div>
  <span class="font-bold text-foreground">DevMotion</span>
</a>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { ZoomIn, ZoomOut, Maximize } from 'lucide-svelte';
  import { projectStore } from '$lib/stores/project.svelte';

  function zoomIn() {
    projectStore.setZoom(projectStore.viewport.zoom * 0.8);
  }

  function zoomOut() {
    projectStore.setZoom(projectStore.viewport.zoom * 1.25);
  }

  function resetView() {
    projectStore.setZoom(1);
    projectStore.setPan(0, 0);
  }

  const zoomPercentage = $derived(Math.round((1 / projectStore.viewport.zoom) * 100));
</script>

<div
  class="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-lg"
>
  <Button variant="ghost" size="sm" onclick={zoomIn}>
    <ZoomIn class="h-4 w-4" />
  </Button>

  <span class="min-w-[3rem] text-center font-mono text-sm">
    {zoomPercentage}%
  </span>

  <Button variant="ghost" size="sm" onclick={zoomOut}>
    <ZoomOut class="h-4 w-4" />
  </Button>

  <Button variant="ghost" size="sm" onclick={resetView}>
    <Maximize class="h-4 w-4" />
  </Button>
</div>

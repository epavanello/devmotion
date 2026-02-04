<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Play, Pause, SkipBack } from '@lucide/svelte';
  import { projectStore } from '$lib/stores/project.svelte';

  function togglePlayback() {
    if (projectStore.isPlaying) {
      projectStore.pause();
    } else {
      projectStore.play();
    }
  }

  function resetPlayhead() {
    projectStore.setCurrentTime(0);
    projectStore.pause();
  }
</script>

<div
  class="absolute bottom-4 left-4 flex items-center rounded-lg border bg-background/95 p-2 shadow-lg"
>
  <Button variant="ghost" size="sm" onclick={resetPlayhead} disabled={projectStore.isRecording}>
    <SkipBack />
  </Button>

  <Button variant="ghost" size="sm" onclick={togglePlayback} disabled={projectStore.isRecording}>
    {#if projectStore.isPlaying}
      <Pause />
    {:else}
      <Play />
    {/if}
  </Button>
</div>

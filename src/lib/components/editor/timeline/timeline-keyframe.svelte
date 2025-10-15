<script lang="ts">
  import type { Keyframe } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';

  interface Props {
    keyframe: Keyframe;
    pixelsPerSecond: number;
    layerId: string;
  }

  let { keyframe, pixelsPerSecond, layerId }: Props = $props();

  const position = $derived(keyframe.time * pixelsPerSecond);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    projectStore.setCurrentTime(keyframe.time);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this keyframe?')) {
      projectStore.removeKeyframe(layerId, keyframe.id);
    }
  }
</script>

<div
  class="absolute top-1/2 h-3 w-3 -translate-y-1/2 cursor-pointer rounded-sm bg-primary transition-transform hover:scale-125"
  style="left: {position}px"
  onclick={handleClick}
  oncontextmenu={handleDelete}
  role="button"
  tabindex="0"
  title={`${keyframe.property} at ${keyframe.time}s`}
></div>

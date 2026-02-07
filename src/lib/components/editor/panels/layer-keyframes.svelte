<script lang="ts">
  import type { Layer } from '$lib/types/animation';
  import KeyframeCard from '../keyframe-card.svelte';

  let { layer }: { layer: Layer } = $props();

  const sortedKeyframes = $derived.by(() => {
    return [...layer.keyframes].sort((a, b) => a.time - b.time);
  });
</script>

<div class="space-y-2">
  {#each sortedKeyframes as keyframe (keyframe.id)}
    <KeyframeCard {keyframe} layerId={layer.id} />
  {/each}
</div>

<script lang="ts">
  import type { Layer, Keyframe } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import TimelineKeyframe from './timeline-keyframe.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';

  interface Props {
    layer: Layer;
    pixelsPerSecond: number;
  }

  let { layer, pixelsPerSecond }: Props = $props();

  const isSelected = $derived(projectStore.selectedLayerId === layer.id);

  // Group keyframes by timestamp
  const keyframeGroups = $derived(() => {
    const groups = new Map<number, Keyframe[]>();
    for (const keyframe of layer.keyframes) {
      const existing = groups.get(keyframe.time);
      if (existing) {
        existing.push(keyframe);
      } else {
        groups.set(keyframe.time, [keyframe]);
      }
    }
    return Array.from(groups.entries()).map(([time, keyframes]) => ({
      time,
      keyframes
    }));
  });

  function selectLayer() {
    projectStore.selectedLayerId = layer.id;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectLayer();
    }
  }
</script>

<div
  class="flex border-b transition-colors hover:bg-muted/50"
  class:bg-muted={isSelected}
  onclick={selectLayer}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <!-- Layer name -->
  <div class="w-[200px] flex-shrink-0 truncate border-r px-3 py-2 text-sm">
    {layer.name}
  </div>

  <!-- Keyframes area -->
  <div class="relative h-12 min-h-[3rem] flex-1">
    <Tooltip.Provider>
      {#each keyframeGroups() as group (group.time)}
        <TimelineKeyframe keyframes={group.keyframes} {pixelsPerSecond} layerId={layer.id} />
      {/each}
    </Tooltip.Provider>
  </div>
</div>

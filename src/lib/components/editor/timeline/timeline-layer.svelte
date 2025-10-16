<script lang="ts">
  import type { Layer } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import TimelineKeyframe from './timeline-keyframe.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';

  interface Props {
    layer: Layer;
    pixelsPerSecond: number;
  }

  let { layer, pixelsPerSecond }: Props = $props();

  const isSelected = $derived(projectStore.selectedLayerId === layer.id);

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
      {#each layer.keyframes as keyframe (keyframe.id)}
        <TimelineKeyframe {keyframe} {pixelsPerSecond} layerId={layer.id} />
      {/each}
    </Tooltip.Provider>
  </div>
</div>

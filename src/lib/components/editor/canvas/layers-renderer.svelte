<script lang="ts">
  import LayerWrapper from '$lib/layers/LayerWrapper.svelte';
  import { getLayerComponent } from '$lib/layers/registry';
  import { getLayerTransform, getLayerStyle, getLayerProps } from '$lib/engine/layer-rendering';
  import type { Layer } from '$lib/types/animation';
  import type { FrameCache } from '$lib/stores/project.svelte';

  let {
    layers,
    currentTime,
    duration,
    isPlaying = false,
    selectedLayerId = null,
    disableSelection = false,
    getCachedFrame
  }: {
    layers: Layer[];
    currentTime: number;
    duration: number;
    isPlaying?: boolean;
    selectedLayerId?: string | null;
    disableSelection?: boolean;
    getCachedFrame?: (time: number) => FrameCache | null;
  } = $props();

  /**
   * Get layer rendering data (transform, style, props)
   * Uses cached data if available, otherwise computes on-demand
   */
  function getLayerRenderData(layer: Layer) {
    // Use cached data if available
    if (getCachedFrame) {
      const cachedFrame = getCachedFrame(currentTime);
      if (cachedFrame?.[layer.id]) {
        return cachedFrame[layer.id];
      }
    }
    // Otherwise compute using shared rendering functions
    return {
      transform: getLayerTransform(layer, currentTime),
      style: getLayerStyle(layer, currentTime),
      customProps: getLayerProps(layer, currentTime)
    };
  }
</script>

<!-- Layers -->
{#each layers as layer (layer.id)}
  {@const enterTime = layer.enterTime ?? 0}
  {@const exitTime = layer.exitTime ?? duration}
  {@const isInTimeRange = currentTime >= enterTime && currentTime <= exitTime}
  <!-- Keep video/image/audio layers rendered even outside time range to ensure media is loaded -->
  {@const mustKeepWarm = layer.type === 'video' || layer.type === 'image' || layer.type === 'audio'}
  {#if isInTimeRange || mustKeepWarm}
    {@const { transform, style, customProps } = getLayerRenderData(layer)}
    {@const component = getLayerComponent(layer.type)}
    {@const isSelected = selectedLayerId === layer.id}
    {@const enhancedProps = {
      ...customProps,
      layer,
      currentTime,
      isPlaying
    }}

    <LayerWrapper
      id={layer.id}
      name={layer.name}
      visible={layer.visible && isInTimeRange}
      locked={layer.locked}
      selected={isSelected && !disableSelection}
      {transform}
      {style}
      {component}
      customProps={enhancedProps}
    />
  {/if}
{/each}

<script lang="ts">
  import LayerWrapper, { type WrappedLayerProps } from '$lib/layers/LayerWrapper.svelte';
  import { getLayerComponent } from '$lib/layers/registry';
  import { getLayerTransform, getLayerStyle, getLayerProps } from '$lib/engine/layer-rendering';
  import { generateFilterCSS, generateTransformCSS } from '$lib/layers/base';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import type { FrameCache } from '$lib/stores/project.svelte';
  import type { GoogleFont } from '$lib/utils/fonts';
  import ApplyFont from '$lib/components/font/apply-font.svelte';

  let {
    layers,
    currentTime,
    projectDuration,
    isPlaying = false,
    selectedLayerId = null,
    disableSelection = false,
    getCachedFrame,
    isServerSideRendering = false,
    projectFont,
    globalVolume = 100
  }: {
    layers: TypedLayer[];
    currentTime: number;
    projectDuration: number;
    isPlaying?: boolean;
    selectedLayerId?: string | null;
    disableSelection?: boolean;
    getCachedFrame?: (time: number) => FrameCache | null;
    isServerSideRendering?: boolean;
    projectFont?: GoogleFont;
    globalVolume?: number;
  } = $props();

  /**
   * Get layer rendering data (transform, style, props)
   * Uses cached data if available, otherwise computes on-demand
   */
  function getLayerRenderData(layer: TypedLayer) {
    // Use cached data if available
    if (getCachedFrame) {
      const cachedFrame = getCachedFrame(currentTime);
      if (cachedFrame?.[layer.id]) {
        return cachedFrame[layer.id];
      }
    }
    // Otherwise compute using shared rendering functions
    return {
      transform: getLayerTransform(layer, currentTime, projectDuration),
      style: getLayerStyle(layer, currentTime, projectDuration),
      customProps: getLayerProps(layer, currentTime)
    };
  }

  /** Top-level layers only (children are rendered inside their group) */
  const topLevelLayers = $derived(layers.filter((l) => !l.parentId));

  /** Get child layers for a given group */
  function getChildLayers(groupId: string): TypedLayer[] {
    return layers.filter((l) => l.parentId === groupId);
  }
</script>

<ApplyFont fontFamily={projectFont}>
  <!-- Top-level layers and groups -->
  {#each topLevelLayers as layer (layer.id)}
    {@const enterTime = layer.enterTime ?? 0}
    {@const exitTime = layer.exitTime ?? projectDuration}
    {@const isInTimeRange = currentTime >= enterTime && currentTime <= exitTime}

    {#if layer.type === 'group'}
      <!-- Group: apply group transform and render children inside -->
      {@const { transform: groupTransform, style: groupStyle } = getLayerRenderData(layer)}
      {@const groupVisible = layer.visible && isInTimeRange}
      {@const groupTransformCSS = generateTransformCSS(groupTransform)}
      {@const groupFilterCSS = generateFilterCSS(groupStyle)}

      <div
        class="layer-group absolute top-1/2 left-1/2"
        data-group-id={layer.id}
        style:transform={groupTransformCSS}
        style:filter={groupFilterCSS}
        style:transform-style="preserve-3d"
        style:opacity={groupStyle.opacity}
        style:visibility={groupVisible ? 'visible' : 'hidden'}
      >
        {#each getChildLayers(layer.id) as child (child.id)}
          {@const childEnter = child.enterTime ?? 0}
          {@const childExit = child.exitTime ?? projectDuration}
          {@const childInRange = currentTime >= childEnter && currentTime <= childExit}
          {@const mustKeepWarm =
            child.type === 'video' || child.type === 'image' || child.type === 'audio'}
          {#if childInRange || mustKeepWarm}
            {@const { transform, style, customProps } = getLayerRenderData(child)}
            {@const component = getLayerComponent(child.type)}
            {@const isSelected = selectedLayerId === child.id}
            {@const enhancedProps = {
              ...customProps,
              layer: child,
              currentTime,
              isPlaying,
              isServerSideRendering,
              globalVolume
            }}

            <LayerWrapper
              id={child.id}
              name={child.name}
              visible={child.visible && childInRange && groupVisible}
              locked={child.locked || layer.locked}
              selected={isSelected && !disableSelection}
              {transform}
              {style}
              {component}
              customProps={enhancedProps}
            />
          {/if}
        {/each}
      </div>
    {:else}
      <!-- Regular layer -->
      {@const mustKeepWarm =
        layer.type === 'video' || layer.type === 'image' || layer.type === 'audio'}
      {#if isInTimeRange || mustKeepWarm}
        {@const { transform, style, customProps } = getLayerRenderData(layer)}
        {@const component = getLayerComponent(layer.type)}
        {@const isSelected = selectedLayerId === layer.id}
        {@const enhancedProps = {
          ...customProps,
          layer,
          currentTime,
          isPlaying,
          isServerSideRendering,
          globalVolume
        } satisfies WrappedLayerProps}

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
    {/if}
  {/each}

  <style>
    .layer-group {
      user-select: none;
    }
  </style>
</ApplyFont>

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { getLayerTransform, getLayerStyle, getLayerProps } from '$lib/engine/layer-rendering';
  import LayerWrapper from '$lib/layers/LayerWrapper.svelte';
  import { getLayerComponent } from '$lib/layers/registry';
  import type { Layer, Project } from '$lib/types/animation';
  import { getBackgroundColor, getBackgroundImage } from '$lib/schemas/background';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Project data from server
  const project: Project = $derived(data.project as Project);

  // Current time controlled externally via window.__DEVMOTION__
  let currentTime = $state(0);

  // Promise that resolves when ready
  let readyResolve: () => void;
  const readyPromise = new Promise<void>((resolve) => {
    readyResolve = resolve;
  });

  /**
   * Get layer rendering data for current time
   */
  function getLayerRenderData(layer: Layer) {
    return {
      transform: getLayerTransform(layer, currentTime),
      style: getLayerStyle(layer, currentTime),
      customProps: getLayerProps(layer, currentTime)
    };
  }

  onMount(() => {
    if (!browser) return;

    // Expose API for Playwright control
    window.__DEVMOTION__ = {
      ready: readyPromise,
      seek: (time: number) => {
        currentTime = Math.max(0, Math.min(time, project.duration));
      },
      getConfig: () => ({
        width: project.width,
        height: project.height,
        duration: project.duration,
        fps: project.fps
      })
    };

    // Mark as ready after a small delay to ensure rendering is complete
    requestAnimationFrame(() => {
      readyResolve();
    });

    return () => {
      delete window.__DEVMOTION__;
    };
  });
</script>

<svelte:head>
  <title>Render - {project.name}</title>
  <style>
    /* Hide scrollbars and ensure no overflow */
    html,
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: black;
    }
  </style>
</svelte:head>

<!-- Render viewport - exact dimensions, no UI -->
<div
  class="render-container"
  style:width="{project.width}px"
  style:height="{project.height}px"
  style:background-color={getBackgroundColor(project.background)}
  style:background-image={getBackgroundImage(project.background)}
>
  <!-- Layers -->
  <div class="layers-container">
    {#each project.layers as layer (layer.id)}
      {@const enterTime = layer.enterTime ?? 0}
      {@const exitTime = layer.exitTime ?? project.duration}
      {@const isInTimeRange = currentTime >= enterTime && currentTime <= exitTime}
      {#if isInTimeRange}
        {@const { transform, style, customProps } = getLayerRenderData(layer)}
        {@const component = getLayerComponent(layer.type)}

        <LayerWrapper
          id={layer.id}
          name={layer.name}
          visible={layer.visible}
          locked={layer.locked}
          selected={false}
          {transform}
          {style}
          {component}
          {customProps}
        />
      {/if}
    {/each}
  </div>
</div>

<style>
  .render-container {
    position: relative;
    transform-style: preserve-3d;
    perspective: 1000px;
    perspective-origin: center center;
    isolation: isolate;
  }

  .layers-container {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    pointer-events: none;
  }
</style>

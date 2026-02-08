<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import LayersRenderer from '$lib/components/editor/canvas/layers-renderer.svelte';
  import Watermark from '$lib/components/editor/canvas/watermark.svelte';
  import type { Project } from '$lib/types/animation';
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

    // Wait for all video/image elements to be loaded before marking as ready
    const waitForMediaLoad = async () => {
      const videoElements = document.querySelectorAll('video');
      const imageElements = document.querySelectorAll('img');

      const videoPromises = Array.from(videoElements).map((video) => {
        if (video.readyState >= 3) return Promise.resolve(); // HAVE_FUTURE_DATA or better
        return new Promise<void>((resolve) => {
          const onReady = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('error', onReady);
            resolve();
          };
          video.addEventListener('loadeddata', onReady);
          video.addEventListener('error', onReady); // Don't block on errors
          // Timeout after 5 seconds to avoid hanging
          setTimeout(resolve, 5000);
        });
      });

      const imagePromises = Array.from(imageElements).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const onReady = () => {
            img.removeEventListener('load', onReady);
            img.removeEventListener('error', onReady);
            resolve();
          };
          img.addEventListener('load', onReady);
          img.addEventListener('error', onReady); // Don't block on errors
          setTimeout(resolve, 5000);
        });
      });

      await Promise.all([...videoPromises, ...imagePromises]);
    };

    // Mark as ready after rendering is complete and media is loaded
    requestAnimationFrame(async () => {
      await waitForMediaLoad();
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
    <LayersRenderer
      layers={project.layers}
      {currentTime}
      duration={project.duration}
      disableSelection={true}
    />
  </div>

  <Watermark />
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

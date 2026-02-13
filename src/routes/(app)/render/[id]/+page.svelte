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
      seekAndWait: async (time: number) => {
        // Update current time
        currentTime = Math.max(0, Math.min(time, project.duration));

        // Wait for Svelte to react and update DOM
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // Wait for all video elements to be ready at the new time
        const videoElements = document.querySelectorAll('video');
        if (videoElements.length > 0) {
          await Promise.all(
            Array.from(videoElements).map(
              (video) =>
                new Promise<void>((resolve) => {
                  const checkReady = () => {
                    // Video is ready when:
                    // - Not seeking (seek operation complete)
                    // - Has current frame data (readyState >= 2 = HAVE_CURRENT_DATA)
                    if (!video.seeking && video.readyState >= 2) {
                      resolve();
                    } else {
                      // Check again next frame
                      requestAnimationFrame(checkReady);
                    }
                  };

                  checkReady();

                  // Safety timeout: don't wait forever (max 1 second)
                  setTimeout(resolve, 1000);
                })
            )
          );
        }

        // Wait one more frame to ensure rendering is complete
        await new Promise((resolve) => requestAnimationFrame(resolve));
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
      isServerSideRendering={true}
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

  :global(#svelte-inspector-host) {
    display: none;
  }
</style>

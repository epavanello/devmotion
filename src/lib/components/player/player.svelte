<script lang="ts">
  import { onMount } from 'svelte';
  import ProjectViewport from './project-viewport.svelte';
  import PlayerControls from './player-controls.svelte';
  import type { Project } from '$lib/schemas/animation';

  let {
    project,
    currentTime = $bindable(0),
    isPlaying = $bindable(false),
    projectViewport = $bindable(),
    autoplay = false,
    showControls = true,
    showWatermark = true,
    globalVolume = $bindable(100),
    selectedLayerId = null,
    onTimeUpdate
  }: {
    project: Project;
    currentTime?: number;
    isPlaying?: boolean;
    projectViewport?: HTMLDivElement | undefined;
    mode?: 'simple' | 'full';
    autoplay?: boolean;
    showControls?: boolean;
    showWatermark?: boolean;
    globalVolume?: number;
    selectedLayerId?: string | null;
    onTimeUpdate?: (time: number) => void;
  } = $props();

  let animationFrameId: number;
  let lastFrameTime: number | null = null;
  let canvasContainer: HTMLDivElement | undefined = $state();
  let containerWidth = $state(1);
  let containerHeight = $state(1);
  let resizeObserver: ResizeObserver;

  onMount(() => {
    if (autoplay) {
      isPlaying = true;
    }

    animationFrameId = requestAnimationFrame(animate);

    // Observe container size changes for auto-scaling
    if (canvasContainer) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          containerWidth = entry.contentRect.width;
          containerHeight = entry.contentRect.height;
        }
      });
      resizeObserver.observe(canvasContainer);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  });

  function animate(timestamp: number) {
    animationFrameId = requestAnimationFrame(animate);

    // Update scene if playing
    if (isPlaying) {
      if (lastFrameTime === null) {
        lastFrameTime = timestamp;
      }

      // Calculate real elapsed time in seconds
      const deltaTime = (timestamp - lastFrameTime) / 1000;
      lastFrameTime = timestamp;

      const newTime = currentTime + deltaTime;

      if (newTime >= project.duration) {
        // Loop back to start
        currentTime = 0;
        onTimeUpdate?.(0);
        lastFrameTime = null;
      } else {
        currentTime = newTime;
        onTimeUpdate?.(newTime);
      }
    } else {
      // Reset timestamp when not playing
      lastFrameTime = null;
    }
  }

  // Calculate fitted dimensions to maintain aspect ratio
  const VIEWPORT_PADDING = 0.95; // Use 95% of available space
  const projectAspectRatio = $derived(project.width / project.height);
  const containerAspectRatio = $derived(containerWidth / containerHeight);

  // Calculate the scale factor
  const fitScale = $derived(
    containerAspectRatio > projectAspectRatio
      ? (containerHeight * VIEWPORT_PADDING) / project.height
      : (containerWidth * VIEWPORT_PADDING) / project.width
  );
</script>

<div class="relative h-full w-full">
  <!-- Canvas viewport -->
  <div
    bind:this={canvasContainer}
    class="absolute inset-0 flex items-center justify-center"
    role="presentation"
  >
    <!-- Wrapper with scaled dimensions to reserve correct space -->
    <div
      class="relative"
      style:width="{project.width * fitScale}px"
      style:height="{project.height * fitScale}px"
    >
      <!-- Project viewport at original size, scaled down from top-left -->
      <ProjectViewport
        bind:projectViewport
        {project}
        {currentTime}
        {isPlaying}
        {globalVolume}
        {selectedLayerId}
        disableSelection={true}
        {showWatermark}
        class="absolute top-0 left-0 cursor-pointer shadow-2xl"
        style="transform: scale({fitScale}); transform-origin: top left;"
      >
        {#if showControls}
          <PlayerControls
            bind:isPlaying
            bind:currentTime
            bind:globalVolume
            duration={project.duration}
            {canvasContainer}
            onTimeChange={onTimeUpdate}
          />
        {/if}
      </ProjectViewport>
    </div>
  </div>
</div>

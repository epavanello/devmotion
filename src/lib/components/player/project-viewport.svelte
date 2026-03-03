<script lang="ts">
  import LayersRenderer from '$lib/components/editor/canvas/layers-renderer.svelte';
  import Watermark from '$lib/components/editor/canvas/watermark.svelte';
  import { getBackgroundColor, getBackgroundImage } from '$lib/schemas/background';
  import { cn } from '$lib/utils';
  import type { Project } from '$lib/schemas/animation';
  import type { FrameCache } from '$lib/stores/project.svelte';

  let {
    project,
    currentTime,
    isPlaying = false,
    globalVolume = 100,
    selectedLayerId = null,
    disableSelection = false,
    getCachedFrame,
    isRecording = false,
    showWatermark = true,
    projectViewport = $bindable(),
    width,
    height,
    class: className,
    style,
    children
  }: {
    project: Project;
    currentTime: number;
    isPlaying?: boolean;
    globalVolume?: number;
    selectedLayerId?: string | null;
    disableSelection?: boolean;
    getCachedFrame?: (time: number) => FrameCache | null;
    isRecording?: boolean;
    showWatermark?: boolean;
    projectViewport?: HTMLDivElement | undefined;
    width?: number;
    height?: number;
    class?: string;
    style?: string;
    children?: import('svelte').Snippet;
  } = $props();

  const viewportWidth = $derived(width ?? project.width);
  const viewportHeight = $derived(height ?? project.height);
</script>

<!-- Project viewport area - exact dimensions of the video output -->
<div
  bind:this={projectViewport}
  class={cn('group/viewport origin-center rounded-2xl', className)}
  {style}
  style:transform-style="preserve-3d"
  style:width="{viewportWidth}px"
  style:height="{viewportHeight}px"
  style:perspective="1000px"
  style:perspective-origin="center center"
  style:isolation="isolate"
  style:background-color={getBackgroundColor(project.background)}
  style:background-image={getBackgroundImage(project.background)}
  style:cursor={isRecording ? 'none' : undefined}
>
  <!-- Layers -->
  <div
    class="absolute inset-0"
    style:transform-style="preserve-3d"
    style:pointer-events={isRecording ? 'none' : undefined}
  >
    <LayersRenderer
      layers={project.layers}
      {currentTime}
      projectDuration={project.duration}
      {isPlaying}
      {selectedLayerId}
      {disableSelection}
      {getCachedFrame}
      projectFont={project.fontFamily}
      {globalVolume}
    />
  </div>

  {#if showWatermark}
    <Watermark />
  {/if}

  <!-- Slot for controls or other overlays -->
  {#if children}
    {@render children()}
  {/if}
</div>

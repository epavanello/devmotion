<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '../base';
  import { Video } from '@lucide/svelte';
  import { calculateCoverDimensions, ASPECT_RATIOS } from '$lib/utils/media';

  /**
   * Schema for Video Layer custom properties
   */
  const schema = z.object({
    src: z
      .string()
      .default('')
      .describe('Video source URL or uploaded file URL')
      .register(fieldRegistry, { widget: 'upload', mediaType: 'video' }),
    width: z
      .number()
      .min(1)
      .max(5000)
      .default(
        () =>
          calculateCoverDimensions(
            projectStore.project.width,
            projectStore.project.height,
            ASPECT_RATIOS.VIDEO_DEFAULT
          ).width
      )
      .describe('Width (px)'),
    height: z
      .number()
      .min(1)
      .max(5000)
      .default(
        () =>
          calculateCoverDimensions(
            projectStore.project.width,
            projectStore.project.height,
            ASPECT_RATIOS.VIDEO_DEFAULT
          ).height
      )
      .describe('Height (px)'),
    objectFit: z
      .enum(['contain', 'cover', 'fill', 'none', 'scale-down'])
      .default('cover')
      .describe('Object fit mode'),
    /** Playback volume (0-1) */
    volume: z.number().min(0).max(1).default(1).describe('Volume (0-1)'),
    /** Whether the video is muted */
    muted: z.boolean().default(false).describe('Mute audio'),
    /** Playback rate */
    playbackRate: z.number().min(0.1).max(4).default(1).describe('Playback rate'),
    /** The storage key if file was uploaded (used for cleanup) */
    fileKey: z
      .string()
      .default('')
      .describe('Storage key (for uploaded files)')
      .register(fieldRegistry, { hidden: true })
  });

  export const meta: LayerMeta = {
    schema,
    type: 'video',
    label: 'Video',
    icon: Video,
    description: 'Embed video files with trimming, volume control, and playback options'
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import type { Layer } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';

  let {
    src,
    width,
    height,
    objectFit,
    volume,
    muted,
    playbackRate,
    layer,
    currentTime,
    isPlaying
  }: Props & {
    layer: Layer;
    currentTime: number;
    isPlaying: boolean;
  } = $props();

  let videoEl: HTMLVideoElement | undefined = $state();

  // Sync the video element's currentTime to the project timeline
  $effect(() => {
    if (!videoEl || !src || !layer) return;

    // Use enterTime passed as prop or fallback to 0
    const enterTime = layer.enterTime ?? 0;
    const relativeTime = currentTime - enterTime;

    // Apply content offset (where to start in the source video)
    const contentOffset = layer.contentOffset ?? 0;
    const videoTime = contentOffset + relativeTime * (playbackRate ?? 1);

    // Clamp to valid range (up to video duration)
    const maxTime = videoEl.duration || Infinity;
    const clampedTime = Math.max(contentOffset, Math.min(videoTime, maxTime));

    if (isFinite(clampedTime) && Math.abs(videoEl.currentTime - clampedTime) > 0.05) {
      videoEl.currentTime = clampedTime;
    }

    // Sync playback state
    if (isPlaying && relativeTime >= 0 && videoTime < maxTime) {
      if (videoEl.paused) videoEl.play().catch(() => {});
    } else {
      if (!videoEl.paused) videoEl.pause();
    }
  });

  // Sync volume
  $effect(() => {
    if (!videoEl) {
      return;
    }
    if (volume) {
      videoEl.volume = volume;
    }
    videoEl.muted = muted;
    if (playbackRate) {
      videoEl.playbackRate = playbackRate;
    }
  });
</script>

<div class="overflow-hidden" style:width="{width}px" style:height="{height}px">
  {#if src}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={videoEl}
      {src}
      class="h-full w-full"
      style:object-fit={objectFit}
      preload="auto"
      playsinline
    ></video>
  {:else}
    <div class="flex h-full w-full items-center justify-center bg-gray-800 text-sm text-gray-400">
      No video source
    </div>
  {/if}
</div>

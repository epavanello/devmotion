<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Video } from '@lucide/svelte';

  /**
   * Schema for Video Layer custom properties
   */
  const schema = z.object({
    src: z.string().default('').describe('Video source URL or uploaded file URL'),
    width: z.number().min(1).max(5000).default(640).describe('Width (px)'),
    height: z.number().min(1).max(5000).default(360).describe('Height (px)'),
    objectFit: z
      .enum(['contain', 'cover', 'fill', 'none', 'scale-down'])
      .default('contain')
      .describe('Object fit mode'),
    /** Start time in the source video (seconds) - for trimming/cutting */
    mediaStartTime: z.number().min(0).default(0).describe('Media start time (s)'),
    /** End time in the source video (seconds) - for trimming/cutting */
    mediaEndTime: z.number().min(0).default(0).describe('Media end time (s) - 0 means full'),
    /** Playback volume (0-1) */
    volume: z.number().min(0).max(1).default(1).describe('Volume (0-1)'),
    /** Whether the video is muted */
    muted: z.boolean().default(false).describe('Mute audio'),
    /** Playback rate */
    playbackRate: z.number().min(0.1).max(4).default(1).describe('Playback rate'),
    /** The storage key if file was uploaded (used for cleanup) */
    fileKey: z.string().default('').describe('Storage key (for uploaded files)'),
    /** Original filename if uploaded */
    fileName: z.string().default('').describe('Original filename'),
    /** Layer ID - passed by LayerWrapper for time sync */
    layerId: z.string().optional().describe('Layer ID (internal)'),
    /** Enter time - passed by LayerWrapper for time sync */
    enterTime: z.number().optional().describe('Enter time (internal)')
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
  import { projectStore } from '$lib/stores/project.svelte';

  let {
    src,
    width,
    height,
    objectFit,
    mediaStartTime,
    mediaEndTime,
    volume,
    muted,
    playbackRate,
    fileKey: _fileKey,
    fileName: _fileName,
    layerId: _layerId,
    enterTime: enterTimeProp
  }: Props = $props();

  let videoEl: HTMLVideoElement | undefined = $state();

  // Sync the video element's currentTime to the project timeline
  $effect(() => {
    if (!videoEl || !src) return;
    const currentTime = projectStore.currentTime;

    // Use enterTime passed as prop or fallback to 0
    const enterTime = enterTimeProp ?? 0;
    const relativeTime = currentTime - enterTime;

    // Apply media start offset (trimming)
    const videoTime = mediaStartTime + relativeTime * playbackRate;

    // Clamp to valid range
    const maxTime = mediaEndTime > 0 ? mediaEndTime : videoEl.duration || Infinity;
    const clampedTime = Math.max(mediaStartTime, Math.min(videoTime, maxTime));

    if (isFinite(clampedTime) && Math.abs(videoEl.currentTime - clampedTime) > 0.05) {
      videoEl.currentTime = clampedTime;
    }

    // Sync playback state
    if (projectStore.isPlaying && relativeTime >= 0) {
      if (videoEl.paused) videoEl.play().catch(() => {});
    } else {
      if (!videoEl.paused) videoEl.pause();
    }
  });

  // Sync volume
  $effect(() => {
    if (!videoEl) return;
    videoEl.volume = volume;
    videoEl.muted = muted;
    videoEl.playbackRate = playbackRate;
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

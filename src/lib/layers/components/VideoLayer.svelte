<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { Video } from '@lucide/svelte';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';
  import GenerateCaption from '../properties/GenerateCaption.svelte';

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
      .default(720)
      .describe('Width (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    height: z
      .number()
      .min(1)
      .max(5000)
      .default(1280)
      .describe('Height (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    borderRadius: z
      .number()
      .min(0)
      .max(2_000)
      .default(40)
      .describe('Border radius (px)')
      .register(fieldRegistry, { interpolationFamily: 'continuous' }),
    crop: z
      .number()
      .min(0)
      .max(500)
      .default(0)
      .describe('Crop inset (px)')
      .register(fieldRegistry, { interpolationFamily: 'continuous' }),
    objectFit: z
      .enum(['contain', 'cover', 'none'])
      .default('cover')
      .describe('Object fit mode')
      .register(fieldRegistry, { interpolationFamily: 'discrete' }),
    /** Playback volume (0-1) */
    volume: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.1)
      .default(1)
      .describe('Volume (0-1)')
      .register(fieldRegistry, { group: 'playback', interpolationFamily: 'continuous' }),
    /** Whether the video is muted */
    muted: z
      .boolean()
      .default(false)
      .describe('Mute audio')
      .register(fieldRegistry, { interpolationFamily: 'discrete' }),
    /** Playback rate */
    playbackRate: z
      .number()
      .min(0.1)
      .max(4)
      .multipleOf(0.1)
      .default(1)
      .describe('Playback rate')
      .register(fieldRegistry, { group: 'playback', interpolationFamily: 'continuous' }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Aspect ratio locked')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Aspect ratio value')
      .register(fieldRegistry, { hidden: true }),
    /** The storage key if file was uploaded (used for cleanup) */
    fileKey: z
      .string()
      .default('')
      .describe('Storage key (for uploaded files)')
      .register(fieldRegistry, { hidden: true })
  });

  export const meta = {
    category: 'media',
    schema,
    type: 'video',
    label: 'Video',
    icon: Video,
    description: 'Embed video files with trimming, volume control, and playback options',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'playback', label: 'Playback' }
    ],

    customPropertyComponents: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generateCaptions: { component: GenerateCaption as any }
    },

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { watch } from 'runed';

  let {
    src,
    width,
    height,
    borderRadius,
    crop,
    objectFit,
    volume,
    muted,
    playbackRate,
    layer,
    currentTime,
    isPlaying,
    isServerSideRendering = false
  }: Props & {
    layer: TypedLayer;
    currentTime: number;
    isPlaying: boolean;
    isServerSideRendering?: boolean;
  } = $props();

  let videoEl: HTMLVideoElement | undefined = $state();

  // Sync the video element's currentTime to the project timeline
  watch(
    [
      () => currentTime,
      () => isPlaying,
      () => layer.enterTime,
      () => layer.contentOffset,
      () => src,
      () => videoEl,
      () => isServerSideRendering
    ],
    (_, [, prevPlaying]) => {
      if (!videoEl || !src || !layer) return;

      const relativeTime = currentTime - (layer.enterTime ?? 0);
      const videoTime = (layer.contentOffset ?? 0) + relativeTime;
      const clampedTime = Math.max(
        layer.contentOffset ?? 0,
        Math.min(videoTime, videoEl.duration || Infinity)
      );

      const timeDiff = Math.abs(videoEl.currentTime - clampedTime);
      const playStateChanged = isPlaying !== prevPlaying;

      // Determine if we should sync:
      // - Server-side rendering: always sync (frame-by-frame capture)
      // - Client-side: only sync when play state changes or large drift (> 0.5s)
      //   This prevents video glitches during normal playback
      const shouldSync = isServerSideRendering || playStateChanged || timeDiff > 0.5;

      if (isFinite(clampedTime) && shouldSync) {
        videoEl.currentTime = clampedTime;
      }

      // Sync playback state
      if (isPlaying && relativeTime >= 0 && videoTime < (videoEl.duration || Infinity)) {
        if (videoEl.paused) videoEl.play().catch(() => {});
      } else {
        if (!videoEl.paused) videoEl.pause();
      }
    }
  );

  // Sync volume/muted/playbackRate
  watch([() => volume, () => muted, () => playbackRate, () => videoEl], () => {
    if (!videoEl) return;
    if (volume) {
      videoEl.volume = volume;
    }
    videoEl.muted = muted;
    if (playbackRate) {
      videoEl.playbackRate = playbackRate;
    }
  });
</script>

<div style:width="{width}px" style:height="{height}px">
  {#if src}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={videoEl}
      {src}
      class="h-full w-full"
      style:object-fit={objectFit}
      style:clip-path={crop > 0
        ? `inset(${crop}px round ${borderRadius}px)`
        : borderRadius > 0
          ? `inset(0px round ${borderRadius}px)`
          : undefined}
      preload="auto"
      playsinline
    ></video>
  {:else}
    <div
      class="flex h-full w-full items-center justify-center bg-gray-800 text-sm text-gray-400"
      style:border-radius="{borderRadius}px"
    >
      No video source
    </div>
  {/if}
</div>

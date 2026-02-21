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
      .describe(
        'The video source URL or uploaded file URL. Can be an external URL or a storage URL from an uploaded file. The video is synchronized to the project timeline automatically.'
      )
      .register(fieldRegistry, { widget: 'upload', mediaType: 'video', label: 'Video' }),
    width: z
      .number()
      .min(1)
      .max(5000)
      .default(720)
      .describe(
        'The display width of the video container in pixels. Smoothly animatable for zoom/resize effects.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(1)
      .max(5000)
      .default(1280)
      .describe(
        'The display height of the video container in pixels. Smoothly animatable for zoom/resize effects.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    borderRadius: z
      .number()
      .min(0)
      .max(2_000)
      .default(40)
      .describe(
        'The corner radius of the video frame in pixels. 0 = sharp corners, higher = more rounded. Use a large value for circular video. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Radius' }),
    crop: z
      .number()
      .min(0)
      .max(500)
      .default(0)
      .describe(
        'Uniform inset crop in pixels applied to all sides of the video. Hides edge content (e.g., to remove borders or notifications). Combined with borderRadius for rounded cropped frames. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Crop' }),
    objectFit: z
      .enum(['contain', 'cover', 'none'])
      .default('cover')
      .describe(
        'How the video fills its container. Cover = crop to fill (no letterbox), Contain = fit inside (may show letterbox), None = use original video size. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Fit' }),
    volume: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.1)
      .default(1)
      .describe(
        'The audio playback volume from 0.0 (silent) to 1.0 (full volume). Smoothly animatable for fade-in/fade-out audio effects.'
      )
      .register(fieldRegistry, {
        group: 'playback',
        interpolationFamily: 'continuous',
        label: 'Volume'
      }),
    muted: z
      .boolean()
      .default(false)
      .describe(
        'Whether the video audio is muted. When true, audio is completely silent regardless of volume. Changes discretely (on/off).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Muted' }),
    playbackRate: z
      .number()
      .min(0.1)
      .max(4)
      .multipleOf(0.1)
      .default(1)
      .describe(
        'The playback speed multiplier. 1.0 = normal speed, 0.5 = half speed (slow motion), 2.0 = double speed. Smoothly animatable for speed ramp effects.'
      )
      .register(fieldRegistry, {
        group: 'playback',
        interpolationFamily: 'continuous',
        label: 'Speed'
      }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Internal property: whether aspect ratio is locked during resize')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Internal property: stored aspect ratio value when locked')
      .register(fieldRegistry, { hidden: true }),
    fileKey: z
      .string()
      .default('')
      .describe('Internal property: S3 storage key for uploaded files, used for cleanup on delete')
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
  import { watch } from 'runed';
  import type { WrappedLayerProps } from '../LayerWrapper.svelte';

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
    isServerSideRendering = false,
    globalVolume = 100
  }: WrappedLayerProps<Props> = $props();

  let videoEl: HTMLVideoElement | undefined = $state();
  let hasError = $state(false);

  function handleError() {
    hasError = true;
  }

  function handleLoad() {
    hasError = false;
  }

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
  watch([() => volume, () => muted, () => playbackRate, () => globalVolume, () => videoEl], () => {
    if (!videoEl) return;
    if (volume !== undefined) {
      // Apply both layer volume and global volume (globalVolume is 0-100, convert to 0-1)
      const effectiveVolume = volume * (globalVolume / 100);
      videoEl.volume = effectiveVolume;
    }
    videoEl.muted = muted;
    if (playbackRate) {
      videoEl.playbackRate = playbackRate;
    }
  });
</script>

<div style:width="{width}px" style:height="{height}px">
  {#if src && !hasError}
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
      onerror={handleError}
      onloadeddata={handleLoad}
    ></video>
  {:else if hasError}
    <div
      class="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-500/20 text-sm"
      style:border-radius="{borderRadius}px"
    >
      <span>Video not available</span>
      <span class="text-xs text-destructive">The source may be missing or deleted</span>
    </div>
  {:else}
    <div
      class="flex h-full w-full items-center justify-center bg-gray-800 text-sm text-gray-400"
      style:border-radius="{borderRadius}px"
    >
      No video source
    </div>
  {/if}
</div>

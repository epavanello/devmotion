<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';

  import { Music } from '@lucide/svelte';
  import GenerateCaption from '../properties/GenerateCaption.svelte';
  import { sizeMiddleware } from '$lib/schemas/size';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';

  /**
   * Schema for Audio Layer custom properties
   *
   * Audio layers render as a visual waveform/indicator on the canvas
   * and play audio synchronized to the project timeline.
   */
  const schema = z.object({
    src: z
      .string()
      .default('')
      .describe(
        'The audio source URL or uploaded file URL. Can be an external URL or a storage URL from an uploaded file. Audio is synchronized to the project timeline.'
      )
      .register(fieldRegistry, { widget: 'upload', mediaType: 'audio', label: 'Audio' }),
    label: z
      .string()
      .default('Audio')
      .describe(
        'The display label shown on the canvas for this audio layer. Used for identification in the editor since audio has no visual output. Supports text animation.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'Label' }),
    volume: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.1)
      .default(1)
      .describe(
        'The audio playback volume from 0.0 (silent) to 1.0 (full volume). Smoothly animatable for fade-in/fade-out effects.'
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
        'Whether the audio is muted. When true, audio is completely silent regardless of volume setting. Changes discretely (on/off).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Muted' }),
    playbackRate: z
      .number()
      .min(0.1)
      .max(4)
      .multipleOf(0.1)
      .default(1)
      .describe(
        'The playback speed multiplier. 1.0 = normal speed, 0.5 = half speed (slowed down), 2.0 = double speed. Affects both pitch and tempo. Smoothly animatable.'
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
    type: 'audio',
    label: 'Audio',
    icon: Music,
    description: 'Audio tracks with captions',
    customPropertyComponents: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generateCaptions: { component: GenerateCaption as any }
    },
    propertyGroups: [{ id: 'playback', label: 'Playback' }],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import { watch } from 'runed';
  import type { WrappedLayerProps } from '../LayerWrapper.svelte';

  let {
    src,
    volume,
    muted,
    playbackRate,
    fileKey: _fileKey,
    layer,
    currentTime,
    isPlaying,
    isServerSideRendering = false,
    globalVolume = 100
  }: WrappedLayerProps<Props> = $props();

  let audioEl: HTMLAudioElement | undefined = $state();

  // Sync audio to project timeline
  watch(
    [
      () => currentTime,
      () => isPlaying,
      () => layer.enterTime,
      () => layer.contentOffset,
      () => src,
      () => audioEl,
      () => isServerSideRendering
    ],
    (_, [, prevPlaying]) => {
      if (!audioEl || !src || !layer) return;

      const relativeTime = currentTime - (layer.enterTime ?? 0);
      const audioTime = (layer.contentOffset ?? 0) + relativeTime;
      const clampedTime = Math.max(
        layer.contentOffset ?? 0,
        Math.min(audioTime, audioEl.duration || Infinity)
      );

      const timeDiff = Math.abs(audioEl.currentTime - clampedTime);
      const playStateChanged = isPlaying !== prevPlaying;

      // Determine if we should sync:
      // - Server-side rendering: always sync (frame-by-frame capture)
      // - Client-side: only sync when play state changes or large drift (> 0.5s)
      //   This prevents audio glitches during normal playback
      const shouldSync = isServerSideRendering || playStateChanged || timeDiff > 0.5;

      if (isFinite(clampedTime) && shouldSync) {
        audioEl.currentTime = clampedTime;
      }

      // Sync playback state
      if (isPlaying && relativeTime >= 0 && audioTime < (audioEl.duration || Infinity)) {
        if (audioEl.paused) audioEl.play().catch(() => {});
      } else {
        if (!audioEl.paused) audioEl.pause();
      }
    }
  );

  // Sync volume/muted/playbackRate
  watch([() => volume, () => muted, () => playbackRate, () => globalVolume, () => audioEl], () => {
    if (!audioEl) return;
    // Apply both layer volume and global volume (globalVolume is 0-100, convert to 0-1)
    const effectiveVolume = volume * (globalVolume / 100);
    audioEl.volume = effectiveVolume;
    audioEl.muted = muted;
    audioEl.playbackRate = playbackRate;
  });
</script>

{#if src}
  <audio bind:this={audioEl} {src} preload="auto"></audio>
{/if}

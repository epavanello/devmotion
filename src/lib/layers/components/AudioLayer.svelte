<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '../base';
  import { Music } from '@lucide/svelte';
  import GenerateCaption from '../properties/GenerateCaption.svelte';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';
  import type { Layer } from '$lib/schemas/animation';

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
      .describe('Audio source URL or uploaded file URL')
      .register(fieldRegistry, { widget: 'upload', mediaType: 'audio' }),
    /** Display label shown on canvas */
    label: z
      .string()
      .default('Audio')
      .describe('Display label')
      .register(fieldRegistry, { interpolationFamily: 'text' }),
    volume: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.1)
      .default(1)
      .describe('Volume (0-1)')
      .register(fieldRegistry, { group: 'playback', interpolationFamily: 'continuous' }),
    /** Whether audio is muted */
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

  let {
    src,
    volume,
    muted,
    playbackRate,
    fileKey: _fileKey,
    layer,
    currentTime,
    isPlaying,
    isServerSideRendering = false
  }: Props & {
    layer: Layer;
    currentTime: number;
    isPlaying: boolean;
    isServerSideRendering?: boolean;
  } = $props();

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
  watch([() => volume, () => muted, () => playbackRate, () => audioEl], () => {
    if (!audioEl) return;
    audioEl.volume = volume;
    audioEl.muted = muted;
    audioEl.playbackRate = playbackRate;
  });
</script>

{#if src}
  <audio bind:this={audioEl} {src} preload="auto"></audio>
{/if}

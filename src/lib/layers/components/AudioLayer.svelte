<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '../base';
  import { Music } from '@lucide/svelte';

  /**
   * Schema for Audio Layer custom properties
   *
   * Audio layers render as a visual waveform/indicator on the canvas
   * and play audio synchronized to the project timeline.
   */
  const schema = z.object({
    src: z.string().default('').describe('Audio source URL or uploaded file URL'),
    /** Display label shown on canvas */
    label: z.string().default('Audio').describe('Display label'),
    /** Width of the visual representation */
    width: z.number().min(50).max(5000).default(400).describe('Width (px)'),
    /** Height of the visual representation */
    height: z.number().min(20).max(500).default(60).describe('Height (px)'),
    /** Start time in the source audio (seconds) - for trimming */
    mediaStartTime: z.number().min(0).default(0).describe('Media start time (s)'),
    /** End time in the source audio (seconds) - for trimming */
    mediaEndTime: z.number().min(0).default(0).describe('Media end time (s) - 0 means full'),
    /** Playback volume */
    volume: z.number().min(0).max(1).default(1).describe('Volume (0-1)'),
    /** Whether audio is muted */
    muted: z.boolean().default(false).describe('Mute audio'),
    /** Playback rate */
    playbackRate: z.number().min(0.1).max(4).default(1).describe('Playback rate'),
    /** Visual style */
    waveformColor: z.string().default('#3b82f6').describe('Waveform color'),
    backgroundColor: z.string().default('#1e293b').describe('Background color'),
    /** Show captions overlay */
    showCaptions: z.boolean().default(false).describe('Show captions'),
    /** Caption text - can be set by AI transcription */
    captionText: z
      .string()
      .default('')
      .describe('Caption/subtitle text')
      .register(fieldRegistry, { widget: 'textarea' }),
    /** Caption style */
    captionFontSize: z.number().min(8).max(120).default(24).describe('Caption font size'),
    captionColor: z.string().default('#ffffff').describe('Caption text color'),
    captionBgColor: z.string().default('rgba(0,0,0,0.7)').describe('Caption background color'),
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
    type: 'audio',
    label: 'Audio',
    icon: Music,
    description:
      'Audio tracks with waveform visualization, volume control, trimming, and AI-powered captions'
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';

  let {
    src,
    label,
    width,
    height,
    mediaStartTime,
    mediaEndTime,
    volume,
    muted,
    playbackRate,
    waveformColor,
    backgroundColor,
    showCaptions,
    captionText,
    captionFontSize,
    captionColor,
    captionBgColor,
    fileKey: _fileKey,
    fileName: _fileName,
    layerId: _layerId,
    enterTime: enterTimeProp
  }: Props = $props();

  let audioEl: HTMLAudioElement | undefined = $state();

  // Sync audio to project timeline
  $effect(() => {
    if (!audioEl || !src) return;
    const currentTime = projectStore.currentTime;

    // Use enterTime passed as prop or fallback to 0
    const enterTime = enterTimeProp ?? 0;
    const relativeTime = currentTime - enterTime;

    // Apply media start offset and playback rate
    const audioTime = mediaStartTime + relativeTime * playbackRate;

    // Clamp to valid range
    const maxTime = mediaEndTime > 0 ? mediaEndTime : audioEl.duration || Infinity;
    const clampedTime = Math.max(mediaStartTime, Math.min(audioTime, maxTime));

    if (isFinite(clampedTime) && Math.abs(audioEl.currentTime - clampedTime) > 0.05) {
      audioEl.currentTime = clampedTime;
    }

    // Sync playback state
    if (projectStore.isPlaying && relativeTime >= 0 && clampedTime < maxTime) {
      if (audioEl.paused) audioEl.play().catch(() => {});
    } else {
      if (!audioEl.paused) audioEl.pause();
    }
  });

  // Sync volume/muted/playbackRate
  $effect(() => {
    if (!audioEl) return;
    audioEl.volume = volume;
    audioEl.muted = muted;
    audioEl.playbackRate = playbackRate;
  });

  // Parse captions as timed segments: "0:00 - 0:05 | Hello world\n0:05 - 0:10 | Next line"
  const parsedCaptions = $derived.by(() => {
    if (!captionText) return [];
    const lines = captionText.split('\n').filter((l) => l.trim());
    return lines.map((line) => {
      const match = line.match(/(\d+):(\d+(?:\.\d+)?)\s*-\s*(\d+):(\d+(?:\.\d+)?)\s*\|\s*(.+)/);
      if (match) {
        const start = parseInt(match[1]) * 60 + parseFloat(match[2]);
        const end = parseInt(match[3]) * 60 + parseFloat(match[4]);
        return { start, end, text: match[5].trim() };
      }
      // Simple format: just text (always shown)
      return { start: 0, end: Infinity, text: line.trim() };
    });
  });

  // Current caption based on project time
  const currentCaption = $derived.by(() => {
    if (!showCaptions || parsedCaptions.length === 0) return '';
    const enterTime = enterTimeProp ?? 0;
    const relativeTime = projectStore.currentTime - enterTime + mediaStartTime;
    const active = parsedCaptions.find((c) => relativeTime >= c.start && relativeTime < c.end);
    return active?.text || '';
  });

  // Generate fake waveform bars for visual representation
  const barCount = $derived(Math.max(10, Math.floor(width / 4)));
</script>

{#if src}
  <audio bind:this={audioEl} {src} preload="auto"></audio>
{/if}

<div
  class="relative overflow-hidden rounded"
  style:width="{width}px"
  style:height="{height + (showCaptions ? captionFontSize + 16 : 0)}px"
>
  <!-- Waveform visualization -->
  <div
    class="flex items-end gap-px"
    style:width="{width}px"
    style:height="{height}px"
    style:background-color={backgroundColor}
    style:padding="4px"
  >
    {#each Array(barCount) as _, i (i)}
      {@const barHeight = 20 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.7) * 20}
      <div
        class="flex-1 rounded-t-sm"
        style:height="{barHeight}%"
        style:background-color={waveformColor}
        style:opacity={0.5 + Math.sin(i * 0.5) * 0.3}
      ></div>
    {/each}

    <!-- Label overlay -->
    <div class="absolute top-1 left-2 text-xs font-medium text-white/70">
      {label}
    </div>

    <!-- Volume indicator -->
    <div class="absolute right-2 bottom-1 text-xs text-white/50">
      {muted ? 'Muted' : `${Math.round(volume * 100)}%`}
    </div>
  </div>

  <!-- Captions overlay -->
  {#if showCaptions && currentCaption}
    <div
      class="flex items-center justify-center px-2 py-1 text-center"
      style:background-color={captionBgColor}
      style:font-size="{captionFontSize}px"
      style:color={captionColor}
    >
      {currentCaption}
    </div>
  {/if}
</div>

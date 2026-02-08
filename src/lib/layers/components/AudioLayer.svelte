<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { fieldRegistry } from '../base';
  import { Music } from '@lucide/svelte';
  import GenerateCaption from '../properties/GenerateCaption.svelte';

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
    label: z.string().default('Audio').describe('Display label'),
    /** Width of the visual representation */
    width: z.number().min(50).max(5000).default(400).describe('Width (px)'),
    /** Height of the visual representation */
    height: z.number().min(20).max(500).default(60).describe('Height (px)'),
    /** Playback volume */
    volume: z.number().min(0).max(1).default(1).describe('Volume (0-1)'),
    /** Whether audio is muted */
    muted: z.boolean().default(false).describe('Mute audio'),
    /** Playback rate */
    playbackRate: z.number().min(0.1).max(4).default(1).describe('Playback rate'),
    /** Show captions overlay */
    showCaptions: z.boolean().default(false).describe('Show captions'),
    /** Caption display mode */
    captionMode: z
      .enum(['block', 'word-by-word'])
      .default('word-by-word')
      .describe('Caption display mode'),
    /** Word-level caption data (single source of truth) */
    captionWords: z
      .array(
        z.object({
          word: z.string(),
          start: z.number(),
          end: z.number()
        })
      )
      .default([])
      .describe('Caption words with timestamps')
      .register(fieldRegistry, { widget: 'custom', component: CaptionsEditor }),
    /** Caption style */
    captionFontSize: z.number().min(8).max(120).default(24).describe('Caption font size'),
    captionColor: z.string().default('#ffffff').describe('Caption text color'),
    captionBgColor: z.string().default('rgba(0,0,0,0.7)').describe('Caption background color'),
    /** The storage key if file was uploaded (used for cleanup) */
    fileKey: z
      .string()
      .default('')
      .describe('Storage key (for uploaded files)')
      .register(fieldRegistry, { hidden: true })
  });

  export const meta: LayerMeta = {
    schema,
    type: 'audio',
    label: 'Audio',
    icon: Music,
    description: 'Audio tracks with captions',
    customPropertyComponents: {
      generateCaptions: { label: 'Generate captions', component: GenerateCaption }
    }
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import type { Layer } from '$lib/schemas/animation';
  import CaptionsEditor from '../properties/CaptionsEditor.svelte';

  let {
    src,
    width,
    height,
    volume,
    muted,
    playbackRate,
    showCaptions,
    captionMode,
    captionWords,
    captionFontSize,
    captionColor,
    captionBgColor,
    fileKey: _fileKey,
    layer,
    currentTime,
    isPlaying
  }: Props & {
    layer: Layer;
    currentTime: number;
    isPlaying: boolean;
  } = $props();

  let audioEl: HTMLAudioElement | undefined = $state();

  // Sync audio to project timeline
  $effect(() => {
    if (!audioEl || !src || !layer) return;

    // Use enterTime passed as prop or fallback to 0
    const enterTime = layer.enterTime ?? 0;
    const relativeTime = currentTime - enterTime;

    // Apply content offset (where to start in the source audio)
    const contentOffset = layer.contentOffset ?? 0;
    const audioTime = contentOffset + relativeTime * (playbackRate ?? 1);

    // Clamp to valid range (up to audio duration)
    const maxTime = audioEl.duration || Infinity;
    const clampedTime = Math.max(contentOffset, Math.min(audioTime, maxTime));

    if (isFinite(clampedTime) && Math.abs(audioEl.currentTime - clampedTime) > 0.05) {
      audioEl.currentTime = clampedTime;
    }

    // Sync playback state
    if (isPlaying && relativeTime >= 0 && audioTime < maxTime) {
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

  // Derive caption blocks from words (for block mode)
  // Group words into sentences/segments based on timing gaps
  const captionBlocks = $derived.by(() => {
    if (!captionWords || captionWords.length === 0) return [];

    type Block = { start: number; end: number; words: string[] };
    const blocks: Array<{ id: number; start: number; end: number; text: string }> = [];
    let currentBlock: Block | null = null;

    captionWords.forEach((word, index) => {
      const prevWord = index > 0 ? captionWords[index - 1] : null;
      const gap = prevWord ? word.start - prevWord.end : 0;

      // Start new block if gap > 1 second or if it's the first word
      if (!currentBlock || gap > 1) {
        if (currentBlock) {
          blocks.push({
            id: blocks.length,
            start: currentBlock.start,
            end: currentBlock.end,
            text: currentBlock.words.join(' ')
          });
        }
        currentBlock = { start: word.start, end: word.end, words: [word.word] };
      } else {
        // TypeScript narrowing: we know currentBlock is not null here
        const block = currentBlock;
        block.words.push(word.word);
        block.end = word.end;
      }
    });

    // Add final block
    if (currentBlock) {
      const finalBlock: Block = currentBlock;
      blocks.push({
        id: blocks.length,
        start: finalBlock.start,
        end: finalBlock.end,
        text: finalBlock.words.join(' ')
      });
    }

    return blocks;
  });

  // Current caption block index based on project time
  // Note: Caption timestamps are relative to the trimmed audio (start from 0),
  // so we only need relativeTime = currentTime - enterTime
  const currentBlockIndex = $derived.by(() => {
    if (!showCaptions || captionBlocks.length === 0 || !layer) return -1;
    const enterTime = layer.enterTime ?? 0;
    const relativeTime = currentTime - enterTime;
    return captionBlocks.findIndex((c) => relativeTime >= c.start && relativeTime < c.end);
  });

  // Current words to display (for word-by-word mode)
  const currentWords = $derived.by(() => {
    if (!showCaptions || !captionWords || captionWords.length === 0 || !layer) return [];
    const enterTime = layer.enterTime ?? 0;
    const relativeTime = currentTime - enterTime;

    // Return all words up to current time
    return captionWords.filter((w) => w.start <= relativeTime);
  });
</script>

{#if src}
  <audio bind:this={audioEl} {src} preload="auto"></audio>
{/if}

<div
  class="relative overflow-visible rounded"
  style:width="{width}px"
  style:min-height="{height}px"
>
  {#if showCaptions && captionMode === 'word-by-word' && currentWords.length > 0}
    <!-- Word-by-word mode: Social media style -->
    <div
      class="flex flex-wrap content-start items-center justify-center gap-1 p-4"
      style:width="{width}px"
      style:min-height="{height}px"
    >
      {#each currentWords as word, i (i)}
        {@const enterTime = layer.enterTime ?? 0}
        {@const relativeTime = currentTime - enterTime}
        {@const isActive = relativeTime >= word.start && relativeTime < word.end}
        {@const justAppeared = relativeTime - word.start < 0.3}
        <span
          class="inline-block transition-all duration-150"
          style:font-size="{captionFontSize}px"
          style:color={captionColor}
          style:background-color={isActive ? captionBgColor : 'transparent'}
          style:padding={isActive ? '4px 8px' : '2px 4px'}
          style:border-radius="4px"
          style:font-weight={isActive ? '700' : '500'}
          style:transform={justAppeared ? 'scale(1.15)' : 'scale(1)'}
          style:opacity={isActive ? '1' : '0.85'}
        >
          {word.word}
        </span>
      {/each}
    </div>
  {:else if showCaptions && captionMode === 'block' && captionBlocks.length > 0}
    <!-- Block mode: Progressive paragraphs (derived from words) -->
    <div
      class="flex flex-col gap-3 overflow-y-auto p-4"
      style:width="{width}px"
      style:max-height="{height}px"
    >
      {#each captionBlocks as block (block.id)}
        {@const isActive = currentBlockIndex === block.id}
        {@const isPast = currentBlockIndex > block.id}
        <p
          class="leading-relaxed transition-all duration-200"
          style:font-size="{captionFontSize}px"
          style:color={isActive
            ? captionColor
            : isPast
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(255,255,255,0.2)'}
          style:background-color={isActive ? captionBgColor : 'transparent'}
          style:padding={isActive ? '8px 12px' : '4px 0'}
          style:border-radius={isActive ? '4px' : '0'}
          style:font-weight={isActive ? '600' : '400'}
          style:transform={isActive ? 'scale(1.02)' : 'scale(1)'}
        >
          {block.text}
        </p>
      {/each}
    </div>
  {/if}
</div>

<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Captions } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import SourceLayerRef from '../properties/SourceLayerRef.svelte';
  import { googleFontValues } from '$lib/utils/fonts';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';
  import { createSizeWithAspectRatioSchema, sizeMiddleware } from '$lib/schemas/size';

  /**
   * Word-level caption data schema
   */
  export const CaptionWordSchema = z.object({
    word: z.string(),
    start: z.number(),
    end: z.number()
  });

  /**
   * Schema for Captions Layer custom properties
   * Uses 400x200 as default dimensions for captions
   */
  const schema = createSizeWithAspectRatioSchema(400, 200).extend({
    sourceLayerId: z
      .string()
      .optional()
      .describe(
        'The ID of the source audio or video layer to sync captions with. When set, captions are driven by the word timestamps from that layer. Leave empty for standalone captions.'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: SourceLayerRef,
        label: 'Source'
      }),
    mode: z
      .enum(['block', 'word-by-word'])
      .optional()
      .default('word-by-word')
      .describe(
        'The caption display mode. Word-by-word = highlights each word as it is spoken with scale/opacity animation. Block = shows groups of words at once, fading between segments.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Mode' }),
    blockGap: z
      .number()
      .min(0.5)
      .max(4)
      .optional()
      .default(1)
      .describe(
        'The minimum silence gap in seconds between words that triggers a new caption block. Smaller values = more frequent block splits, larger values = longer blocks grouped together.'
      )
      .register(fieldRegistry, {
        group: 'captions',
        interpolationFamily: 'continuous',
        label: 'Block Gap'
      }),
    maxWordsPerBlock: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe(
        'The maximum number of words shown in a single caption block before starting a new one. Limits block length regardless of silence gaps.'
      )
      .register(fieldRegistry, {
        group: 'captions',
        interpolationFamily: 'discrete',
        label: 'Max Words'
      }),
    words: z
      .array(CaptionWordSchema)
      .optional()
      .default([])
      .describe(
        'The array of timed words for captions. Each word has: word (string), start (seconds), end (seconds). Usually generated from transcription. Editable via the captions editor.'
      )
      .register(fieldRegistry, { widget: 'custom', component: CaptionsEditor, label: 'Words' }),
    fontSize: z
      .number()
      .min(8)
      .max(120)
      .optional()
      .default(24)
      .describe(
        'The font size of caption text in pixels. Controls readability and visual prominence. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'font',
        interpolationFamily: 'continuous',
        label: 'Size'
      }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .describe(
        'The font family from Google Fonts for caption text. Affects legibility and style. Changes discretely (no animation between fonts).'
      )
      .register(fieldRegistry, {
        group: 'font',
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty,
        label: 'Font'
      }),
    fontWeight: z
      .enum(['400', '500', '600', '700', '800', '900'])
      .optional()
      .default('700')
      .describe(
        'The font weight of caption text. 400 = regular, 700 = bold, 900 = black. Active words are automatically bolded. Changes discretely.'
      )
      .register(fieldRegistry, {
        group: 'font',
        interpolationFamily: 'discrete',
        label: 'Weight'
      }),
    textColor: z
      .string()
      .optional()
      .default('#ffffff')
      .describe(
        'The text color of caption words in hexadecimal format. Used for active/highlighted words. Smoothly animatable for color transitions.'
      )
      .register(fieldRegistry, {
        group: 'style',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Text Color'
      }),
    bgColor: z
      .string()
      .optional()
      .default('rgba(0, 0, 0, 0.7)')
      .describe(
        'The background highlight color behind active caption words in hexadecimal or rgba format. Creates a pill/badge effect on the currently spoken word. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'style',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Highlight'
      }),
    transitionEffect: z
      .enum([
        'none',
        'fade',
        'scale',
        'slide-up',
        'fade-scale',
        'fade-slide-up',
        'fade-scale-slide-up'
      ])
      .optional()
      .default('fade')
      .describe(
        'The enter transition effect for active caption words. fade = opacity, scale = pop-in, slide-up = rise from below. Combinations apply multiple effects simultaneously.'
      )
      .register(fieldRegistry, {
        group: 'transition',
        interpolationFamily: 'discrete',
        label: 'Effect'
      }),
    transitionDuration: z
      .number()
      .min(0)
      .max(5000)
      .optional()
      .default(100)
      .describe('Duration in milliseconds for the enter transition of active caption words.')
      .register(fieldRegistry, {
        group: 'transition',
        interpolationFamily: 'continuous',
        label: 'Duration (ms)'
      })
  });

  export const meta = {
    category: 'text',
    schema,
    type: 'captions',
    label: 'Captions',
    icon: Captions,
    description: 'Synchronized captions/subtitles with word-by-word or block display modes',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'captions', label: 'Captions' },
      { id: 'style', label: 'Style' },
      { id: 'font', label: 'Font' },
      { id: 'transition', label: 'Transition' }
    ],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import CaptionsEditor from '../properties/CaptionsEditor.svelte';
  import FontProperty from '../properties/FontProperty.svelte';
  import ApplyFont from '$lib/components/font/apply-font.svelte';
  import { ElementTransition, type TransitionEffect } from '$lib/utils/element-transition.svelte';

  type CaptionWord = z.infer<typeof CaptionWordSchema>;

  const effectMap: Record<string, TransitionEffect[]> = {
    fade: ['fade'],
    scale: ['scale'],
    'slide-up': ['slide-up'],
    'fade-scale': ['fade', 'scale'],
    'fade-slide-up': ['fade', 'slide-up'],
    'fade-scale-slide-up': ['fade', 'scale', 'slide-up']
  };

  let {
    width,
    height,
    mode,
    blockGap,
    maxWordsPerBlock,
    words,
    fontSize,
    fontFamily,
    fontWeight,
    textColor,
    bgColor,
    transitionEffect,
    transitionDuration,
    layer,
    currentTime
  }: Props & {
    layer: TypedLayer;
    currentTime: number;
  } = $props();

  const transition = new ElementTransition({
    get duration() {
      return transitionDuration ?? 300;
    },
    get effects() {
      return effectMap[transitionEffect ?? 'fade-scale'] ?? [];
    },
    scaleFrom: 0.85
  });

  /**
   * Calculate relative time (time within the layer's content)
   * Caption timestamps are relative to the content start (contentOffset = 0)
   */
  const relativeTime = $derived.by(() => {
    const enterTime = layer.enterTime ?? 0;
    return currentTime - enterTime;
  });

  /**
   * Derive caption blocks from words (for block mode)
   * Group words into sentences/segments based on timing gaps and max words
   */
  const captionBlocks = $derived.by(() => {
    if (!words || words.length === 0) return [];

    const effectiveBlockGap = blockGap ?? 1;
    const effectiveMaxWords = maxWordsPerBlock ?? 10;

    type Block = { start: number; end: number; words: string[] };
    const blocks: Array<{ id: number; start: number; end: number; text: string }> = [];
    let currentBlock: Block | null = null;

    words.forEach((word, index) => {
      const prevWord = index > 0 ? words[index - 1] : null;
      const gap = prevWord ? word.start - prevWord.end : 0;

      // Start new block if:
      // - gap > blockGap (default 1 second) OR
      // - max words per block reached OR
      // - it's the first word
      if (!currentBlock) {
        // First word - create new block
        currentBlock = { start: word.start, end: word.end, words: [word.word] };
      } else if (gap > effectiveBlockGap || currentBlock.words.length >= effectiveMaxWords) {
        // Split needed - save current and create new
        blocks.push({
          id: blocks.length,
          start: currentBlock.start,
          end: currentBlock.end,
          text: currentBlock.words.join(' ')
        });
        currentBlock = { start: word.start, end: word.end, words: [word.word] };
      } else {
        // Add to current block
        currentBlock.words.push(word.word);
        currentBlock.end = word.end;
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

  /**
   * Current caption block index based on relative time
   */
  const currentBlockIndex = $derived.by(() => {
    if (captionBlocks.length === 0) return -1;
    return captionBlocks.findIndex((c) => relativeTime >= c.start && relativeTime < c.end);
  });

  /**
   * Current words to display (for word-by-word mode)
   * Only shows words from the current block (not all past words)
   */
  const currentWords = $derived.by((): CaptionWord[] => {
    if (!words || words.length === 0 || captionBlocks.length === 0) {
      return [];
    }

    // Find current block
    const currentBlock = captionBlocks[currentBlockIndex];
    if (!currentBlock) {
      return [];
    }

    // Filter words that belong to current block
    return words
      .filter((w) => w.start >= currentBlock.start && w.start < currentBlock.end)
      .filter((w) => w.start <= relativeTime);
  });

  function getWordFragment(wordStart: number) {
    return transition.fragmentFromTime('', relativeTime, wordStart);
  }
</script>

<ApplyFont {fontFamily}>
  {#if mode === 'word-by-word' && currentWords.length > 0}
    <!-- Word-by-word mode: Timeline-based, no CSS transitions -->
    <div
      class="flex flex-wrap content-start items-center justify-center"
      style:width="{width}px"
      style:height="{height}px"
      style:column-gap="{fontSize * 0.4}px"
    >
      {#each currentWords as { word, start, end }, i (i)}
        {@const isActive = relativeTime >= start && relativeTime < end}
        {@const frag = isActive && transitionEffect !== 'none' ? getWordFragment(start) : null}
        {@const transitionStyle = frag ? transition.getStyle(frag) : ''}
        <span
          class="inline-block rounded whitespace-pre"
          style:font-size="{fontSize}px"
          style:font-weight={isActive ? '700' : fontWeight}
          style:color={textColor}
          style:background-color={isActive ? bgColor : 'transparent'}
          style:padding={isActive ? '4px 8px' : '2px 4px'}
          style={transitionStyle || undefined}
        >
          {word}
        </span>
      {/each}
    </div>
  {:else if mode === 'block' && captionBlocks.length > 0}
    <!-- Block mode: Timeline-based, no CSS transitions -->
    <div class="flex flex-col gap-3" style:width="{width}px" style:height="{height}px">
      {#each captionBlocks as block (block.id)}
        {@const isActive = currentBlockIndex === block.id}
        {@const isPast = currentBlockIndex > block.id}
        <p
          class="rounded leading-relaxed"
          style:font-family={fontFamily ? `'${fontFamily}', sans-serif` : undefined}
          style:font-size="{fontSize}px"
          style:font-weight={isActive ? '600' : fontWeight}
          style:color={isActive
            ? textColor
            : isPast
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(255,255,255,0.2)'}
          style:background-color={isActive ? bgColor : 'transparent'}
          style:padding={isActive ? '8px 12px' : '4px 0'}
        >
          {block.text}
        </p>
      {/each}
    </div>
  {/if}
</ApplyFont>

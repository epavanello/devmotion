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
    sourceLayerId: z.string().optional().describe('Source').register(fieldRegistry, {
      interpolationFamily: 'discrete',
      widget: 'custom',
      component: SourceLayerRef
    }),
    mode: z
      .enum(['block', 'word-by-word'])
      .optional()
      .default('word-by-word')
      .describe('Caption display mode')
      .register(fieldRegistry, { interpolationFamily: 'discrete' }),
    blockGap: z
      .number()
      .min(0.5)
      .max(4)
      .optional()
      .default(1)
      .describe('Gap delay')
      .register(fieldRegistry, { group: 'captions', interpolationFamily: 'continuous' }),
    maxWordsPerBlock: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe('Max words')
      .register(fieldRegistry, { group: 'captions', interpolationFamily: 'discrete' }),
    words: z
      .array(CaptionWordSchema)
      .optional()
      .default([])
      .describe('Captions')
      .register(fieldRegistry, { widget: 'custom', component: CaptionsEditor }),
    fontSize: z
      .number()
      .min(8)
      .max(120)
      .optional()
      .default(24)
      .describe('Size (px)')
      .register(fieldRegistry, { group: 'font', interpolationFamily: 'continuous' }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .describe('Font family')
      .register(fieldRegistry, {
        group: 'font',
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty
      }),
    fontWeight: z
      .enum(['400', '500', '600', '700', '800', '900'])
      .optional()
      .default('700')
      .describe('Weight')
      .register(fieldRegistry, { group: 'font', interpolationFamily: 'discrete' }),
    textColor: z
      .string()
      .optional()
      .default('#ffffff')
      .describe('Text color')
      .register(fieldRegistry, {
        group: 'style',
        interpolationFamily: 'continuous',
        widget: 'color'
      }),
    bgColor: z
      .string()
      .optional()
      .default('rgba(0, 0, 0, 0.7)')
      .describe('Background color')
      .register(fieldRegistry, {
        group: 'style',
        interpolationFamily: 'continuous',
        widget: 'color'
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
      { id: 'font', label: 'Font' }
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

  type CaptionWord = z.infer<typeof CaptionWordSchema>;

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
    layer,
    currentTime
  }: Props & {
    layer: TypedLayer;
    currentTime: number;
  } = $props();

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

  // Animation constants (hardcoded defaults)
  const TRANSITION_DURATION = 0.3; // seconds for enter/exit animations
  const OPACITY_INACTIVE = 0.85;
  const SCALE_ACTIVE = 1;
  const SCALE_ENTER = 1.15;

  /**
   * Calculate interpolated opacity based on time since word start
   * Transitions from 0 to 1 during TRANSITION_DURATION
   */
  function getWordOpacity(wordStart: number): number {
    const timeSinceStart = relativeTime - wordStart;
    if (timeSinceStart < 0) return OPACITY_INACTIVE;
    if (timeSinceStart >= TRANSITION_DURATION) return 1;
    // Linear interpolation: 0 -> 1
    return timeSinceStart / TRANSITION_DURATION;
  }

  /**
   * Calculate interpolated scale based on time since word start
   * Scales from SCALE_ENTER down to SCALE_ACTIVE during TRANSITION_DURATION
   */
  function getWordScale(wordStart: number): number {
    const timeSinceStart = relativeTime - wordStart;
    if (timeSinceStart < 0) return SCALE_ACTIVE;
    if (timeSinceStart >= TRANSITION_DURATION) return SCALE_ACTIVE;
    // Linear interpolation: SCALE_ENTER -> SCALE_ACTIVE
    const progress = timeSinceStart / TRANSITION_DURATION;
    return SCALE_ENTER - (SCALE_ENTER - SCALE_ACTIVE) * progress;
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
        {@const wordOpacity = isActive ? getWordOpacity(start) : OPACITY_INACTIVE}
        {@const wordScale = isActive ? getWordScale(start) : 1}
        <span
          class="inline-block rounded"
          style:font-size="{fontSize}px"
          style:font-weight={isActive ? '700' : fontWeight}
          style:color={textColor}
          style:background-color={isActive ? bgColor : 'transparent'}
          style:padding={isActive ? '4px 8px' : '2px 4px'}
          style:opacity={wordOpacity}
          style:transform="scale({wordScale})"
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

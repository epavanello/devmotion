<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Captions } from '@lucide/svelte';
  import { fieldRegistry } from '../base';
  import SourceLayerRef from '../properties/SourceLayerRef.svelte';

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
   */
  const schema = z.object({
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
      { id: 'style', label: 'Style' },
      { id: 'font', label: 'Font' }
    ]
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import CaptionsEditor from '../properties/CaptionsEditor.svelte';

  type CaptionWord = z.infer<typeof CaptionWordSchema>;

  let {
    mode,
    words,
    fontSize,
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
   * Current words to display (for word-by-word mode)
   */
  const currentWords = $derived.by((): CaptionWord[] => {
    if (!words || words.length === 0) {
      return [];
    }
    return words.filter((w) => w.start <= relativeTime) as CaptionWord[];
  });

  /**
   * Derive caption blocks from words (for block mode)
   * Group words into sentences/segments based on timing gaps
   */
  const captionBlocks = $derived.by(() => {
    if (!words || words.length === 0) return [];

    type Block = { start: number; end: number; words: string[] };
    const blocks: Array<{ id: number; start: number; end: number; text: string }> = [];
    let currentBlock: Block | null = null;

    words.forEach((word, index) => {
      const prevWord = index > 0 ? words[index - 1] : null;
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

  /**
   * Current caption block index based on relative time
   */
  const currentBlockIndex = $derived.by(() => {
    if (captionBlocks.length === 0) return -1;
    return captionBlocks.findIndex((c) => relativeTime >= c.start && relativeTime < c.end);
  });
</script>

{#if mode === 'word-by-word' && currentWords.length > 0}
  <!-- Word-by-word mode: Social media style -->
  <div class="flex flex-wrap content-start items-center justify-center gap-1">
    {#each currentWords as { word, start, end }, i (i)}
      {@const isActive = relativeTime >= start && relativeTime < end}
      {@const justAppeared = relativeTime - start < 0.3}
      <span
        class="inline-block rounded transition-all duration-150"
        style:font-size="{fontSize}px"
        style:font-weight={isActive ? '700' : fontWeight}
        style:color={textColor}
        style:background-color={isActive ? bgColor : 'transparent'}
        style:padding={isActive ? '4px 8px' : '2px 4px'}
        style:transform={justAppeared ? 'scale(1.15)' : 'scale(1)'}
        style:opacity={isActive ? '1' : '0.85'}
      >
        {word}
      </span>
    {/each}
  </div>
{:else if mode === 'block' && captionBlocks.length > 0}
  <!-- Block mode: Progressive paragraphs -->
  <div class="flex flex-col gap-3">
    {#each captionBlocks as block (block.id)}
      {@const isActive = currentBlockIndex === block.id}
      {@const isPast = currentBlockIndex > block.id}
      <p
        class="rounded leading-relaxed transition-all duration-200"
        style:font-size="{fontSize}px"
        style:font-weight={isActive ? '600' : fontWeight}
        style:color={isActive
          ? textColor
          : isPast
            ? 'rgba(255,255,255,0.4)'
            : 'rgba(255,255,255,0.2)'}
        style:background-color={isActive ? bgColor : 'transparent'}
        style:padding={isActive ? '8px 12px' : '4px 0'}
        style:transform={isActive ? 'scale(1.02)' : 'scale(1)'}
      >
        {block.text}
      </p>
    {/each}
  </div>
{/if}

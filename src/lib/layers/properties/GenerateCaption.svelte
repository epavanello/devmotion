<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { Layer } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Sparkles } from '@lucide/svelte';
  import { createLayer } from '$lib/engine/layer-factory';
  import type { CaptionWordSchema } from '$lib/layers/components/CaptionsLayer.svelte';
  import { z } from 'zod';
  import { generateCaptions } from '$lib/functions/captions.remote';
  import { meta } from '$lib/layers/components/CaptionsLayer.svelte';

  type CaptionItem = z.infer<typeof CaptionWordSchema>;

  // Infer types from generateCaptions return type
  type GenerateCaptionsResult = Awaited<ReturnType<typeof generateCaptions>>;
  type GenerateCaptionsData = Extract<GenerateCaptionsResult, { success: true }>['data'];
  type WordData = GenerateCaptionsData['words'][number];

  // Internal working type for grouping words into captions
  type CurrentCaption = {
    start: number;
    end: number;
    words: string[];
  };

  // Caption generation state
  let isGeneratingCaptions = $state(false);
  let captionError = $state('');
  let prompt = $state('');

  const {
    layer
  }: {
    layer: Layer;
  } = $props();

  async function handleGenerateCaptions() {
    const fileKey = layer.props.fileKey;

    if (!fileKey) {
      captionError = 'No media file available for caption generation';
      return;
    }

    isGeneratingCaptions = true;
    captionError = '';

    try {
      // Calculate timing parameters based on layer properties
      const enterTime = layer.enterTime ?? 0;
      const exitTime = layer.exitTime ?? projectStore.project.duration;
      const contentOffset = layer.contentOffset ?? 0;
      const layerDuration = exitTime - enterTime;

      // The portion of the source media we want to transcribe
      const mediaStartTime = contentOffset;
      const mediaEndTime = contentOffset + layerDuration;

      const result = await generateCaptions({
        fileKey,
        mediaStartTime,
        mediaEndTime,
        prompt: prompt.trim() || undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate captions');
      }

      const data = result.data;
      if (data.success && data.words) {
        // // Convert word-level data to caption items
        // // Group words into caption blocks (every 5-10 words or when there's a gap > 1s)
        // const captions: CaptionItem[] = [];
        // let currentCaption: CurrentCaption | null = null;

        // data.words.forEach((word: WordData, index: number) => {
        //   const prevWord = index > 0 ? data.words[index - 1] : null;
        //   const gap = prevWord ? word.start - prevWord.end : 0;

        //   // Start new caption if gap > 1 second or if we have 10 words already
        //   if (!currentCaption || gap > 1 || currentCaption.words.length >= 10) {
        //     if (currentCaption) {
        //       captions.push({
        //         start: currentCaption.start,
        //         end: currentCaption.end,
        //         word: currentCaption.words.join(' ')
        //       });
        //     }
        //     currentCaption = { start: word.start, end: word.end, words: [word.word] };
        //   } else {
        //     currentCaption.words.push(word.word);
        //     currentCaption.end = word.end;
        //   }
        // });

        // // Add final caption
        // if (currentCaption) {
        //   const { start, end, words } = currentCaption as CurrentCaption;
        //   captions.push({
        //     start,
        //     end,
        //     word: words.join(' ')
        //   });
        // }

        // Create a new CaptionsLayer linked to this source layer
        const captionsLayer: Layer = createLayer('captions', {
          props: {
            sourceLayerId: layer.id,
            words: data.words
          } as z.infer<typeof meta.schema>,
          layer: {
            enterTime: layer.enterTime,
            exitTime: layer.exitTime,
            contentOffset: layer.contentOffset,
            contentDuration: layer.contentDuration
          }
        });

        // Add the captions layer to the project
        projectStore.addLayer(captionsLayer);
      }
    } catch (err) {
      captionError = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isGeneratingCaptions = false;
    }
  }
</script>

<div class="flex flex-col gap-2">
  <Textarea
    bind:value={prompt}
    placeholder="Optional: Paste lyrics or context to guide transcription..."
    class="min-h-[80px] text-xs"
    disabled={isGeneratingCaptions}
  />
  <Button
    variant="default"
    size="sm"
    class="w-full text-xs"
    disabled={isGeneratingCaptions}
    onclick={handleGenerateCaptions}
  >
    <Sparkles class="mr-1 size-3" />
    {isGeneratingCaptions ? 'Generating...' : 'Generate Captions'}
  </Button>
  {#if captionError}
    <p class="text-xs text-destructive">{captionError}</p>
  {/if}
</div>

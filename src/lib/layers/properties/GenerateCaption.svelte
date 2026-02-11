<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Sparkles } from '@lucide/svelte';
  import { createLayer } from '$lib/engine/layer-factory';
  import { generateCaptions } from '$lib/functions/captions.remote';
  import type { TypedLayer } from '../typed-registry';

  // Caption generation state
  let isGeneratingCaptions = $state(false);
  let captionError = $state('');
  let prompt = $state('');

  const {
    layer
  }: {
    layer: TypedLayer<'video' | 'audio'>;
  } = $props();

  async function handleGenerateCaptions() {
    const fileKey = layer.props.fileKey as string | undefined;

    if (!fileKey) {
      captionError = 'No media file available for caption generation';
      return;
    }

    isGeneratingCaptions = true;
    captionError = '';

    try {
      // Calculate timing parameters based on layer properties
      const enterTime = layer.enterTime ?? 0;
      const exitTime = layer.exitTime ?? projectStore.state.duration;
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
        // Create a new CaptionsLayer linked to this source layer
        const captionsLayer: TypedLayer = createLayer('captions', {
          props: {
            sourceLayerId: layer.id,
            words: data.words
          },
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

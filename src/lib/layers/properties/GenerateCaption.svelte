<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { Layer } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Sparkles } from '@lucide/svelte';

  // Caption generation state
  let isGeneratingCaptions = $state(false);
  let captionError = $state('');
  let prompt = $state('');

  const {
    layer
  }: {
    layer: Layer;
  } = $props();

  async function generateCaptions() {
    const fileKey = layer.props.fileKey;

    isGeneratingCaptions = true;
    captionError = '';

    try {
      // Calculate timing parameters based on layer properties
      const enterTime = layer.enterTime ?? 0;
      const exitTime = layer.exitTime ?? projectStore.project.duration;
      const contentOffset = layer.contentOffset ?? 0;
      const layerDuration = exitTime - enterTime;

      // The portion of the source audio we want to transcribe
      const mediaStartTime = contentOffset;
      const mediaEndTime = contentOffset + layerDuration;

      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey,
          mediaStartTime,
          mediaEndTime,
          prompt: prompt.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.words) {
        projectStore.updateLayer(layer.id, {
          props: {
            ...layer.props,
            captionWords: data.words,
            showCaptions: true
          }
        });
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
    variant="outline"
    size="sm"
    class="w-full text-xs"
    disabled={isGeneratingCaptions}
    onclick={generateCaptions}
  >
    <Sparkles class="mr-1 size-3" />
    {isGeneratingCaptions ? 'Generating...' : 'Generate Captions (AI)'}
  </Button>
  {#if captionError}
    <p class="text-xs text-destructive">{captionError}</p>
  {/if}
</div>

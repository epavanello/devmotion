<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import type { Layer } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Sparkles } from '@lucide/svelte';

  // Caption generation state
  let isGeneratingCaptions = $state(false);
  let captionError = $state('');

  const {
    layer
  }: {
    layer: Layer;
  } = $props();

  async function generateCaptions() {
    const audioUrl = layer.props.src;
    if (!audioUrl) {
      captionError = 'No audio source URL set';
      return;
    }

    isGeneratingCaptions = true;
    captionError = '';

    try {
      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.captions) {
        projectStore.updateLayer(layer.id, {
          props: { ...layer.props, captionText: data.captions, showCaptions: true }
        });
      }
    } catch (err) {
      captionError = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isGeneratingCaptions = false;
    }
  }
</script>

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

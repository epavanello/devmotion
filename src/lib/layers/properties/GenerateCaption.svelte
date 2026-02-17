<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { Select } from '$lib/components/ui/select';
  import InputWrapper from '$lib/components/editor/panels/input-wrapper.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Sparkles } from '@lucide/svelte';
  import { createLayer } from '$lib/engine/layer-factory';
  import { generateCaptions } from '$lib/functions/captions.remote';
  import type { TypedLayer } from '../typed-registry';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  // Caption generation state
  let isGeneratingCaptions = $state(false);
  let captionError = $state('');
  let prompt = $state('');
  let selectedLanguage = $state('auto');

  // Common languages supported by Whisper
  const languages = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
    { value: 'nl', label: 'Dutch' },
    { value: 'pl', label: 'Polish' },
    { value: 'tr', label: 'Turkish' }
  ];

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
        prompt: prompt.trim() || undefined,
        language: selectedLanguage === 'auto' ? undefined : selectedLanguage
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
  <InputWrapper for="language" label="Language">
    <Select
      trigger={{ id: 'language', disabled: isGeneratingCaptions }}
      bind:value={selectedLanguage}
      options={languages}
    />
  </InputWrapper>

  <InputWrapper for="prompt" label="Context (Optional)">
    <Textarea
      id="prompt"
      bind:value={prompt}
      placeholder="Paste lyrics or context to guide transcription..."
      class="min-h-[80px] text-xs"
      disabled={isGeneratingCaptions}
    />
  </InputWrapper>

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

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Select } from '$lib/components/ui/select';
  import { Sparkles } from '@lucide/svelte';
  import { animationPresets } from '$lib/engine/presets';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import ScrubInput from '../../scrub-input.svelte';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  const { layer }: { layer: TypedLayer } = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  let selectedPresetId = $state<string>('');
  let presetDuration = $state<number>(1);

  function applyPreset() {
    if (!selectedPresetId) return;

    const startTime = projectStore.currentTime;
    projectStore.applyPreset(layer.id, selectedPresetId, startTime, presetDuration);

    // Reset selection after applying
    selectedPresetId = '';
    presetDuration = 1;
  }
</script>

<InputsWrapper
  fields={[
    {
      for: 'animation-presets',
      labels: 'Animation'
    },
    {
      for: 'preset-duration',
      labels: 'Duration (s)'
    }
  ]}
>
  <Select
    bind:value={selectedPresetId}
    options={animationPresets.map((preset) => ({ label: preset.name, value: preset.id }))}
    trigger={{ class: 'w-full' }}
  />
  <ScrubInput
    id="preset-duration"
    value={presetDuration}
    min={0.1}
    step={0.1}
    onchange={(v) => (presetDuration = v)}
  />
</InputsWrapper>

<Button variant="default" class="w-full" onclick={applyPreset} disabled={!selectedPresetId}>
  <Sparkles class="mr-2 h-4 w-4" />
  Apply Preset
</Button>

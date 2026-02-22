<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Sparkles } from '@lucide/svelte';
  import { animationPresets } from '$lib/engine/presets';
  import type { TypedAnimationPreset } from '$lib/engine/presets';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import ScrubInput from '../../scrub-input.svelte';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import AnimationPresetSelect from '../animation-preset-select.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  const { layer }: { layer: TypedLayer } = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  let selectedPresetId = $state<string>('');
  let presetDuration = $state<number>(1);

  // All presets available for keyframe application (all categories)
  const allPresets: TypedAnimationPreset[] = animationPresets;

  function applyPreset() {
    if (!selectedPresetId) return;

    const startTime = projectStore.currentTime;
    projectStore.applyPreset(layer.id, selectedPresetId, startTime, presetDuration);

    selectedPresetId = '';
    presetDuration = 1;
  }
</script>

<div class="space-y-2">
  <Label class="text-xs text-muted-foreground">Apply as Keyframes</Label>
  <InputsWrapper
    fields={[
      { for: 'animation-presets', labels: 'Animation' },
      { for: 'preset-duration', labels: 'Duration (s)' }
    ]}
  >
    <AnimationPresetSelect
      value={selectedPresetId}
      options={allPresets}
      placeholder="Select preset"
      onchange={(v) => (selectedPresetId = v)}
    />
    <ScrubInput
      id="preset-duration"
      value={presetDuration}
      min={0.1}
      step={0.1}
      onchange={(v) => (presetDuration = v)}
    />
  </InputsWrapper>
  <Button
    variant="default"
    size="sm"
    class="w-full"
    onclick={applyPreset}
    disabled={!selectedPresetId}
  >
    <Sparkles class="mr-2 h-3.5 w-3.5" />
    Apply at {projectStore.currentTime.toFixed(1)}s
  </Button>
</div>

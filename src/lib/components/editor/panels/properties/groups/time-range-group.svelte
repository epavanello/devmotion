<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import { Label } from '$lib/components/ui/label';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import ScrubInput from '../../scrub-input.svelte';
  import AnimationPresetSelect from '../animation-preset-select.svelte';
  import InputWrapper from '../../input-wrapper.svelte';

  const { layer }: { layer: TypedLayer } = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  let selectedPresetId = $derived<string>('');
  let presetDuration = $derived<number>(1);

  function applyPreset(position: 'current' | 'start' | 'end' = 'current') {
    if (!selectedPresetId) return;

    let startTime: number;
    switch (position) {
      case 'start':
        startTime = layer.enterTime ?? 0;
        break;
      case 'end':
        startTime = (layer.exitTime ?? projectStore.state.duration) - presetDuration;
        break;
      default:
        startTime = projectStore.currentTime;
    }

    projectStore.applyPreset(layer.id, selectedPresetId, startTime, presetDuration);

    // Reset selection after applying
    selectedPresetId = '';
    presetDuration = 1;
  }
</script>

<InputsWrapper
  fields={[
    { for: `enter-time-${layer.id}`, labels: 'Enter (s)' },
    { for: `exit-time-${layer.id}`, labels: 'Exit (s)' }
  ]}
>
  <ScrubInput
    id={`enter-time-${layer.id}`}
    value={layer.enterTime ?? 0}
    min={Math.max(
      0,
      (layer.exitTime ?? projectStore.state.duration) - (layer.contentDuration ?? 0)
    )}
    max={layer.contentDuration !== undefined
      ? Math.min(
          projectStore.state.duration,
          projectStore.state.duration - (layer.contentDuration - (layer.contentOffset ?? 0))
        )
      : projectStore.state.duration}
    step={0.1}
    onchange={(v) => projectStore.setLayerEnterTime(layer.id, v)}
  />
  <ScrubInput
    id={`exit-time-${layer.id}`}
    value={layer.exitTime ?? projectStore.state.duration}
    min={0}
    max={Math.min(
      projectStore.state.duration,
      (layer.enterTime ?? 0) + (layer.contentDuration ?? 0)
    )}
    step={0.1}
    onchange={(v) => projectStore.setLayerExitTime(layer.id, v)}
  />
</InputsWrapper>

<!-- Content offset control for time-based layers -->
{#if layer.type === 'video' || layer.type === 'audio'}
  {@const contentDuration = layer.contentDuration ?? 0}
  {@const contentOffset = layer.contentOffset ?? 0}
  {@const hasDuration = contentDuration > 0}
  <InputWrapper for="content-offset" label="Start offset (s)">
    {#snippet labelExtra()}
      {#if hasDuration}
        <span class="text-[10px] text-muted-foreground/60">
          Duration: {contentDuration.toFixed(1)}s
        </span>
      {/if}
    {/snippet}
    <ScrubInput
      id="content-offset"
      value={contentOffset}
      min={0}
      max={hasDuration ? contentDuration - 0.1 : undefined}
      step={0.1}
      onchange={(v) => {
        const clamped = hasDuration ? Math.min(v, contentDuration - 0.1) : Math.max(0, v);
        projectStore.updateLayer(layer.id, { contentOffset: clamped });

        // Auto-adjust exitTime if it would exceed available content
        if (hasDuration && layer.exitTime !== undefined) {
          const enterTime = layer.enterTime ?? 0;
          const maxVisibleDuration = contentDuration - clamped;
          const maxExitTime = enterTime + maxVisibleDuration;
          if (layer.exitTime > maxExitTime) {
            projectStore.setLayerExitTime(layer.id, maxExitTime);
          }
        }
      }}
    />
    <p class="text-[10px] text-muted-foreground/70">Where to start playing in the source media</p>
    {#if !hasDuration && layer.props.src}
      <p class="text-[10px] text-muted-foreground/70">Upload a new file to detect duration</p>
    {/if}
  </InputWrapper>
  <Button
    variant="outline"
    size="sm"
    class="w-full text-xs"
    onclick={() => projectStore.splitLayer(layer.id)}
  >
    Split at Playhead
  </Button>
{/if}

<InputsWrapper
  fields={[
    {
      for: 'animation-preset',
      labels: 'Animation'
    },
    {
      for: 'preset-duration',
      labels: 'Duration (s)'
    }
  ]}
>
  {#snippet prefix()}
    <Label class="text-xs text-muted-foreground">Apply Animation</Label>
  {/snippet}
  <AnimationPresetSelect
    value={selectedPresetId}
    duration={presetDuration}
    onChange={(v) => {
      selectedPresetId = v;
    }}
  />
  <ScrubInput
    id="preset-duration"
    value={presetDuration}
    min={0.1}
    step={0.1}
    onchange={(v) => (presetDuration = v)}
  />
</InputsWrapper>

<ButtonGroup.Root class="w-full">
  <Button
    variant="default"
    size="sm"
    class="flex-1 text-xs"
    onclick={() => applyPreset('current')}
    disabled={!selectedPresetId}
  >
    At Playhead
  </Button>
  <Button
    variant="default"
    size="sm"
    class="flex-1 text-xs"
    onclick={() => applyPreset('start')}
    disabled={!selectedPresetId}
  >
    At Start
  </Button>
  <Button
    variant="default"
    size="sm"
    class="flex-1 text-xs"
    onclick={() => applyPreset('end')}
    disabled={!selectedPresetId}
  >
    At End
  </Button>
</ButtonGroup.Root>

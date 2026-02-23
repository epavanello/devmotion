<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import { Label } from '$lib/components/ui/label';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { animationPresets, getEnterPresets, getExitPresets } from '$lib/engine/presets';
  import type { LayerTransition } from '$lib/schemas/animation';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import ScrubInput from '../../scrub-input.svelte';
  import AnimationPresetSelect from '../animation-preset-select.svelte';
  import InputWrapper from '../../input-wrapper.svelte';

  const { layer }: { layer: TypedLayer } = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const enterPresets = $derived([
    { id: '', name: 'None', category: 'enter' as const, keyframes: [] },
    ...getEnterPresets()
  ]);

  const exitPresets = $derived([
    { id: '', name: 'None', category: 'exit' as const, keyframes: [] },
    ...getExitPresets()
  ]);

  let enterPresetId = $derived<string>(layer.enterTransition?.presetId ?? '');
  let enterDuration = $derived<number>(layer.enterTransition?.duration ?? 1);
  let exitPresetId = $derived<string>(layer.exitTransition?.presetId ?? '');
  let exitDuration = $derived<number>(layer.exitTransition?.duration ?? 1);
  let selectedPresetId = $derived<string>('');
  let presetDuration = $derived<number>(1);

  function updateTransition(type: 'enter' | 'exit', presetId: string, duration: number) {
    const transition: LayerTransition | undefined = presetId ? { presetId, duration } : undefined;
    const key = type === 'enter' ? 'enterTransition' : 'exitTransition';
    projectStore.updateLayer(layer.id, { [key]: transition });
  }

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
    { for: 'enter-time', labels: 'Enter (s)' },
    { for: 'exit-time', labels: 'Exit (s)' }
  ]}
>
  <ScrubInput
    id="enter-time"
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
    id="exit-time"
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

<InputsWrapper
  fields={[
    { for: 'enter-preset', labels: 'Animation' },
    { for: 'enter-duration', labels: 'Duration (s)' }
  ]}
>
  {#snippet prefix()}
    <Label class="text-xs text-muted-foreground">Enter Transition</Label>
  {/snippet}
  <AnimationPresetSelect
    id="enter-preset"
    value={enterPresetId}
    options={enterPresets}
    placeholder="None"
    duration={enterDuration}
    onchange={(v) => {
      enterPresetId = v;
      updateTransition('enter', v, enterDuration);
    }}
  />
  <ScrubInput
    id="enter-duration"
    value={enterDuration}
    min={0.1}
    max={5}
    step={0.1}
    disabled={!enterPresetId}
    onchange={(v) => {
      enterDuration = v;
      updateTransition('enter', enterPresetId, v);
    }}
  />
</InputsWrapper>

<InputsWrapper
  fields={[
    { for: 'exit-preset', labels: 'Animation' },
    { for: 'exit-duration', labels: 'Duration (s)' }
  ]}
>
  {#snippet prefix()}
    <Label class="text-xs text-muted-foreground">Exit Transition</Label>
  {/snippet}
  <AnimationPresetSelect
    id="exit-preset"
    value={exitPresetId}
    options={exitPresets}
    placeholder="None"
    duration={exitDuration}
    onchange={(v) => {
      exitPresetId = v;
      updateTransition('exit', v, exitDuration);
    }}
  />
  <ScrubInput
    id="exit-duration"
    value={exitDuration}
    min={0.1}
    max={5}
    step={0.1}
    disabled={!exitPresetId}
    onchange={(v) => {
      exitDuration = v;
      updateTransition('exit', exitPresetId, v);
    }}
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
    id="animation-preset"
    value={selectedPresetId}
    options={animationPresets}
    placeholder="None"
    duration={presetDuration}
    onchange={(v) => {
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

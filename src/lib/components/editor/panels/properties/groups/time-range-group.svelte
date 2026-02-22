<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { getEnterPresets, getExitPresets } from '$lib/engine/presets';
  import type { LayerTransition } from '$lib/schemas/animation';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import ScrubInput from '../../scrub-input.svelte';
  import AnimationPresetSelect from '../animation-preset-select.svelte';

  const { layer }: { layer: TypedLayer } = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const enterPresets = [
    { id: '', name: 'None', description: '', category: 'enter' as const, keyframes: [] },
    ...getEnterPresets()
  ];

  const exitPresets = [
    { id: '', name: 'None', description: '', category: 'exit' as const, keyframes: [] },
    ...getExitPresets()
  ];

  // Derived read-only values from the layer
  const enterPresetId = $derived(layer.enterTransition?.presetId ?? '');
  const enterDuration = $derived(layer.enterTransition?.duration ?? 0.5);
  const exitPresetId = $derived(layer.exitTransition?.presetId ?? '');
  const exitDuration = $derived(layer.exitTransition?.duration ?? 0.5);

  function updateTransition(type: 'enter' | 'exit', presetId: string, duration: number) {
    const transition: LayerTransition | undefined = presetId ? { presetId, duration } : undefined;
    const key = type === 'enter' ? 'enterTransition' : 'exitTransition';
    projectStore.updateLayer(layer.id, { [key]: transition });
  }
</script>

<div class="space-y-3">
  <InputsWrapper
    fields={[
      { for: 'enter-time', labels: 'Enter (s)' },
      { for: 'exit-time', labels: 'Exit (s)' }
    ]}
  >
    <ScrubInput
      id="enter-time"
      value={layer.enterTime ?? 0}
      min={0}
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
      max={projectStore.state.duration}
      step={0.1}
      onchange={(v) => projectStore.setLayerExitTime(layer.id, v)}
    />
  </InputsWrapper>

  <div class="space-y-2">
    <Label class="text-xs text-muted-foreground">Enter Transition</Label>
    <InputsWrapper
      fields={[
        { for: 'enter-preset', labels: 'Animation' },
        { for: 'enter-duration', labels: 'Duration (s)' }
      ]}
    >
      <AnimationPresetSelect
        value={enterPresetId}
        options={enterPresets}
        placeholder="None"
        onchange={(v) => updateTransition('enter', v, enterDuration)}
      />
      {#if enterPresetId}
        <ScrubInput
          id="enter-duration"
          value={enterDuration}
          min={0.1}
          max={5}
          step={0.1}
          onchange={(v) => updateTransition('enter', enterPresetId, v)}
        />
      {/if}
    </InputsWrapper>
  </div>

  <div class="space-y-2">
    <Label class="text-xs text-muted-foreground">Exit Transition</Label>
    <InputsWrapper
      fields={[
        { for: 'exit-preset', labels: 'Animation' },
        { for: 'exit-duration', labels: 'Duration (s)' }
      ]}
    >
      <AnimationPresetSelect
        value={exitPresetId}
        options={exitPresets}
        placeholder="None"
        onchange={(v) => updateTransition('exit', v, exitDuration)}
      />
      {#if exitPresetId}
        <ScrubInput
          id="exit-duration"
          value={exitDuration}
          min={0.1}
          max={5}
          step={0.1}
          onchange={(v) => updateTransition('exit', exitPresetId, v)}
        />
      {/if}
    </InputsWrapper>
  </div>
</div>

<!-- Content offset control for time-based layers -->
{#if layer.type === 'video' || layer.type === 'audio'}
  {@const contentDuration = layer.contentDuration ?? 0}
  {@const contentOffset = layer.contentOffset ?? 0}
  {@const hasDuration = contentDuration > 0}
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <Label class="text-xs text-muted-foreground">Content Trim</Label>
      {#if hasDuration}
        <span class="text-[10px] text-muted-foreground/60">
          Duration: {contentDuration.toFixed(1)}s
        </span>
      {/if}
    </div>
    <div class="space-y-1">
      <Label class="text-[10px] text-muted-foreground">Start offset (s)</Label>
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
    </div>
    {#if !hasDuration && layer.props.src}
      <p class="text-[10px] text-muted-foreground/70">Upload a new file to detect duration</p>
    {/if}
    <Button
      variant="outline"
      size="sm"
      class="w-full text-xs"
      onclick={() => projectStore.splitLayer(layer.id)}
    >
      Split at Playhead
    </Button>
  </div>
{/if}

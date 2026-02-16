<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import ScrubInput from '../../scrub-input.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  const { layer }: { layer: TypedLayer } = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);
</script>

<div class="grid grid-cols-2 gap-2">
  <div class="space-y-1">
    <Label class="text-xs text-muted-foreground">Enter (s)</Label>
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
  </div>
  <div class="space-y-1">
    <Label class="text-xs text-muted-foreground">Exit (s)</Label>
    <ScrubInput
      id="exit-time"
      value={layer.exitTime ?? projectStore.state.duration}
      min={0}
      max={projectStore.state.duration}
      step={0.1}
      onchange={(v) => projectStore.setLayerExitTime(layer.id, v)}
    />
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

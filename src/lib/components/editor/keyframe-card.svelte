<script lang="ts">
  import type { Keyframe, EasingType, Easing } from '$lib/types/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import { Trash2, Palette, Move, RotateCw, Scale, Eye, Clock } from '@lucide/svelte';
  import ScrubInput from './panels/scrub-input.svelte';

  interface Props {
    keyframe: Keyframe;
    layerId: string;
    readonlyTime?: boolean;
  }

  let { keyframe, layerId, readonlyTime = false }: Props = $props();

  const easingOptions: { value: EasingType; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In-Out' }
  ];

  function getPropertyLabel(property: string): string {
    const labels: Record<string, string> = {
      'position.x': 'Position X',
      'position.y': 'Position Y',
      'position.z': 'Position Z',
      'rotation.x': 'Rotation X',
      'rotation.y': 'Rotation Y',
      'rotation.z': 'Rotation Z',
      'scale.x': 'Scale X',
      'scale.y': 'Scale Y',
      'scale.z': 'Scale Z',
      opacity: 'Opacity',
      color: 'Color'
    };
    if (labels[property]) return labels[property];

    if (property.startsWith('props.')) {
      const propName = property.slice(6);
      return propName.charAt(0).toUpperCase() + propName.slice(1);
    }

    return property;
  }

  function getPropertyIcon(property: string) {
    if (property.startsWith('position.')) return Move;
    if (property.startsWith('rotation.')) return RotateCw;
    if (property.startsWith('scale.')) return Scale;
    if (property === 'opacity') return Eye;
    if (property === 'color') return Palette;
    return Move;
  }

  function formatValue(value: number | string | boolean): string {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value;
  }

  function handleDelete() {
    projectStore.removeKeyframe(layerId, keyframe.id);
  }

  function handleGoToTime() {
    projectStore.setCurrentTime(keyframe.time);
  }

  function handleTimeChange(newTime: number) {
    const clampedTime = Math.max(0, Math.min(newTime, projectStore.project.duration));
    projectStore.updateKeyframe(layerId, keyframe.id, { time: clampedTime });
  }

  function handleEasingChange(easingType: EasingType) {
    const newEasing: Easing = { type: easingType };
    projectStore.updateKeyframe(layerId, keyframe.id, { easing: newEasing });
  }

  const Icon = $derived(getPropertyIcon(keyframe.property));
</script>

<div class="group rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40">
  <div class="flex items-start justify-between gap-2">
    <button
      type="button"
      onclick={handleGoToTime}
      class="flex flex-1 items-center gap-2 text-left transition-colors hover:text-foreground"
    >
      <Icon class="h-4 w-4 text-muted-foreground" />
      <span class="text-sm font-semibold">{getPropertyLabel(keyframe.property)}</span>
    </button>

    <Popover.Root>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            {...props}
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-64" align="end" side="left">
        <div class="space-y-2">
          <h4 class="leading-none font-medium">Delete Keyframe</h4>
          <p class="text-sm text-muted-foreground">
            Delete keyframe for {getPropertyLabel(keyframe.property)} at {keyframe.time.toFixed(
              2
            )}s? This cannot be undone.
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <Popover.Close>
              {#snippet child({ props })}
                <Button variant="outline" size="sm" {...props}>Cancel</Button>
              {/snippet}
            </Popover.Close>
            <Popover.Close>
              {#snippet child({ props })}
                <Button variant="destructive" size="sm" {...props} onclick={handleDelete}>
                  Delete
                </Button>
              {/snippet}
            </Popover.Close>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>

  <div class="mt-3 space-y-2">
    <div class="flex items-center gap-2 text-xs">
      <Clock class="h-3.5 w-3.5 text-muted-foreground" />
      {#if readonlyTime}
        <span class="font-mono font-medium">{keyframe.time.toFixed(2)}s</span>
      {:else}
        <div class="relative flex-1">
          <ScrubInput
            value={keyframe.time}
            step={0.01}
            min={0}
            max={projectStore.project.duration}
            onchange={handleTimeChange}
          />
          <span
            class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground"
          >
            s
          </span>
        </div>
      {/if}
      <span class="text-muted-foreground">=</span>
      <span class="min-w-[60px] font-mono font-medium tabular-nums">
        {formatValue(keyframe.value)}
      </span>
    </div>

    <div class="flex items-center gap-2 text-xs">
      <span class="text-muted-foreground">Easing:</span>
      <select
        value={keyframe.easing.type}
        onchange={(e) => handleEasingChange(e.currentTarget.value as EasingType)}
        class="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        {#each easingOptions as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<script lang="ts">
  import type { KeyframeSegment } from '$lib/utils/keyframe-segments';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import { Trash2, Palette, Move, RotateCw, Scale, Eye, ScanSearch, Clock } from '@lucide/svelte';
  import ScrubInput from './panels/scrub-input.svelte';
  import InputsWrapper from './panels/inputs-wrapper.svelte';
  import InterpolationSelect from './panels/properties/interpolation-select.svelte';
  import {
    getPropertyCategory,
    getTransformInputId,
    getStyleInputId,
    isTransformProperty,
    isStyleProperty
  } from '$lib/utils/property-names';
  import { BaseAnimatablePropertyLabels, type BaseAnimatableProperty } from '$lib/schemas/base';
  import type { LiteralUnion } from 'type-fest';
  import type { AnimatableProperty, Interpolation } from '$lib/types/animation';
  import * as Card from '$lib/components/ui/card';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    segment: KeyframeSegment;
    layerId: string;
    layerType: string;
    /** Compact mode for timeline popover (hides time editing) */
    compact?: boolean;
    /** Callback when "go to property" is clicked */
    onGoToPropertyClick?: () => void;
  }

  let { segment, layerId, layerType, compact = false, onGoToPropertyClick }: Props = $props();

  const { startKeyframe, endKeyframe, isFinal } = $derived(segment);

  function getPropertyLabel(property: LiteralUnion<BaseAnimatableProperty, string>): string {
    if (property in BaseAnimatablePropertyLabels) {
      return BaseAnimatablePropertyLabels[property as BaseAnimatableProperty];
    }

    if (property.startsWith('props.')) {
      const propName = property.slice(6);
      return propName.charAt(0).toUpperCase() + propName.slice(1);
    }

    return property;
  }

  function getPropertyIcon(property: AnimatableProperty) {
    if (property.startsWith('rotation.')) return RotateCw;
    if (property.startsWith('scale.')) return Scale;
    if (isTransformProperty(property)) return Move;
    if (isStyleProperty(property)) return Eye;
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

  function handleDeleteKeyframe(keyframeId: string) {
    projectStore.removeKeyframe(layerId, keyframeId);
  }

  function handleGoToTime() {
    projectStore.setCurrentTime(startKeyframe.time);
  }

  function handleTimeChange(newTime: number) {
    const clampedTime = Math.max(0, Math.min(newTime, projectStore.state.duration));
    projectStore.updateKeyframe(layerId, startKeyframe.id, { time: clampedTime });
  }

  function handleEndTimeChange(newTime: number) {
    if (!endKeyframe) return;
    const clampedTime = Math.max(0, Math.min(newTime, projectStore.state.duration));
    projectStore.updateKeyframe(layerId, endKeyframe.id, { time: clampedTime });
  }

  function handleInterpolationChange(interpolation: Interpolation) {
    projectStore.updateKeyframe(layerId, startKeyframe.id, { interpolation });
  }

  const Icon = $derived(getPropertyIcon(startKeyframe.property));

  function getInputIdFromProperty(property: AnimatableProperty): string {
    const category = getPropertyCategory(property);

    if (category === 'transform') {
      return getTransformInputId(property);
    }
    if (category === 'style') {
      return getStyleInputId(property);
    }
    if (property.startsWith('props.')) {
      return property;
    }

    return property;
  }

  function handleGoToProperty() {
    onGoToPropertyClick?.();
    const property = startKeyframe.property;
    const inputId = getInputIdFromProperty(property);

    const input = document.getElementById(inputId) as HTMLElement | null;
    if (input) {
      const groupToggle = input
        .closest('.properties-group-content[data-open="false"]')
        ?.querySelector<HTMLButtonElement>('.properties-group-header');

      if (groupToggle) {
        groupToggle.click();
      }

      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        (input as HTMLInputElement)?.focus?.();
        (input as HTMLInputElement)?.select?.();
      }, 500);
    }
  }
</script>

<Card.Root size="compact" class="group bg-muted/20 transition-colors hover:bg-muted/40">
  <Card.Header size="compact" class="flex items-center gap-2">
    <Icon class="h-4 w-4 text-muted-foreground" />
    <Card.Title class="flex-1 text-sm">{getPropertyLabel(startKeyframe.property)}</Card.Title>

    <Card.Action class="flex gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        class="opacity-0 transition-opacity group-hover:opacity-100"
        onclick={handleGoToTime}
        title="Go to {startKeyframe.time.toFixed(2)}s"
        icon={Clock}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        class="opacity-0 transition-opacity group-hover:opacity-100"
        onclick={handleGoToProperty}
        title="Jump to property"
        icon={ScanSearch}
      />

      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              variant="ghost"
              size="icon-sm"
              class="opacity-0 transition-opacity group-hover:opacity-100"
              icon={Trash2}
              title="Delete keyframe"
              {...props}
            />
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-64" align="end" side="left">
          <div class="space-y-2">
            <h4 class="leading-none font-medium">Delete Keyframe</h4>
            <p class="text-sm text-muted-foreground">
              {#if compact}
                Delete keyframe at {startKeyframe.time.toFixed(2)}s?
              {:else if isFinal}
                Delete keyframe at {startKeyframe.time.toFixed(2)}s?
              {:else if endKeyframe}
                Delete keyframes at {startKeyframe.time.toFixed(2)}s and {endKeyframe.time.toFixed(
                  2
                )}s?
              {/if}
              This cannot be undone.
            </p>
            <div class="flex justify-end gap-2 pt-2">
              <Popover.Close>
                {#snippet child({ props })}
                  <Button variant="outline" size="sm" {...props}>Cancel</Button>
                {/snippet}
              </Popover.Close>
              <Popover.Close>
                {#snippet child({ props })}
                  <Button
                    variant="destructive"
                    size="sm"
                    {...props}
                    onclick={() => {
                      handleDeleteKeyframe(startKeyframe.id);
                      // In compact mode, only delete the start keyframe (the clicked one)
                      // In full mode, delete both start and end for transition segments
                      if (!compact && endKeyframe) {
                        handleDeleteKeyframe(endKeyframe.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                {/snippet}
              </Popover.Close>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </Card.Action>
  </Card.Header>

  <Card.Content size="compact" class="space-y-2">
    {#if isFinal}
      <!-- Final keyframe: no interpolation, just holds value -->
      {#if compact}
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span class="font-mono font-medium">{startKeyframe.time.toFixed(2)}s</span>
          <span>=</span>
          <span class="font-mono font-medium">{formatValue(startKeyframe.value)}</span>
        </div>
      {:else}
        <InputsWrapper fields={[{ for: `final-time-${startKeyframe.id}`, labels: 'Time' }]}>
          <ScrubInput
            id={`final-time-${startKeyframe.id}`}
            value={startKeyframe.time}
            step={0.01}
            min={0}
            max={projectStore.state.duration}
            onchange={handleTimeChange}
            postFix="s"
          />
          <div
            class="flex h-7 items-center rounded-md border border-input bg-muted px-2 font-mono text-sm tabular-nums"
          >
            {formatValue(startKeyframe.value)}
          </div>
        </InputsWrapper>
      {/if}

      <div class="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>⏹ Final value (holds)</span>
      </div>
    {:else if endKeyframe}
      <!-- Transition segment: FROM → TO with interpolation -->
      {#if compact}
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span class="font-mono font-medium">{startKeyframe.time.toFixed(2)}s</span>
          <span class="font-mono">{formatValue(startKeyframe.value)}</span>
          <span>→</span>
          <span class="font-mono font-medium">{endKeyframe.time.toFixed(2)}s</span>
          <span class="font-mono">{formatValue(endKeyframe.value)}</span>
        </div>
      {:else}
        <InputsWrapper
          fields={[
            {
              for: `start-time-${startKeyframe.id}`,
              labels: 'From',
              postFix: `= ${formatValue(startKeyframe.value)}`
            },
            {
              for: `end-time-${endKeyframe.id}`,
              labels: 'To',
              postFix: `= ${formatValue(endKeyframe.value)}`
            }
          ]}
        >
          <ScrubInput
            id={`start-time-${startKeyframe.id}`}
            value={startKeyframe.time}
            step={0.01}
            min={0}
            max={projectStore.state.duration}
            onchange={handleTimeChange}
            postFix="s"
          />
          <ScrubInput
            id={`end-time-${endKeyframe.id}`}
            value={endKeyframe.time}
            step={0.01}
            min={0}
            max={projectStore.state.duration}
            onchange={handleEndTimeChange}
            postFix="s"
          />
        </InputsWrapper>

        <InterpolationSelect
          id={`interpolation-${startKeyframe.id}`}
          {layerType}
          property={startKeyframe.property}
          value={startKeyframe.interpolation}
          onchange={handleInterpolationChange}
        />
      {/if}
    {/if}
  </Card.Content>
</Card.Root>

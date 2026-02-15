<script lang="ts">
  import type {
    Keyframe,
    Interpolation,
    InterpolationFamily,
    AnimatableProperty
  } from '$lib/types/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import { Trash2, Palette, Move, RotateCw, Scale, Eye, Clock, ScanSearch } from '@lucide/svelte';
  import ScrubInput from './panels/scrub-input.svelte';
  import {
    getPropertyCategory,
    getTransformInputId,
    getStyleInputId,
    isTransformProperty,
    isStyleProperty
  } from '$lib/utils/property-names';
  import {
    getStrategyOptionsForFamilies,
    getSupportedInterpolationFamilies,
    getDefaultInterpolationForProperty
  } from '$lib/utils/interpolation-utils';
  import Select from '../ui/select/select.svelte';
  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    keyframe: Keyframe;
    layerId: string;
    layerType: string;
    readonlyTime?: boolean;
    onGoToPropertyClick?: () => void;
  }

  let { keyframe, layerId, layerType, readonlyTime = false, onGoToPropertyClick }: Props = $props();

  // Get supported interpolation families from layer schema
  const supportedFamilies = $derived(
    getSupportedInterpolationFamilies(layerType, keyframe.property)
  );

  const interpolation: Interpolation | undefined = $derived(keyframe.interpolation);

  const activeFamily = $derived.by(() => {
    if (!interpolation) {
      return supportedFamilies[0];
    }
    return interpolation.family;
  });

  // Check if multiple families are supported
  const hasMultipleFamilies = $derived(supportedFamilies.length > 1);

  // Get strategy options for the current family
  const currentFamilyOptions = $derived(getStrategyOptionsForFamilies([activeFamily]));

  // Family labels for display
  const familyLabels: Record<InterpolationFamily, string> = {
    continuous: 'Continuous',
    discrete: 'Discrete',
    quantized: 'Quantized',
    text: 'Text'
  };

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

  function getPropertyIcon(property: AnimatableProperty) {
    if (isTransformProperty(property)) return Move;
    if (property.startsWith('rotation.')) return RotateCw;
    if (property.startsWith('scale.')) return Scale;
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

  function handleDelete() {
    projectStore.removeKeyframe(layerId, keyframe.id);
  }

  function handleGoToTime() {
    projectStore.setCurrentTime(keyframe.time);
  }

  function handleTimeChange(newTime: number) {
    const clampedTime = Math.max(0, Math.min(newTime, projectStore.state.duration));
    projectStore.updateKeyframe(layerId, keyframe.id, { time: clampedTime });
  }

  function handleFamilyChange(family: InterpolationFamily) {
    // When changing family, use the first strategy available for that family
    let newInterpolation: Interpolation;

    switch (family) {
      case 'continuous':
        newInterpolation = { family: 'continuous', strategy: 'ease-in-out' };
        break;
      case 'discrete':
        newInterpolation = { family: 'discrete', strategy: 'step-end' };
        break;
      case 'quantized':
        newInterpolation = { family: 'quantized', strategy: 'integer' };
        break;
      case 'text':
        newInterpolation = { family: 'text', strategy: 'char-reveal' };
        break;
    }

    projectStore.updateKeyframe(layerId, keyframe.id, { interpolation: newInterpolation });
  }

  function handleStrategyChange(strategy: string) {
    const family = activeFamily;
    let newInterpolation: Interpolation;

    switch (family) {
      case 'continuous':
        newInterpolation = {
          family: 'continuous',
          strategy: strategy as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
        };
        break;

      case 'discrete':
        newInterpolation = {
          family: 'discrete',
          strategy: strategy as 'step-end' | 'step-start' | 'step-mid'
        };
        break;

      case 'quantized':
        if (strategy === 'integer') {
          newInterpolation = { family: 'quantized', strategy: 'integer' };
        } else {
          // For snap-grid, preserve increment if exists, otherwise use default
          const increment =
            interpolation && 'increment' in interpolation ? interpolation.increment : 10;
          newInterpolation = { family: 'quantized', strategy: 'snap-grid', increment };
        }
        break;

      case 'text':
        if (strategy === 'char-reveal') {
          newInterpolation = { family: 'text', strategy: 'char-reveal' };
        } else {
          // For word-reveal, preserve separator if exists, otherwise use default
          const separator =
            interpolation && 'separator' in interpolation ? interpolation.separator : ' ';
          newInterpolation = { family: 'text', strategy: 'word-reveal', separator };
        }
        break;
    }

    projectStore.updateKeyframe(layerId, keyframe.id, { interpolation: newInterpolation });
  }

  const Icon = $derived(getPropertyIcon(keyframe.property));

  /**
   * Maps keyframe property to the input ID in properties panel
   * Uses unified naming convention from property-names utility
   */
  function getInputIdFromProperty(property: AnimatableProperty): string {
    const category = getPropertyCategory(property);

    if (category === 'transform') {
      return getTransformInputId(property);
    }
    if (category === 'style') {
      return getStyleInputId(property);
    }
    // For props.* properties, use the property name directly
    if (property.startsWith('props.')) {
      return property;
    }

    // Fallback: use the property name as-is
    return property;
  }

  /**
   * Scroll to and focus the corresponding input in the properties panel
   * Uses ID attribute to find the input
   */
  function handleGoToProperty() {
    onGoToPropertyClick?.();
    const property = keyframe.property;
    const inputId = getInputIdFromProperty(property);

    // Find input by ID
    const input = document.getElementById(inputId) as HTMLElement | null;
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        (input as HTMLInputElement)?.focus?.();
        (input as HTMLInputElement)?.select?.();
      }, 500);
    }
  }
</script>

<div class="group rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40">
  <div class="flex items-center justify-between gap-2">
    <button
      type="button"
      onclick={handleGoToTime}
      class="flex flex-1 items-center gap-2 text-left transition-colors hover:text-foreground"
    >
      <Icon class="h-4 w-4 text-muted-foreground" />
      <span class="text-sm font-semibold">{getPropertyLabel(keyframe.property)}</span>
    </button>

    <!-- Jump to property button -->
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
            {...props}
          />
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
        <div class="relative">
          <ScrubInput
            value={keyframe.time}
            step={0.01}
            min={0}
            max={projectStore.state.duration}
            onchange={handleTimeChange}
            class="w-12 shrink-0"
          />
          <span
            class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground"
          >
            s
          </span>
        </div>
      {/if}
      <span class="text-muted-foreground">=</span>
      <span
        class="min-w-[60px] overflow-hidden font-mono font-medium text-ellipsis tabular-nums"
        title={formatValue(keyframe.value)}
      >
        {formatValue(keyframe.value)}
      </span>
    </div>

    <!-- Family selector (only shown if multiple families are supported) -->
    {#if hasMultipleFamilies}
      <div class="flex items-center gap-2 text-xs">
        <span class="text-muted-foreground">Family:</span>
        <Select
          value={activeFamily}
          placeholder="Select Family"
          root={{
            onValueChange: (value) => handleFamilyChange(value as InterpolationFamily)
          }}
          trigger={{
            class:
              'h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none'
          }}
          options={supportedFamilies.map((family) => ({
            value: family,
            label: familyLabels[family]
          }))}
        />
      </div>
    {/if}

    <!-- Strategy selector -->
    <div class="flex items-center gap-2 text-xs">
      <span class="text-muted-foreground">
        {activeFamily === 'continuous' ? 'Easing:' : 'Strategy:'}
      </span>
      {#if currentFamilyOptions.length > 0}
        <Select
          value={interpolation?.strategy}
          placeholder="Select Strategy"
          root={{
            onValueChange: (value) => handleStrategyChange(value)
          }}
          trigger={{
            class:
              'h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none'
          }}
          options={currentFamilyOptions.map((option) => ({
            value: option.strategy,
            label: option.label
          }))}
        />
      {/if}
    </div>
  </div>
</div>

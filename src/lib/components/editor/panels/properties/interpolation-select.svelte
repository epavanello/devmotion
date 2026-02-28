<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import type {
    InterpolationFamily,
    Interpolation,
    AnimatableProperty
  } from '$lib/types/animation';
  import type { ContinuousInterpolationStrategy } from '$lib/schemas/animation';
  import {
    getStrategyOptionsForFamilies,
    getSupportedInterpolationFamilies
  } from '$lib/utils/interpolation-utils';
  import InputWrapper from '../input-wrapper.svelte';
  import EasingCurvePreview from './easing-curve-preview.svelte';

  const {
    layerType,
    property,
    value,
    onChange: onchange
  }: {
    layerType: string;
    property: AnimatableProperty;
    value: Interpolation | undefined;
    onChange: (value: Interpolation) => void;
  } = $props();

  const id = $props.id();

  let hoveredStrategy = $state<string | null>(null);
  let previewTime = $state(0);
  let animationFrameId: number | null = null;

  // Get supported interpolation families from layer schema
  const supportedFamilies = $derived(getSupportedInterpolationFamilies(layerType, property));

  const activeFamily = $derived.by(() => {
    if (!value) {
      return supportedFamilies[0];
    }
    return value.family;
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

  // Current strategy
  const currentStrategy = $derived(value?.strategy);

  // Hovered option for preview
  const hoveredOption = $derived(
    currentFamilyOptions.find((opt) => opt.strategy === hoveredStrategy)
  );

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

    onchange(newInterpolation);
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
          const increment = value && 'increment' in value ? value.increment : 10;
          newInterpolation = { family: 'quantized', strategy: 'snap-grid', increment };
        }
        break;

      case 'text':
        if (strategy === 'char-reveal') {
          newInterpolation = { family: 'text', strategy: 'char-reveal' };
        } else {
          // For word-reveal, preserve separator if exists, otherwise use default
          const separator = value && 'separator' in value ? value.separator : ' ';
          newInterpolation = { family: 'text', strategy: 'word-reveal', separator };
        }
        break;
    }

    onchange(newInterpolation);
  }

  function startPreview(strategy: string) {
    hoveredStrategy = strategy;
    previewTime = 0;

    const startTime = performance.now();
    const duration = 1000; // 1 second animation

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      previewTime = (elapsed % duration) / duration;
      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function stopPreview() {
    hoveredStrategy = null;
    previewTime = 0;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function handleValueChange(newValue: string | undefined) {
    if (newValue) {
      handleStrategyChange(newValue);
      stopPreview();
    }
  }

  $effect(() => {
    return () => {
      stopPreview();
    };
  });
</script>

<!-- Family selector (only shown if multiple families are supported) -->
{#if hasMultipleFamilies}
  <InputWrapper label="Family" for="family">
    <Select.Root
      type="single"
      value={activeFamily}
      onValueChange={(v) => v && handleFamilyChange(v as InterpolationFamily)}
    >
      <Select.Trigger id="family" class="w-full">
        {familyLabels[activeFamily]}
      </Select.Trigger>
      <Select.Content>
        {#each supportedFamilies as family (family)}
          <Select.Item value={family}>{familyLabels[family]}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </InputWrapper>
{/if}

<InputWrapper label={activeFamily === 'continuous' ? 'Easing:' : 'Strategy:'} for={id}>
  {#if currentFamilyOptions.length > 0}
    <Select.Root type="single" value={currentStrategy} onValueChange={handleValueChange}>
      <Select.Trigger {id} class="w-full">
        {currentFamilyOptions.find((opt) => opt.strategy === currentStrategy)?.label ??
          'Select strategy'}
      </Select.Trigger>
      <Select.Content
        class="max-h-[calc(100vh-20rem)] p-0"
        onmouseleave={stopPreview}
        align="start"
      >
        <!-- Preview visualization for continuous easing -->
        {#if hoveredOption && activeFamily === 'continuous'}
          <EasingCurvePreview
            strategy={hoveredOption.strategy as ContinuousInterpolationStrategy}
            progress={previewTime}
          />
        {/if}

        {#each currentFamilyOptions as option (option.strategy)}
          <Select.Item value={option.strategy} onmouseenter={() => startPreview(option.strategy)}>
            {option.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/if}
</InputWrapper>

<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import type { InterpolationFamily, Interpolation } from '$lib/types/animation';
  import type { ContinuousInterpolationStrategy } from '$lib/schemas/animation';
  import {
    getStrategyOptionsForFamilies,
    getSupportedInterpolationFamilies
  } from '$lib/utils/interpolation-utils';
  import { getEasingFunction } from '$lib/engine/interpolation';
  import InputWrapper from '../input-wrapper.svelte';

  const {
    id,
    layerType,
    property,
    value,
    onchange
  }: {
    id: string;
    layerType: string;
    property: string;
    value: Interpolation | undefined;
    onchange: (interpolation: Interpolation) => void;
  } = $props();

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

  // Generate SVG path for the easing curve and calculate bounds
  const curveData = $derived.by(() => {
    if (!hoveredOption || activeFamily !== 'continuous') {
      return { path: '', viewBox: '0 0 100 100', minY: 0, maxY: 1 };
    }

    const easingFn = getEasingFunction(hoveredOption.strategy as ContinuousInterpolationStrategy);
    const steps = 50; // Number of points to sample
    const values: number[] = [];

    // Sample the easing function to get all Y values
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      values.push(easingFn(t));
    }

    // Find min/max Y values to determine bounds (with some padding)
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const padding = 0.1; // 10% padding
    const rangeY = maxY - minY;
    const paddedMinY = minY - rangeY * padding;
    const paddedMaxY = maxY + rangeY * padding;
    const paddedRangeY = paddedMaxY - paddedMinY;

    // Build points normalized to the padded range
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * 100; // X coordinate (time)
      // Normalize Y to 0-100 range based on padded min/max, then invert for SVG
      const normalizedY = ((values[i] - paddedMinY) / paddedRangeY) * 100;
      const y = 100 - normalizedY; // Inverted because SVG Y grows downward
      points.push([x, y]);
    }

    // Build SVG path
    const path = points
      .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
      .join(' ');

    return { path, viewBox: '0 0 100 100', minY: paddedMinY, maxY: paddedMaxY };
  });

  // Current position on the easing curve (for the animated dot)
  const previewDot = $derived.by(() => {
    if (!hoveredOption || activeFamily !== 'continuous') return { x: 0, y: 0 };

    const easingFn = getEasingFunction(hoveredOption.strategy as ContinuousInterpolationStrategy);
    const rawY = easingFn(previewTime);

    // Normalize to the same range as the curve
    const { minY, maxY } = curveData;
    const normalizedY = ((rawY - minY) / (maxY - minY)) * 100;

    return {
      x: previewTime * 100,
      y: 100 - normalizedY // Inverted for SVG
    };
  });

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
          <div
            class="sticky top-0 z-10 flex items-center justify-center border-b border-border bg-background p-4"
          >
            <div class="relative h-20 w-20 overflow-hidden rounded border border-border">
              <!-- Easing curve visualization -->
              <svg class="h-full w-full" viewBox={curveData.viewBox} preserveAspectRatio="none">
                <!-- Grid lines at 0 and 1 normalized positions -->
                <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" opacity="0.1" />
                <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" opacity="0.1" />
                <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" opacity="0.1" />
                <line x1="100" y1="0" x2="100" y2="100" stroke="currentColor" opacity="0.1" />

                <!-- Easing curve -->
                <path
                  d={curveData.path}
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-primary"
                />

                <!-- Animated dot -->
                <circle
                  cx={previewDot.x}
                  cy={previewDot.y}
                  r="3"
                  fill="currentColor"
                  class="text-primary"
                />
              </svg>
            </div>
          </div>
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

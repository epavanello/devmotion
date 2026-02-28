<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import type { ContinuousInterpolationStrategy } from '$lib/schemas/animation';
  import { interpolationLabels } from '$lib/utils/interpolation-utils';
  import type { CustomPropertyComponentProps } from '$lib/layers/properties/field-registry';
  import EasingCurvePreview from './easing-curve-preview.svelte';

  const {
    value,
    onChange: onchange
  }: CustomPropertyComponentProps<ContinuousInterpolationStrategy> = $props();

  let hoveredStrategy = $state<string | null>(null);
  let previewTime = $state(0);
  let animationFrameId: number | null = null;

  // Get all continuous easing options
  const easingOptions = Object.entries(interpolationLabels.continuous).map(([strategy, label]) => ({
    strategy: strategy as ContinuousInterpolationStrategy,
    label
  }));

  // Hovered option for preview
  const hoveredOption = $derived(easingOptions.find((opt) => opt.strategy === hoveredStrategy));

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
      onchange(newValue as ContinuousInterpolationStrategy);
      stopPreview();
    }
  }

  $effect(() => {
    return () => {
      stopPreview();
    };
  });
</script>

<Select.Root type="single" {value} onValueChange={handleValueChange}>
  <Select.Trigger class="w-full">
    {easingOptions.find((opt) => opt.strategy === value)?.label ?? 'Select easing'}
  </Select.Trigger>
  <Select.Content class="max-h-[calc(100vh-20rem)] p-0" onmouseleave={stopPreview} align="start">
    <!-- Preview visualization -->
    {#if hoveredOption}
      <EasingCurvePreview strategy={hoveredOption.strategy} progress={previewTime} />
    {/if}

    {#each easingOptions as option (option.strategy)}
      <Select.Item value={option.strategy} onmouseenter={() => startPreview(option.strategy)}>
        {option.label}
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>

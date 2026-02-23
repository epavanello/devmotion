<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import type { TypedAnimationPreset } from '$lib/engine/presets';
  import { getLayerTransform, getLayerStyle } from '$lib/engine/layer-rendering';
  import { generateTransformCSS, generateFilterCSS } from '$lib/layers/base';
  import { createLayer } from '$lib/engine/layer-factory';
  import { SvelteMap } from 'svelte/reactivity';

  const {
    id,
    value,
    options,
    placeholder = 'Select animation',
    duration,
    onchange
  }: {
    id: string;
    value: string;
    options: TypedAnimationPreset[];
    placeholder?: string;
    duration: number;
    onchange: (value: string) => void;
  } = $props();

  let hoveredPresetId = $state<string | null>(null);
  let previewTime = $state(0);
  let animationFrameId: number | null = null;

  const selectedPreset = $derived(options.find((opt) => opt.id === value));
  const hoveredPreset = $derived(options.find((opt) => opt.id === hoveredPresetId));

  // Category label map
  const categoryLabels: Record<string, string> = {
    enter: 'Enter',
    exit: 'Exit',
    generic: 'Generic'
  };

  // Group presets by category
  const groupedPresets = $derived.by(() => {
    const groups = new SvelteMap<string, TypedAnimationPreset[]>();
    for (const preset of options) {
      const category = preset.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(preset);
    }
    return groups;
  });

  // Create a dummy layer for preview
  const previewLayer = $derived(
    createLayer('shape', {
      layer: { name: 'Preview' },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1 },
        anchor: 'center'
      },
      props: {
        width: 60,
        height: 60,
        stroke: '#2563eb',
        strokeWidth: 2,
        borderRadius: 8
      }
    })
  );

  // Apply preset keyframes to preview layer
  const previewLayerWithKeyframes = $derived.by(() => {
    if (!hoveredPreset) return previewLayer;

    const keyframes = hoveredPreset.keyframes.map((kf) => ({
      id: crypto.randomUUID(),
      time: kf.time,
      property: kf.property,
      value: kf.value,
      interpolation: kf.interpolation
    }));

    return { ...previewLayer, keyframes };
  });

  // Get current transform and style for preview at current time
  // previewTime is normalized 0..1, but functions expect absolute milliseconds
  const previewTimeMs = $derived(previewTime * duration * 1000);
  const previewTransform = $derived(getLayerTransform(previewLayerWithKeyframes, previewTimeMs));
  const previewStyle = $derived(getLayerStyle(previewLayerWithKeyframes, previewTimeMs));
  const previewTransformCSS = $derived(generateTransformCSS(previewTransform));
  const previewFilterCSS = $derived(generateFilterCSS(previewStyle));

  function startPreview(presetId: string) {
    hoveredPresetId = presetId;
    previewTime = 0;

    // Animate preview
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      previewTime = (elapsed % (duration * 1000)) / (duration * 1000);
      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function stopPreview() {
    hoveredPresetId = null;
    previewTime = 0;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function handleValueChange(newValue: string | undefined) {
    if (newValue) {
      onchange(newValue);
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
  <Select.Trigger class="w-full" {id}>
    {selectedPreset?.name ?? placeholder}
  </Select.Trigger>
  <Select.Content class="w-80" onmouseleave={stopPreview}>
    <!-- Sticky preview at the top -->
    {#if hoveredPreset}
      <div
        class="sticky top-0 z-10 flex items-center justify-center border-b border-border bg-background p-4"
      >
        <div
          class="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded border border-border"
        >
          <div
            class="absolute top-1/2 left-1/2"
            style:transform={previewTransformCSS}
            style:filter={previewFilterCSS}
            style:opacity={previewStyle.opacity}
          >
            <div
              class="rounded"
              style:width="{previewLayer.props.width}px"
              style:height="{previewLayer.props.height}px"
              style:border="{previewLayer.props.strokeWidth}px solid {previewLayer.props.stroke}"
              style:border-radius="{previewLayer.props.borderRadius}px"
            ></div>
          </div>
        </div>
      </div>
    {/if}

    {#each [...groupedPresets.entries()] as [category, presets] (category)}
      {#if presets.length > 0}
        <Select.Group>
          <Select.Label>{categoryLabels[category]}</Select.Label>
          {#each presets as preset (preset.id)}
            <Select.Item value={preset.id} onmouseenter={() => startPreview(preset.id)}>
              {preset.name}
            </Select.Item>
          {/each}
        </Select.Group>
      {/if}
    {/each}
  </Select.Content>
</Select.Root>

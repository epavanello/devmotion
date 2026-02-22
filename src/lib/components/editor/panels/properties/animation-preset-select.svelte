<script lang="ts">
  import * as Popover from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { ChevronDown } from '@lucide/svelte';
  import type { TypedAnimationPreset } from '$lib/engine/presets';
  import { getLayerTransform, getLayerStyle } from '$lib/engine/layer-rendering';
  import { generateTransformCSS, generateFilterCSS } from '$lib/layers/base';

  const {
    value,
    options,
    placeholder = 'Select animation',
    onchange
  }: {
    value: string;
    options: TypedAnimationPreset[];
    placeholder?: string;
    onchange: (value: string) => void;
  } = $props();

  let open = $state(false);
  let hoveredPresetId = $state<string | null>(null);
  let previewTime = $state(0);
  let animationFrameId = $state<number | null>(null);

  const selectedPreset = $derived(options.find((opt) => opt.id === value));
  const hoveredPreset = $derived(options.find((opt) => opt.id === hoveredPresetId));

  // Create a dummy layer for preview
  const previewLayer = $derived(
    createLayer('rectangle', {
      name: 'Preview',
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: 'center'
      },
      style: { opacity: 1 },
      props: {
        width: 60,
        height: 60,
        fill: '#3b82f6',
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
      property: kf.property as any,
      value: kf.value,
      interpolation: kf.interpolation
    }));

    return { ...previewLayer, keyframes };
  });

  // Get current transform and style for preview at current time
  const previewTransform = $derived(getLayerTransform(previewLayerWithKeyframes, previewTime, 1));
  const previewStyle = $derived(getLayerStyle(previewLayerWithKeyframes, previewTime, 1));
  const previewTransformCSS = $derived(generateTransformCSS(previewTransform));
  const previewFilterCSS = $derived(generateFilterCSS(previewStyle));

  function startPreview(presetId: string) {
    hoveredPresetId = presetId;
    previewTime = 0;

    // Animate preview
    const startTime = performance.now();
    const duration = 1000; // 1 second loop

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      previewTime = (elapsed % duration) / duration;
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

  function selectPreset(presetId: string) {
    onchange(presetId);
    open = false;
    stopPreview();
  }

  $effect(() => {
    if (!open) {
      stopPreview();
    }
  });
</script>

<Popover.Root bind:open>
  <Popover.Trigger asChild let:props>
    <Button variant="outline" class="w-full justify-between" {...props}>
      {selectedPreset?.name ?? placeholder}
      <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-80 p-2" align="start">
    <div class="grid grid-cols-1 gap-1">
      {#each options as preset (preset.id)}
        {@const isSelected = value === preset.id}
        {@const isHovered = hoveredPresetId === preset.id}
        <button
          class="flex items-center justify-between rounded px-3 py-2 text-sm transition-colors hover:bg-accent"
          class:bg-accent={isSelected}
          onmouseenter={() => startPreview(preset.id)}
          onmouseleave={stopPreview}
          onclick={() => selectPreset(preset.id)}
        >
          <span class="flex-1 text-left">{preset.name}</span>
          {#if isHovered}
            <div
              class="relative ml-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-border bg-background"
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
                  style:background={previewLayer.props.fill}
                  style:border="{previewLayer.props.strokeWidth}px solid {previewLayer.props
                    .stroke}"
                  style:border-radius="{previewLayer.props.borderRadius}px"
                ></div>
              </div>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>

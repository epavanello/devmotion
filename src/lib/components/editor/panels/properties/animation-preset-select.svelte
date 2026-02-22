<script lang="ts">
  import * as Popover from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { ChevronDown } from '@lucide/svelte';
  import type { TypedAnimationPreset, PresetKeyframe } from '$lib/engine/presets';
  import { interpolateValue } from '$lib/engine/interpolation';

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

  /**
   * Interpolate preset keyframes at a given normalized time (0-1).
   * Returns computed CSS transform and opacity for the preview box.
   */
  function interpolatePresetAt(
    keyframes: PresetKeyframe[],
    time: number
  ): { transform: string; opacity: number } {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const byProperty = new Map<string, PresetKeyframe[]>();
    for (const kf of keyframes) {
      const existing = byProperty.get(kf.property) ?? [];
      byProperty.set(kf.property, [...existing, kf]);
    }

    let tx = 0,
      ty = 0;
    let sx = 1,
      sy = 1;
    let rz = 0,
      rx = 0,
      ry = 0;
    let opacity = 1;

    for (const [property, kfs] of byProperty) {
      const sorted = [...kfs].sort((a, b) => a.time - b.time);

      let prev = sorted[0];
      let next = sorted[sorted.length - 1];
      for (let i = 0; i < sorted.length - 1; i++) {
        if (time >= sorted[i].time && time <= sorted[i + 1].time) {
          prev = sorted[i];
          next = sorted[i + 1];
          break;
        }
      }

      const progress = prev.time === next.time ? 1 : (time - prev.time) / (next.time - prev.time);
      const clamped = Math.max(0, Math.min(1, progress));

      const val = interpolateValue(
        prev.value,
        next.value,
        clamped,
        next.interpolation ?? { family: 'continuous', strategy: 'ease-in-out' }
      ) as number;

      // Scale position values for preview (500px → ~20px in the small box)
      const posScale = 0.04;

      switch (property) {
        case 'position.x':
          tx = val * posScale;
          break;
        case 'position.y':
          ty = val * posScale;
          break;
        case 'scale.x':
          sx = val;
          break;
        case 'scale.y':
          sy = val;
          break;
        case 'rotation.z':
          rz = val;
          break;
        case 'rotation.x':
          rx = val;
          break;
        case 'rotation.y':
          ry = val;
          break;
        case 'opacity':
          opacity = val;
          break;
      }
    }

    const parts: string[] = [];
    parts.push(`translate(${tx}px, ${ty}px)`);
    if (rx !== 0) parts.push(`rotateX(${rx}rad)`);
    if (ry !== 0) parts.push(`rotateY(${ry}rad)`);
    if (rz !== 0) parts.push(`rotateZ(${rz}rad)`);
    if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`);

    return { transform: parts.join(' '), opacity };
  }

  const previewValues = $derived.by(() => {
    if (!hoveredPreset) return { transform: 'none', opacity: 1 };
    return interpolatePresetAt(hoveredPreset.keyframes, previewTime);
  });

  function startPreview(presetId: string) {
    hoveredPresetId = presetId;
    previewTime = 0;

    const startTime = performance.now();
    const duration = 1200;

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
  <Popover.Trigger>
    <Button variant="outline" class="w-full justify-between">
      {selectedPreset?.name ?? placeholder}
      <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-72 p-2" align="start">
    <div class="grid grid-cols-1 gap-0.5">
      {#each options as preset (preset.id)}
        {@const isSelected = value === preset.id}
        {@const isHovered = hoveredPresetId === preset.id}
        <button
          class="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          class:bg-accent={isSelected}
          onmouseenter={() => startPreview(preset.id)}
          onmouseleave={stopPreview}
          onclick={() => selectPreset(preset.id)}
        >
          <!-- Preview box -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-background"
            style:perspective="200px"
          >
            {#if isHovered}
              <div
                style:transform={previewValues.transform}
                style:opacity={previewValues.opacity}
                style:transform-style="preserve-3d"
              >
                <div class="h-5 w-5 rounded-sm bg-primary"></div>
              </div>
            {:else}
              <div class="h-5 w-5 rounded-sm bg-primary/40"></div>
            {/if}
          </div>
          <!-- Label + description -->
          <div class="flex-1 text-left">
            <div class="text-xs font-medium">{preset.name}</div>
            {#if preset.description}
              <div class="text-[10px] leading-tight text-muted-foreground">
                {preset.description}
              </div>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>

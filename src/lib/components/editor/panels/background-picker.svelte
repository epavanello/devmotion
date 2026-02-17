<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import * as Popover from '$lib/components/ui/popover';
  import { ColorPicker } from '$lib/components/ui/color-picker';
  import Select from '$lib/components/ui/select/select.svelte';
  import InputWrapper from './input-wrapper.svelte';
  import InputsWrapper from './inputs-wrapper.svelte';

  import { Palette, Sparkles, Plus, Trash2, ChevronDown } from '@lucide/svelte';
  import {
    type BackgroundValue,
    type ColorStop,
    backgroundValueToCSS,
    solidBackground,
    isGradient,
    isSolid
  } from '$lib/schemas/animation';
  import {
    gradientPresets,
    defaultSolidColors,
    getGradientCategories,
    type GradientPreset
  } from '$lib/engine/gradient-presets';
  import { watchOnce } from 'runed';
  import ScrubInput from './scrub-input.svelte';

  interface Props {
    value: BackgroundValue;
    onchange: (value: BackgroundValue) => void;
    side?: 'left' | 'right';
  }

  let { value, onchange, side = 'left' }: Props = $props();

  // Current tab: 'solid' | 'gradient' | 'presets'
  // svelte-ignore state_referenced_locally
  let activeTab = $state<'solid' | 'gradient' | 'presets'>(isSolid(value) ? 'solid' : 'gradient');

  // For gradient editing (local state)
  let gradientType = $derived<'linear' | 'radial' | 'conic'>(
    isGradient(value) ? value.type : 'linear'
  );
  let angle = $derived(
    isGradient(value) && (value.type === 'linear' || value.type === 'conic') ? value.angle : 180
  );
  let posX = $derived(
    isGradient(value) && (value.type === 'radial' || value.type === 'conic') ? value.position.x : 50
  );
  let posY = $derived(
    isGradient(value) && (value.type === 'radial' || value.type === 'conic') ? value.position.y : 50
  );
  let radialShape = $derived<'circle' | 'ellipse'>(
    isGradient(value) && value.type === 'radial' ? value.shape : 'circle'
  );
  let stops = $derived<ColorStop[]>(
    isGradient(value)
      ? [...value.stops]
      : [
          { color: '#4a90e2', position: 0 },
          { color: '#e24a4a', position: 100 }
        ]
  );

  // Sync local state when value changes from outside
  watchOnce(
    () => value,
    () => {
      if (isSolid(value)) {
        activeTab = 'solid';
      } else {
        gradientType = value.type;
        stops = [...value.stops];
        if (value.type === 'linear') {
          angle = value.angle;
        } else if (value.type === 'radial') {
          posX = value.position.x;
          posY = value.position.y;
          radialShape = value.shape;
        } else if (value.type === 'conic') {
          angle = value.angle;
          posX = value.position.x;
          posY = value.position.y;
        }

        const isPreset = gradientPresets.some(
          (p: GradientPreset) => JSON.stringify(p.value) === JSON.stringify(value)
        );
        if (isPreset) {
          activeTab = 'presets';
        } else {
          activeTab = 'gradient';
        }
      }
    }
  );

  // CSS preview of current value
  const previewCSS = $derived(backgroundValueToCSS(value));

  // Category filter for presets
  let selectedCategory = $state<GradientPreset['category'] | 'all'>('all');
  const categories = getGradientCategories();

  const filteredPresets = $derived(
    selectedCategory === 'all'
      ? gradientPresets
      : gradientPresets.filter((p) => p.category === selectedCategory)
  );

  function updateSolidColor(color: string) {
    onchange(solidBackground(color));
  }

  function buildGradientValue(): BackgroundValue {
    if (gradientType === 'linear') {
      return {
        type: 'linear',
        angle,
        stops
      };
    } else if (gradientType === 'radial') {
      return {
        type: 'radial',
        shape: radialShape,
        size: 'farthest-corner',
        position: { x: posX, y: posY },
        stops
      };
    } else {
      return {
        type: 'conic',
        angle,
        position: { x: posX, y: posY },
        stops
      };
    }
  }

  function updateGradient() {
    onchange(buildGradientValue());
  }

  function addColorStop() {
    const lastStop = stops[stops.length - 1];
    const newPosition = Math.min(lastStop.position + 20, 100);
    stops = [...stops, { color: '#888888', position: newPosition }];
    updateGradient();
  }

  function removeColorStop(index: number) {
    if (stops.length <= 2) return;
    stops = stops.filter((_, i) => i !== index);
    updateGradient();
  }

  function updateColorStop(index: number, field: 'color' | 'position', value: string | number) {
    stops = stops.map((stop, i) => {
      if (i === index) {
        return { ...stop, [field]: value };
      }
      return stop;
    });
    updateGradient();
  }

  function applyPreset(preset: GradientPreset) {
    onchange(preset.value);
  }
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class="w-full justify-between" {...props}>
        <div class="flex items-center gap-2">
          <div class="size-6 rounded border" style:background={previewCSS}></div>
          <span>{isSolid(value) ? 'Solid' : 'Gradient'}</span>
        </div>
        <ChevronDown class="size-4 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class="w-80" align="center" {side}>
    <div class="space-y-3">
      <!-- Preview swatch -->
      <div class="h-12 rounded-md border" style:background={previewCSS}></div>

      <!-- Tab buttons -->
      <div class="flex gap-1">
        <Button
          variant={activeTab === 'solid' ? 'default' : 'outline'}
          size="sm"
          class="flex-1"
          onclick={() => (activeTab = 'solid')}
        >
          <Palette class="mr-1 size-3" />
          Solid
        </Button>
        <Button
          variant={activeTab === 'gradient' ? 'default' : 'outline'}
          size="sm"
          class="flex-1"
          onclick={() => (activeTab = 'gradient')}
        >
          <Sparkles class="mr-1 size-3" />
          Gradient
        </Button>
        <Button
          variant={activeTab === 'presets' ? 'default' : 'outline'}
          size="sm"
          class="flex-1"
          onclick={() => (activeTab = 'presets')}
        >
          Presets
        </Button>
      </div>

      <!-- Tab content -->
      {#if activeTab === 'solid'}
        <div class="space-y-3">
          <!-- Color picker -->
          <ColorPicker value={isSolid(value) ? value : '#4a90e2'} onchange={updateSolidColor} />

          <!-- Quick color swatches -->
          <div class="grid grid-cols-8 gap-1">
            {#each defaultSolidColors as color (color)}
              <button
                type="button"
                class="size-6 rounded border transition-transform hover:scale-110"
                style:background-color={color}
                onclick={() => updateSolidColor(color)}
                title={color}
              ></button>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'gradient'}
        <ScrollArea viewportClass="p-1">
          <div class="space-y-3 pr-2">
            <!-- Gradient type selector -->
            <InputWrapper for="gradient-type" label="Type">
              <Select
                bind:value={gradientType}
                options={[
                  { value: 'linear', label: 'Linear' },
                  { value: 'radial', label: 'Radial' },
                  { value: 'conic', label: 'Conic' }
                ]}
                root={{ onValueChange: updateGradient }}
              />
            </InputWrapper>

            <!-- Angle (for linear and conic) -->
            {#if gradientType === 'linear' || gradientType === 'conic'}
              <InputWrapper for="gradient-angle" label="Angle">
                <div class="flex items-center gap-2">
                  <ScrubInput
                    id="gradient-angle"
                    min={0}
                    max={360}
                    bind:value={angle}
                    onchange={updateGradient}
                  />
                  <span class="text-muted-foreground">deg</span>
                </div>
              </InputWrapper>
            {/if}

            <!-- Position (for radial and conic) -->
            {#if gradientType === 'radial' || gradientType === 'conic'}
              <InputsWrapper
                fields={[
                  { for: 'gradient-pos-x', labels: 'X' },
                  { for: 'gradient-pos-y', labels: 'Y' }
                ]}
              >
                <ScrubInput
                  id="gradient-pos-x"
                  min={0}
                  max={100}
                  bind:value={posX}
                  onchange={updateGradient}
                />
                <ScrubInput
                  id="gradient-pos-y"
                  min={0}
                  max={100}
                  bind:value={posY}
                  onchange={updateGradient}
                />
              </InputsWrapper>
            {/if}

            <!-- Shape (for radial only) -->
            {#if gradientType === 'radial'}
              <InputWrapper for="gradient-shape" label="Shape">
                <Select
                  bind:value={radialShape}
                  options={[
                    { value: 'circle', label: 'Circle' },
                    { value: 'ellipse', label: 'Ellipse' }
                  ]}
                  root={{ onValueChange: updateGradient }}
                />
              </InputWrapper>
            {/if}

            <Separator />

            <!-- Color stops -->
            <InputWrapper for="gradient-stops" label="Color Stops">
              <div class="space-y-2">
                <Button variant="ghost" size="sm" class="w-full" onclick={addColorStop}>
                  <Plus class="mr-1 size-3" />
                  Add Stop
                </Button>

                {#each stops as stop, index (index)}
                  <div class="flex items-center gap-1">
                    <ColorPicker
                      value={stop.color}
                      onchange={(color) => updateColorStop(index, 'color', color)}
                      showInput={false}
                    />
                    <ScrubInput
                      min={0}
                      max={100}
                      value={stop.position}
                      onchange={(value) => updateColorStop(index, 'position', value)}
                      postFix="%"
                    />
                    {#if stops.length > 2}
                      <Button
                        variant="ghost"
                        size="sm"
                        class="size-6 p-0"
                        onclick={() => removeColorStop(index)}
                      >
                        <Trash2 class="size-3" />
                      </Button>
                    {/if}
                  </div>
                {/each}
              </div>
            </InputWrapper>
          </div>
        </ScrollArea>
      {:else if activeTab === 'presets'}
        <div class="space-y-3">
          <!-- Category filter -->
          <InputWrapper for="preset-category" label="Category">
            <Select
              bind:value={selectedCategory}
              options={[
                { value: 'all', label: 'All' },
                ...categories.map((cat) => ({
                  value: cat,
                  label: cat.charAt(0).toUpperCase() + cat.slice(1)
                }))
              ]}
            />
          </InputWrapper>

          <!-- Preset grid -->
          <ScrollArea class="h-64" viewportClass="p-1">
            <div class="grid grid-cols-3 gap-2 p-1.5">
              {#each filteredPresets as preset (preset.id)}
                <button
                  type="button"
                  class="group relative h-12 overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary"
                  style:background={backgroundValueToCSS(preset.value)}
                  onclick={() => applyPreset(preset)}
                  title={preset.name}
                >
                  <span
                    class="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {preset.name}
                  </span>
                </button>
              {/each}
            </div>
          </ScrollArea>
        </div>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>

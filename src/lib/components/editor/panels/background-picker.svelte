<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import * as Popover from '$lib/components/ui/popover';

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

  interface Props {
    value: BackgroundValue;
    onchange: (value: BackgroundValue) => void;
    side?: 'left' | 'right';
  }

  let { value, onchange, side = 'left' }: Props = $props();

  // Current tab: 'solid' | 'gradient' | 'presets'
  let activeTab = $derived<'solid' | 'gradient' | 'presets'>(isSolid(value) ? 'solid' : 'gradient');

  // For gradient editing
  let gradientType = $derived<'linear' | 'radial' | 'conic'>(
    isGradient(value) ? value.type : 'linear'
  );

  // Local state for gradient angle/position
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
  $effect(() => {
    activeTab = isSolid(value) ? 'solid' : 'gradient';
    if (isGradient(value)) {
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
    }
  });

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
    activeTab = 'gradient';
  }
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class="h-10 w-full justify-between px-3" {...props}>
        <div class="flex items-center gap-2">
          <div class="h-6 w-6 rounded border" style:background={previewCSS}></div>
          <span class="text-sm">{isSolid(value) ? 'Solid' : 'Gradient'}</span>
        </div>
        <ChevronDown class="h-4 w-4 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class="w-80" align="center" {side}>
    <div class="space-y-3">
      <!-- Preview swatch -->
      <div class="h-12 w-full rounded-md border" style:background={previewCSS}></div>

      <!-- Tab buttons -->
      <div class="flex gap-1">
        <Button
          variant={activeTab === 'solid' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 text-xs"
          onclick={() => (activeTab = 'solid')}
        >
          <Palette class="mr-1 size-3" />
          Solid
        </Button>
        <Button
          variant={activeTab === 'gradient' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 text-xs"
          onclick={() => (activeTab = 'gradient')}
        >
          <Sparkles class="mr-1 size-3" />
          Gradient
        </Button>
        <Button
          variant={activeTab === 'presets' ? 'default' : 'outline'}
          size="sm"
          class="flex-1 text-xs"
          onclick={() => (activeTab = 'presets')}
        >
          Presets
        </Button>
      </div>

      <!-- Tab content -->
      {#if activeTab === 'solid'}
        <div class="space-y-3">
          <!-- Color input -->
          <div class="flex items-center gap-2">
            <Input
              type="color"
              value={isSolid(value) ? value : '#4a90e2'}
              oninput={(e) => updateSolidColor(e.currentTarget.value)}
              class="h-9 w-12 cursor-pointer p-1"
            />
            <Input
              type="text"
              value={isSolid(value) ? value : '#4a90e2'}
              oninput={(e) => updateSolidColor(e.currentTarget.value)}
              class="flex-1 font-mono text-xs"
              placeholder="#000000"
            />
          </div>

          <!-- Quick color swatches -->
          <div class="grid grid-cols-8 gap-1">
            {#each defaultSolidColors as color (color)}
              <button
                type="button"
                class="h-6 w-full rounded border transition-transform hover:scale-110"
                style:background-color={color}
                onclick={() => updateSolidColor(color)}
                title={color}
              ></button>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'gradient'}
        <ScrollArea class="max-h-96">
          <div class="space-y-3 pr-2">
            <!-- Gradient type selector -->
            <div class="space-y-1">
              <Label class="text-xs">Type</Label>
              <select
                class="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                bind:value={gradientType}
                onchange={updateGradient}
              >
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
                <option value="conic">Conic</option>
              </select>
            </div>

            <!-- Angle (for linear and conic) -->
            {#if gradientType === 'linear' || gradientType === 'conic'}
              <div class="space-y-1">
                <Label class="text-xs">Angle</Label>
                <div class="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="360"
                    bind:value={angle}
                    oninput={updateGradient}
                    class="h-8 flex-1 text-xs"
                  />
                  <span class="text-xs text-muted-foreground">deg</span>
                </div>
              </div>
            {/if}

            <!-- Position (for radial and conic) -->
            {#if gradientType === 'radial' || gradientType === 'conic'}
              <div class="space-y-1">
                <Label class="text-xs">Position</Label>
                <div class="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    bind:value={posX}
                    oninput={updateGradient}
                    class="h-8 flex-1 text-xs"
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    bind:value={posY}
                    oninput={updateGradient}
                    class="h-8 flex-1 text-xs"
                    placeholder="Y"
                  />
                  <span class="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            {/if}

            <!-- Shape (for radial only) -->
            {#if gradientType === 'radial'}
              <div class="space-y-1">
                <Label class="text-xs">Shape</Label>
                <select
                  class="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  bind:value={radialShape}
                  onchange={updateGradient}
                >
                  <option value="circle">Circle</option>
                  <option value="ellipse">Ellipse</option>
                </select>
              </div>
            {/if}

            <Separator />

            <!-- Color stops -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Color Stops</Label>
                <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" onclick={addColorStop}>
                  <Plus class="size-3" />
                </Button>
              </div>

              <div class="space-y-2">
                {#each stops as stop, index (index)}
                  <div class="flex items-center gap-1">
                    <Input
                      type="color"
                      value={stop.color}
                      oninput={(e) => updateColorStop(index, 'color', e.currentTarget.value)}
                      class="h-7 w-9 cursor-pointer p-0.5"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={stop.position}
                      oninput={(e) =>
                        updateColorStop(index, 'position', parseInt(e.currentTarget.value) || 0)}
                      class="h-7 w-14 text-xs"
                    />
                    <span class="text-xs text-muted-foreground">%</span>
                    {#if stops.length > 2}
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-6 w-6 p-0"
                        onclick={() => removeColorStop(index)}
                      >
                        <Trash2 class="size-3" />
                      </Button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </ScrollArea>
      {:else if activeTab === 'presets'}
        <div class="space-y-3">
          <!-- Category filter -->
          <div class="space-y-1">
            <Label class="text-xs">Category</Label>
            <select
              class="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              bind:value={selectedCategory}
            >
              <option value="all">All</option>
              {#each categories as cat (cat)}
                <option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              {/each}
            </select>
          </div>

          <!-- Preset grid -->
          <ScrollArea class="h-64">
            <div class="grid grid-cols-3 gap-2 pr-2">
              {#each filteredPresets as preset (preset.id)}
                <button
                  type="button"
                  class="group relative h-12 w-full overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary"
                  style:background={backgroundValueToCSS(preset.value)}
                  onclick={() => applyPreset(preset)}
                  title={preset.name}
                >
                  <span
                    class="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
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

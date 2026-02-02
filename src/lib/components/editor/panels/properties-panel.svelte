<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import {
    Pin,
    Trash2,
    ArrowUpLeft,
    ArrowUp,
    ArrowUpRight,
    ArrowLeft,
    Locate,
    ArrowRight,
    ArrowDownLeft,
    ArrowDown,
    ArrowDownRight,
    ChevronDown,
    Sparkles
  } from 'lucide-svelte';
  import { nanoid } from 'nanoid';
  import type {
    AnimatableProperty,
    Transform,
    LayerStyle,
    Layer,
    EasingType,
    Easing,
    AnchorPoint
  } from '$lib/types/animation';
  import {
    getAnimatedTransform,
    getAnimatedStyle,
    getAnimatedProps
  } from '$lib/engine/interpolation';
  import { getLayerSchema } from '$lib/layers/registry';
  import { extractPropertyMetadata, type PropertyMetadata } from '$lib/layers/base';
  import { animationPresets } from '$lib/engine/presets';
  import InputWrapper from './input-wrapper.svelte';

  const selectedLayer = $derived(projectStore.selectedLayer);

  // Get the current displayed values (animated if keyframes exist, otherwise base values)
  const currentTransform = $derived.by(() => {
    if (!selectedLayer) return null;
    const animatedTransform = getAnimatedTransform(
      selectedLayer.keyframes,
      projectStore.currentTime
    );
    return {
      x: animatedTransform.position.x ?? selectedLayer.transform.x,
      y: animatedTransform.position.y ?? selectedLayer.transform.y,
      z: animatedTransform.position.z ?? selectedLayer.transform.z,
      rotationX: animatedTransform.rotation.x ?? selectedLayer.transform.rotationX,
      rotationY: animatedTransform.rotation.y ?? selectedLayer.transform.rotationY,
      rotationZ: animatedTransform.rotation.z ?? selectedLayer.transform.rotationZ,
      scaleX: animatedTransform.scale.x ?? selectedLayer.transform.scaleX,
      scaleY: animatedTransform.scale.y ?? selectedLayer.transform.scaleY,
      scaleZ: animatedTransform.scale.z ?? selectedLayer.transform.scaleZ
    };
  });

  const currentStyle = $derived.by(() => {
    if (!selectedLayer) return null;
    const animatedStyle = getAnimatedStyle(selectedLayer.keyframes, projectStore.currentTime);
    return {
      opacity: animatedStyle.opacity ?? selectedLayer.style.opacity
    };
  });

  const sortedKeyframes = $derived.by(() => {
    if (!selectedLayer) return [];
    return [...selectedLayer.keyframes].sort((a, b) => a.time - b.time);
  });

  // Extract property metadata from the layer's Zod schema
  const layerPropertyMetadata = $derived.by(() => {
    if (!selectedLayer) return [];
    const schema = getLayerSchema(selectedLayer.type);
    return extractPropertyMetadata(schema);
  });

  // Get the current animated props values
  const currentAnimatedProps = $derived.by(() => {
    if (!selectedLayer) return {};
    return getAnimatedProps(
      selectedLayer.keyframes,
      selectedLayer.props,
      layerPropertyMetadata,
      projectStore.currentTime
    );
  });

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
      'scale.z': 'Scale Z',
      opacity: 'Opacity'
    };
    if (labels[property]) return labels[property];

    // Handle props.* properties
    if (property.startsWith('props.')) {
      const propName = property.slice(6);
      // Find metadata for this prop to get description
      const meta = layerPropertyMetadata.find((m) => m.name === propName);
      return meta?.description || propName;
    }

    return property;
  }

  function formatKeyframeValue(value: number | string | boolean): string {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value;
  }

  function deleteKeyframe(keyframeId: string) {
    if (!selectedLayer) return;
    projectStore.removeKeyframe(selectedLayer.id, keyframeId);
  }

  function goToKeyframe(time: number) {
    projectStore.setCurrentTime(time);
  }

  const easingOptions: { value: EasingType; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In-Out' }
  ];

  const anchorOptions: { value: AnchorPoint; label: string; icon: typeof ArrowUpLeft }[] = [
    { value: 'top-left', label: 'Top Left', icon: ArrowUpLeft },
    { value: 'top-center', label: 'Top Center', icon: ArrowUp },
    { value: 'top-right', label: 'Top Right', icon: ArrowUpRight },
    { value: 'center-left', label: 'Center Left', icon: ArrowLeft },
    { value: 'center', label: 'Center', icon: Locate },
    { value: 'center-right', label: 'Center Right', icon: ArrowRight },
    { value: 'bottom-left', label: 'Bottom Left', icon: ArrowDownLeft },
    { value: 'bottom-center', label: 'Bottom Center', icon: ArrowDown },
    { value: 'bottom-right', label: 'Bottom Right', icon: ArrowDownRight }
  ];

  const currentAnchorLabel = $derived.by(() => {
    if (!selectedLayer) return 'Center';
    const option = anchorOptions.find((opt) => opt.value === selectedLayer.transform.anchor);
    return option?.label || 'Center';
  });

  function updateAnchor(anchor: AnchorPoint) {
    if (!selectedLayer) return;
    const newTransform: Transform = { ...selectedLayer.transform, anchor };
    projectStore.updateLayer(selectedLayer.id, { transform: newTransform });
  }

  function updateKeyframeEasing(keyframeId: string, easingType: EasingType) {
    if (!selectedLayer) return;
    const newEasing: Easing = { type: easingType };
    projectStore.updateKeyframe(selectedLayer.id, keyframeId, { easing: newEasing });
  }

  function updateLayerProperty<K extends keyof Pick<Layer, 'name'>>(property: K, value: Layer[K]) {
    if (!selectedLayer) return;
    projectStore.updateLayer(selectedLayer.id, { [property]: value });
  }

  // Animatable transform properties (excludes anchor which is not animatable)
  type AnimatableTransformKey = Exclude<keyof Transform, 'anchor'>;

  function updateTransformProperty<K extends AnimatableTransformKey>(
    property: K,
    value: Transform[K]
  ) {
    if (!selectedLayer) return;

    // Map transform property to animatable property format
    const transformPropertyMap: Record<AnimatableTransformKey, AnimatableProperty> = {
      x: 'position.x',
      y: 'position.y',
      z: 'position.z',
      rotationX: 'rotation.x',
      rotationY: 'rotation.y',
      rotationZ: 'rotation.z',
      scaleX: 'scale.x',
      scaleY: 'scale.y',
      scaleZ: 'scale.z'
    };

    const animatableProperty = transformPropertyMap[property];

    updateAnimatableValue(
      selectedLayer,
      animatableProperty,
      value as number | string | boolean,
      () => {
        const newTransform: Transform = { ...selectedLayer.transform, [property]: value };
        projectStore.updateLayer(selectedLayer.id, { transform: newTransform });
      }
    );
  }

  /**
   * Helper to update an animatable property - handles keyframe logic
   * If the property has keyframes, updates/creates keyframe at current time
   * Otherwise calls updateBase to update the base value
   */
  /**
   * Helper to update an animatable property - handles keyframe logic
   * If the property has keyframes, updates/creates keyframe at current time
   * If updateBase is provided and no keyframes exist, calls updateBase
   * If updateBase is not provided, always creates/updates keyframe
   */
  function updateAnimatableValue(
    layer: Layer,
    animatableProperty: AnimatableProperty,
    value: number | string | boolean,
    updateBase?: () => void
  ) {
    const currentTime = projectStore.currentTime;
    const hasKeyframes = layer.keyframes.some((k) => k.property === animatableProperty);

    if (hasKeyframes || !updateBase) {
      const keyframeAtTime = layer.keyframes.find(
        (k) => k.property === animatableProperty && k.time === currentTime
      );

      if (keyframeAtTime) {
        projectStore.updateKeyframe(layer.id, keyframeAtTime.id, { value });
      } else {
        projectStore.addKeyframe(layer.id, {
          id: nanoid(),
          time: currentTime,
          property: animatableProperty,
          value,
          easing: { type: 'ease-in-out' }
        });
      }
    } else {
      updateBase();
    }
  }

  function updateStyle<K extends keyof LayerStyle>(property: K, value: LayerStyle[K]) {
    if (!selectedLayer) return;

    updateAnimatableValue(
      selectedLayer,
      property as AnimatableProperty,
      value as number | string | boolean,
      () => {
        const newStyle: LayerStyle = { ...selectedLayer.style, [property]: value };
        projectStore.updateLayer(selectedLayer.id, { style: newStyle });
      }
    );
  }

  function updateLayerProps(property: string, value: unknown) {
    if (!selectedLayer) return;

    updateAnimatableValue(
      selectedLayer,
      `props.${property}` as AnimatableProperty,
      value as number | string | boolean,
      () => {
        const newProps = { ...selectedLayer.props, [property]: value };
        projectStore.updateLayer(selectedLayer.id, { props: newProps });
      }
    );
  }

  function addKeyframe(property: AnimatableProperty) {
    if (!selectedLayer || !currentTransform || !currentStyle) return;

    const propertyValueMap: Record<string, number> = {
      'position.x': currentTransform.x,
      'position.y': currentTransform.y,
      'position.z': currentTransform.z,
      'rotation.x': currentTransform.rotationX,
      'rotation.y': currentTransform.rotationY,
      'rotation.z': currentTransform.rotationZ,
      'scale.x': currentTransform.scaleX,
      'scale.y': currentTransform.scaleY,
      'scale.z': currentTransform.scaleZ,
      opacity: currentStyle.opacity
    };

    let currentValue: number | string | boolean;

    if (property in propertyValueMap) {
      currentValue = propertyValueMap[property];
    } else if (property.startsWith('props.')) {
      const propName = property.slice(6);
      currentValue = (selectedLayer.props[propName] as number | string | boolean) ?? 0;
    } else {
      currentValue = 0;
    }

    // No updateBase = always create/update keyframe
    updateAnimatableValue(selectedLayer, property, currentValue);
  }

  interface PropertyFieldProps {
    id: string;
    value: number;
    step?: string;
    min?: string;
    max?: string;
    onInput: (value: number) => void;
  }

  interface DynamicPropertyFieldProps {
    metadata: PropertyMetadata;
    value: unknown;
  }

  // Preset application state
  let selectedPresetId = $state<string>('');
  let presetDuration = $state<number>(1);

  function applyPreset() {
    if (!selectedLayer || !selectedPresetId) return;

    const startTime = projectStore.currentTime;
    projectStore.applyPreset(selectedLayer.id, selectedPresetId, startTime, presetDuration);

    // Reset selection after applying
    selectedPresetId = '';
    presetDuration = 1;
  }
</script>

{#snippet propertyField({ id, value, step, min, max, onInput }: PropertyFieldProps)}
  <Input
    {id}
    type="number"
    {value}
    {step}
    {min}
    {max}
    oninput={(e) => onInput(parseFloat(e.currentTarget.value) || 0)}
    class="h-8 text-xs"
  />
{/snippet}

{#snippet dynamicPropertyField({ metadata, value }: DynamicPropertyFieldProps)}
  {@const isInterpolatable = metadata.interpolationType !== 'discrete'}
  {@const property = `props.${metadata.name}` as AnimatableProperty}
  {@const hasKeyframes = selectedLayer?.keyframes.some((k) => k.property === property)}
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <Label for={metadata.name} class="text-xs">{metadata.description || metadata.name}</Label>
      <Button
        variant="ghost"
        size="sm"
        class="h-5 w-5 p-0"
        onclick={() => addKeyframe(property)}
        title={isInterpolatable
          ? `Add keyframe for ${metadata.description || metadata.name}`
          : `Add keyframe for ${metadata.description || metadata.name} (discrete - jumps to value)`}
      >
        <Pin class="size-3" fill={hasKeyframes ? 'currentColor' : 'none'} />
      </Button>
    </div>

    {#if metadata.type === 'number'}
      <Input
        id={metadata.name}
        type="number"
        value={typeof value === 'number' ? value : 0}
        min={metadata.min?.toString()}
        max={metadata.max?.toString()}
        step={metadata.step?.toString() || '1'}
        oninput={(e) =>
          updateLayerProps(metadata.name, parseFloat(e.currentTarget.value) || metadata.min || 0)}
      />
    {:else if metadata.type === 'color'}
      <Input
        id={metadata.name}
        type="color"
        value={typeof value === 'string' ? value : '#000000'}
        oninput={(e) => updateLayerProps(metadata.name, e.currentTarget.value)}
      />
    {:else if metadata.type === 'boolean'}
      <label class="flex items-center gap-2">
        <input
          id={metadata.name}
          type="checkbox"
          checked={typeof value === 'boolean' ? value : false}
          onchange={(e) => updateLayerProps(metadata.name, e.currentTarget.checked)}
          class="h-4 w-4 rounded border-gray-300"
        />
        <span class="text-sm">Enable</span>
      </label>
    {:else if metadata.type === 'select' && metadata.options}
      <select
        id={metadata.name}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onchange={(e) => updateLayerProps(metadata.name, e.currentTarget.value)}
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        {#each metadata.options as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    {:else}
      <!-- Default to text input for strings and unknown types -->
      <Input
        id={metadata.name}
        type="text"
        value={typeof value === 'string' ? value : ''}
        oninput={(e) => updateLayerProps(metadata.name, e.currentTarget.value)}
      />
    {/if}
  </div>
{/snippet}

<div
  class="flex h-full flex-col overflow-y-auto bg-background"
  class:pointer-events-none={projectStore.isRecording}
  class:opacity-50={projectStore.isRecording}
>
  <!-- Panel Header -->
  <div class="border-b bg-muted/50 px-4 py-3">
    <h2 class="text-sm font-semibold">Properties</h2>
  </div>

  {#if selectedLayer}
    <ScrollArea class="flex-1">
      <div class="space-y-4 p-4">
        <!-- Layer Name -->
        <div class="space-y-2">
          <Label for="layer-name">Name</Label>
          <Input
            id="layer-name"
            value={selectedLayer.name}
            oninput={(e) => updateLayerProperty('name', e.currentTarget.value)}
          />
        </div>

        <Separator />

        <!-- Transform -->
        <div class="space-y-3">
          <Label class="font-semibold">Transform</Label>

          <!-- Position -->
          <div class="space-y-1">
            <Label class="mb-1 text-xs text-muted-foreground">Position</Label>
            <div class="flex gap-1">
              {#each [{ prop: 'position.x' as AnimatableProperty, label: 'X' }, { prop: 'position.y' as AnimatableProperty, label: 'Y' }, { prop: 'position.z' as AnimatableProperty, label: 'Z' }] as { prop, label } (prop)}
                {@const hasKeyframes = selectedLayer?.keyframes.some((k) => k.property === prop)}
                <div class="flex flex-1 items-center gap-1">
                  <span class="ml-2 text-[10px] text-muted-foreground">{label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-3 w-3 p-0"
                    onclick={() => addKeyframe(prop)}
                    title="Add keyframe for {label}"
                  >
                    <Pin class="size-2.5" fill={hasKeyframes ? 'currentColor' : 'none'} />
                  </Button>
                </div>
              {/each}
            </div>
            <ButtonGroup.Root>
              {@render propertyField({
                id: 'pos-x',
                value: currentTransform?.x ?? 0,
                onInput: (v) => updateTransformProperty('x', v)
              })}
              {@render propertyField({
                id: 'pos-y',
                value: currentTransform?.y ?? 0,
                onInput: (v) => updateTransformProperty('y', v)
              })}
              {@render propertyField({
                id: 'pos-z',
                value: currentTransform?.z ?? 0,
                onInput: (v) => updateTransformProperty('z', v)
              })}
            </ButtonGroup.Root>
          </div>

          <!-- Scale -->
          <div class="space-y-1">
            <Label class="mb-1 text-xs text-muted-foreground">Scale</Label>
            <div class="flex gap-1">
              {#each [{ prop: 'scale.x' as AnimatableProperty, label: 'X' }, { prop: 'scale.y' as AnimatableProperty, label: 'Y' }, { prop: 'scale.z' as AnimatableProperty, label: 'Z' }] as { prop, label } (prop)}
                {@const hasKeyframes = selectedLayer?.keyframes.some((k) => k.property === prop)}
                <div class="flex flex-1 items-center gap-1">
                  <span class="ml-2 text-[10px] text-muted-foreground">{label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-3 w-3 p-0"
                    onclick={() => addKeyframe(prop)}
                    title="Add keyframe for {label}"
                  >
                    <Pin class="size-2.5" fill={hasKeyframes ? 'currentColor' : 'none'} />
                  </Button>
                </div>
              {/each}
            </div>
            <ButtonGroup.Root>
              {@render propertyField({
                id: 'scale-x',
                value: currentTransform?.scaleX ?? 1,
                step: '0.1',
                onInput: (v) => updateTransformProperty('scaleX', v || 1)
              })}
              {@render propertyField({
                id: 'scale-y',
                value: currentTransform?.scaleY ?? 1,
                step: '0.1',
                onInput: (v) => updateTransformProperty('scaleY', v || 1)
              })}
              {@render propertyField({
                id: 'scale-z',
                value: currentTransform?.scaleZ ?? 1,
                step: '0.1',
                onInput: (v) => updateTransformProperty('scaleZ', v || 1)
              })}
            </ButtonGroup.Root>
          </div>

          <!-- Rotation -->
          <div class="space-y-1">
            <Label class="mb-1 text-xs text-muted-foreground">Rotation (radians)</Label>
            <div class="flex gap-1">
              {#each [{ prop: 'rotation.x' as AnimatableProperty, label: 'X' }, { prop: 'rotation.y' as AnimatableProperty, label: 'Y' }, { prop: 'rotation.z' as AnimatableProperty, label: 'Z' }] as { prop, label } (prop)}
                {@const hasKeyframes = selectedLayer?.keyframes.some((k) => k.property === prop)}
                <div class="flex flex-1 items-center gap-1">
                  <span class="ml-2 text-[10px] text-muted-foreground">{label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-3 w-3 p-0"
                    onclick={() => addKeyframe(prop)}
                    title="Add keyframe for {label}"
                  >
                    <Pin class="size-2.5" fill={hasKeyframes ? 'currentColor' : 'none'} />
                  </Button>
                </div>
              {/each}
            </div>
            <ButtonGroup.Root>
              {@render propertyField({
                id: 'rot-x',
                value: currentTransform?.rotationX ?? 0,
                step: '0.1',
                onInput: (v) => updateTransformProperty('rotationX', v)
              })}
              {@render propertyField({
                id: 'rot-y',
                value: currentTransform?.rotationY ?? 0,
                step: '0.1',
                onInput: (v) => updateTransformProperty('rotationY', v)
              })}
              {@render propertyField({
                id: 'rot-z',
                value: currentTransform?.rotationZ ?? 0,
                step: '0.1',
                onInput: (v) => updateTransformProperty('rotationZ', v)
              })}
            </ButtonGroup.Root>
          </div>

          <!-- Anchor Point -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Anchor Point</Label>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button variant="outline" class="w-full justify-between" {...props}>
                    {currentAnchorLabel}
                    <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content class="w-56" align="end">
                <div class="grid grid-cols-3 gap-0">
                  {#each anchorOptions as option (option.value)}
                    {@const isSelected = selectedLayer?.transform.anchor === option.value}
                    {@const Icon = option.icon}
                    <DropdownMenu.Item onclick={() => updateAnchor(option.value)}>
                      {#snippet child({ props })}
                        <Button variant={isSelected ? 'outline' : 'ghost'} icon={Icon} {...props} />
                      {/snippet}
                    </DropdownMenu.Item>
                  {/each}
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        <Separator />

        <!-- Style -->
        <div class="space-y-3">
          <Label class="font-semibold">Style</Label>
          <InputWrapper id="opacity" label="Opacity" property="opacity" {addKeyframe}>
            {@render propertyField({
              id: 'opacity',
              value: currentStyle?.opacity ?? 1,
              step: '0.1',
              min: '0',
              max: '1',
              onInput: (v) => updateStyle('opacity', v || 0)
            })}
          </InputWrapper>
        </div>

        <!-- Layer-specific properties (dynamic based on schema) -->
        {#if layerPropertyMetadata.length > 0}
          <Separator />
          <div class="space-y-3">
            <Label class="font-semibold">Layer Properties</Label>

            {#each layerPropertyMetadata as propMetadata (propMetadata.name)}
              {@render dynamicPropertyField({
                metadata: propMetadata,
                value: currentAnimatedProps[propMetadata.name]
              })}
            {/each}
          </div>
        {/if}

        <Separator />

        <!-- Animation Presets -->
        <div class="space-y-3">
          <Label class="font-semibold">Animation Presets</Label>

          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2 space-y-2">
              <Label class="text-xs text-muted-foreground">Preset</Label>
              <select
                bind:value={selectedPresetId}
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="">Select...</option>
                {#each animationPresets as preset (preset.id)}
                  <option value={preset.id}>{preset.name}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-2">
              <Label for="preset-duration" class="text-xs text-muted-foreground">Duration (s)</Label
              >
              <Input
                id="preset-duration"
                type="number"
                bind:value={presetDuration}
                min="0.1"
                step="0.1"
              />
            </div>
          </div>

          <Button
            variant="default"
            class="w-full"
            onclick={applyPreset}
            disabled={!selectedPresetId}
          >
            <Sparkles class="mr-2 h-4 w-4" />
            Apply Preset
          </Button>
        </div>

        <Separator />

        <!-- Keyframes -->
        <div class="space-y-3">
          <Label class="font-semibold">Keyframes</Label>

          {#if selectedLayer.keyframes.length > 0}
            <div class="mt-4 space-y-2">
              <Label class="text-xs text-muted-foreground">
                {selectedLayer.keyframes.length} keyframe(s)
              </Label>

              <div class="max-h-75 space-y-1 overflow-y-auto rounded-md border bg-muted/20 p-2">
                {#each sortedKeyframes as keyframe (keyframe.id)}
                  <div
                    class="group rounded-sm bg-background px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                  >
                    <div class="flex items-center justify-between">
                      <button
                        class="flex-1 text-left"
                        onclick={() => goToKeyframe(keyframe.time)}
                        type="button"
                      >
                        <div class="flex items-center gap-2">
                          <div class="h-2 w-2 rounded-sm bg-primary"></div>
                          <div class="font-medium">{getPropertyLabel(keyframe.property)}</div>
                        </div>
                        <div class="mt-0.5 ml-4 text-muted-foreground">
                          {keyframe.time.toFixed(2)}s = {formatKeyframeValue(keyframe.value)}
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                        onclick={() => deleteKeyframe(keyframe.id)}
                      >
                        <Trash2 class="h-3 w-3" />
                      </Button>
                    </div>
                    <div class="mt-1.5 ml-4">
                      <select
                        value={keyframe.easing.type}
                        onchange={(e) =>
                          updateKeyframeEasing(keyframe.id, e.currentTarget.value as EasingType)}
                        class="h-6 w-full rounded border border-input bg-transparent px-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {#each easingOptions as option (option.value)}
                          <option value={option.value}>{option.label}</option>
                        {/each}
                      </select>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </ScrollArea>
  {:else}
    <div class="flex flex-1 items-center justify-center p-4">
      <div class="text-center text-sm text-muted-foreground">
        <p>No layer selected</p>
        <p class="mt-1 text-xs">Select a layer to edit its properties</p>
      </div>
    </div>
  {/if}
</div>

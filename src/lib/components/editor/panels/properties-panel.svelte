<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import {
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
  } from '@lucide/svelte';
  import { nanoid } from 'nanoid';
  import type {
    AnimatableProperty,
    Transform,
    LayerStyle,
    Layer,
    AnchorPoint
  } from '$lib/types/animation';
  import {
    getAnimatedTransform,
    getAnimatedStyle,
    getAnimatedProps
  } from '$lib/engine/interpolation';
  import { getLayerDefinition, getLayerSchema } from '$lib/layers/registry';
  import { extractPropertyMetadata } from '$lib/layers/base';
  import { animationPresets } from '$lib/engine/presets';
  import InputWrapper from './input-wrapper.svelte';

  import ScrubXyz from './scrub-xyz.svelte';
  import ScrubInput from './scrub-input.svelte';

  import type { Snippet } from 'svelte';
  import PropertiesGroup from './properties-group.svelte';
  import InputsWrapper from './inputs-wrapper.svelte';
  import InputPropery from './input-propery.svelte';
  import LayerKeyframes from './layer-keyframes.svelte';

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

  // Extract property metadata from the layer's Zod schema
  const layerPropertyMetadata = $derived.by(() => {
    if (!selectedLayer) return [];
    const schema = getLayerSchema(selectedLayer.type);
    return extractPropertyMetadata(schema);
  });

  const layerCustomPropertyComponents = $derived.by(() => {
    if (!selectedLayer) return [];
    const definition = getLayerDefinition(selectedLayer.type);
    return Object.entries(definition.customPropertyComponents ?? {});
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

<div
  class:pointer-events-none={projectStore.isRecording}
  class:opacity-50={projectStore.isRecording}
>
  {#if selectedLayer}
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

      <!-- Enter/Exit Time -->
      <PropertiesGroup>
        {#snippet label()}
          <div class="flex items-center justify-between">
            <Label class="font-semibold">Time Range</Label>
            {#if selectedLayer.contentDuration !== undefined}
              {@const contentDuration = selectedLayer.contentDuration}
              {@const contentOffset = selectedLayer.contentOffset ?? 0}
              {@const availableContent = contentDuration - contentOffset}
              <span class="text-[10px] text-muted-foreground/60">
                Max: {availableContent.toFixed(1)}s
              </span>
            {/if}
          </div>
        {/snippet}
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">Enter (s)</Label>
            <ScrubInput
              id="enter-time"
              value={selectedLayer.enterTime ?? 0}
              min={0}
              max={selectedLayer.contentDuration !== undefined
                ? Math.min(
                    projectStore.project.duration,
                    projectStore.project.duration -
                      (selectedLayer.contentDuration - (selectedLayer.contentOffset ?? 0))
                  )
                : projectStore.project.duration}
              step={0.1}
              onchange={(v) => projectStore.setLayerEnterTime(selectedLayer.id, v)}
            />
          </div>
          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">Exit (s)</Label>
            <ScrubInput
              id="exit-time"
              value={selectedLayer.exitTime ?? projectStore.project.duration}
              min={0}
              max={projectStore.project.duration}
              step={0.1}
              onchange={(v) => projectStore.setLayerExitTime(selectedLayer.id, v)}
            />
          </div>
        </div>

        <!-- Content offset control for time-based layers -->
        {#if selectedLayer.type === 'video' || selectedLayer.type === 'audio'}
          {@const contentDuration = selectedLayer.contentDuration ?? 0}
          {@const contentOffset = selectedLayer.contentOffset ?? 0}
          {@const hasDuration = contentDuration > 0}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs text-muted-foreground">Content Trim</Label>
              {#if hasDuration}
                <span class="text-[10px] text-muted-foreground/60">
                  Duration: {contentDuration.toFixed(1)}s
                </span>
              {/if}
            </div>
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">Start offset (s)</Label>
              <ScrubInput
                id="content-offset"
                value={contentOffset}
                min={0}
                max={hasDuration ? contentDuration - 0.1 : undefined}
                step={0.1}
                onchange={(v) => {
                  const clamped = hasDuration ? Math.min(v, contentDuration - 0.1) : Math.max(0, v);
                  projectStore.updateLayer(selectedLayer.id, { contentOffset: clamped });

                  // Auto-adjust exitTime if it would exceed available content
                  if (hasDuration && selectedLayer.exitTime !== undefined) {
                    const enterTime = selectedLayer.enterTime ?? 0;
                    const maxVisibleDuration = contentDuration - clamped;
                    const maxExitTime = enterTime + maxVisibleDuration;
                    if (selectedLayer.exitTime > maxExitTime) {
                      projectStore.setLayerExitTime(selectedLayer.id, maxExitTime);
                    }
                  }
                }}
              />
              <p class="text-[10px] text-muted-foreground/70">
                Where to start playing in the source media
              </p>
            </div>
            {#if !hasDuration && selectedLayer.props.src}
              <p class="text-[10px] text-muted-foreground/70">
                Upload a new file to detect duration
              </p>
            {/if}
            <Button
              variant="outline"
              size="sm"
              class="w-full text-xs"
              onclick={() => projectStore.splitLayer(selectedLayer.id)}
            >
              Split at Playhead
            </Button>
          </div>
        {/if}
      </PropertiesGroup>

      <Separator />

      <!-- Transform -->
      <PropertiesGroup label="Transform">
        <!-- Position -->
        <InputsWrapper
          fields={[
            { prop: 'position.x' as AnimatableProperty, label: 'X' },
            { prop: 'position.y' as AnimatableProperty, label: 'Y' },
            { prop: 'position.z' as AnimatableProperty, label: 'Z' }
          ].map((f) => ({
            id: f.prop,
            labels: f.label,
            property: f.prop,
            addKeyframe: addKeyframe,
            hasKeyframes: selectedLayer?.keyframes.some((k) => k.property === f.prop)
          }))}
        >
          {#snippet prefix()}
            <Label class="text-xs text-muted-foreground">Position</Label>
            <ScrubXyz
              valueX={currentTransform?.x ?? 0}
              valueY={currentTransform?.y ?? 0}
              valueZ={currentTransform?.z ?? 0}
              stepXY={1}
              stepZ={1}
              onchangeX={(v: number) => updateTransformProperty('x', v)}
              onchangeY={(v: number) => updateTransformProperty('y', v)}
              onchangeZ={(v: number) => updateTransformProperty('z', v)}
            />
          {/snippet}

          <ScrubInput
            id="pos-x"
            value={currentTransform?.x ?? 0}
            onchange={(v) => updateTransformProperty('x', v)}
          />

          <ScrubInput
            id="pos-y"
            value={currentTransform?.y ?? 0}
            onchange={(v) => updateTransformProperty('y', v)}
          />
          <ScrubInput
            id="pos-z"
            value={currentTransform?.z ?? 0}
            onchange={(v) => updateTransformProperty('z', v)}
          />
        </InputsWrapper>

        <!-- Scale -->
        <InputsWrapper
          fields={[
            { prop: 'scale.x' as AnimatableProperty, label: 'X' },
            { prop: 'scale.y' as AnimatableProperty, label: 'Y' },
            { prop: 'scale.z' as AnimatableProperty, label: 'Z' }
          ].map((f) => ({
            id: f.prop,
            labels: f.label,
            property: f.prop,
            addKeyframe: addKeyframe,
            hasKeyframes: selectedLayer?.keyframes.some((k) => k.property === f.prop)
          }))}
        >
          {#snippet prefix()}
            <Label class="text-xs text-muted-foreground">Scale</Label>
            <ScrubXyz
              valueX={currentTransform?.scaleX ?? 1}
              valueY={currentTransform?.scaleY ?? 1}
              valueZ={currentTransform?.scaleZ ?? 1}
              stepXY={0.1}
              stepZ={0.1}
              onchangeX={(v: number) => updateTransformProperty('scaleX', v || 1)}
              onchangeY={(v: number) => updateTransformProperty('scaleY', v || 1)}
              onchangeZ={(v: number) => updateTransformProperty('scaleZ', v || 1)}
            />
          {/snippet}
          <ScrubInput
            id="scale-x"
            value={currentTransform?.scaleX ?? 1}
            step={0.1}
            onchange={(v) => updateTransformProperty('scaleX', v || 1)}
          />
          <ScrubInput
            id="scale-y"
            value={currentTransform?.scaleY ?? 1}
            step={0.1}
            onchange={(v) => updateTransformProperty('scaleY', v || 1)}
          />
          <ScrubInput
            id="scale-z"
            value={currentTransform?.scaleZ ?? 1}
            step={0.1}
            onchange={(v) => updateTransformProperty('scaleZ', v || 1)}
          />
        </InputsWrapper>

        <!-- Rotation -->
        <InputsWrapper
          fields={[
            { prop: 'rotation.x' as AnimatableProperty, label: 'X' },
            { prop: 'rotation.y' as AnimatableProperty, label: 'Y' },
            { prop: 'rotation.z' as AnimatableProperty, label: 'Z' }
          ].map((f) => ({
            id: f.prop,
            labels: f.label,
            property: f.prop,
            addKeyframe: addKeyframe,
            hasKeyframes: selectedLayer?.keyframes.some((k) => k.property === f.prop)
          }))}
        >
          {#snippet prefix()}
            <Label class="text-xs text-muted-foreground">Rotation (radians)</Label>
            <ScrubXyz
              valueX={currentTransform?.rotationY ?? 0}
              valueY={currentTransform?.rotationX ?? 0}
              valueZ={currentTransform?.rotationZ ?? 0}
              stepXY={0.1}
              stepZ={0.1}
              invertY={true}
              onchangeX={(v: number) => updateTransformProperty('rotationY', v)}
              onchangeY={(v: number) => updateTransformProperty('rotationX', v)}
              onchangeZ={(v: number) => updateTransformProperty('rotationZ', v)}
            />
          {/snippet}
          <ScrubInput
            id="rot-x"
            value={currentTransform?.rotationX ?? 0}
            step={0.1}
            onchange={(v) => updateTransformProperty('rotationX', v)}
          />
          <ScrubInput
            id="rot-y"
            value={currentTransform?.rotationY ?? 0}
            step={0.1}
            onchange={(v) => updateTransformProperty('rotationY', v)}
          />
          <ScrubInput
            id="rot-z"
            value={currentTransform?.rotationZ ?? 0}
            step={0.1}
            onchange={(v) => updateTransformProperty('rotationZ', v)}
          />
        </InputsWrapper>

        <!-- Anchor Point -->
        <InputWrapper id="anchor-point" label="Anchor Point">
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
        </InputWrapper>
      </PropertiesGroup>

      <Separator />

      <!-- Style -->
      <PropertiesGroup label="Style">
        <InputWrapper id="opacity" label="Opacity" property="opacity" {addKeyframe}>
          <ScrubInput
            id="opacity"
            value={currentStyle?.opacity ?? 1}
            step={0.1}
            min={0}
            max={1}
            onchange={(v) => updateStyle('opacity', v || 0)}
          />
        </InputWrapper>
      </PropertiesGroup>

      <!-- Layer-specific properties (dynamic based on schema) -->
      {#if layerPropertyMetadata.length > 0}
        <Separator />
        <PropertiesGroup label="Layer Properties">
          {#each layerPropertyMetadata as propMetadata (propMetadata.name)}
            {#if !propMetadata.meta?.hidden}
              {@const metadata = propMetadata}
              <InputWrapper
                id={metadata.name}
                label={metadata.description || metadata.name}
                property={metadata.name}
                {addKeyframe}
              >
                <InputPropery
                  metadata={propMetadata}
                  value={currentAnimatedProps[propMetadata.name]}
                  onUpdateProp={(name, v) => updateLayerProps(name, v)}
                  layer={selectedLayer}
                />
              </InputWrapper>
            {/if}
          {/each}
          {#each layerCustomPropertyComponents as [name, { component: CustomPropertyComponent }] (name)}
            <CustomPropertyComponent
              layer={selectedLayer}
              onUpdateProp={(name, v) => updateLayerProps(name, v)}
              {addKeyframe}
            />
          {/each}
        </PropertiesGroup>
      {/if}

      <Separator />

      <!-- Animation Presets -->
      <PropertiesGroup label="Animation Presets">
        <InputWrapper id="animation-presets" label="Animation Presets">
          <select
            bind:value={selectedPresetId}
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="">Select...</option>
            {#each animationPresets as preset (preset.id)}
              <option value={preset.id}>{preset.name}</option>
            {/each}
          </select>
        </InputWrapper>

        <InputWrapper id="preset-duration" label="Duration (s)">
          <ScrubInput
            id="preset-duration"
            value={presetDuration}
            min={0.1}
            step={0.1}
            onchange={(v) => (presetDuration = v)}
          />
        </InputWrapper>

        <Button variant="default" class="w-full" onclick={applyPreset} disabled={!selectedPresetId}>
          <Sparkles class="mr-2 h-4 w-4" />
          Apply Preset
        </Button>
      </PropertiesGroup>

      <Separator />

      <!-- Keyframes -->
      <PropertiesGroup label={`Keyframes ${selectedLayer.keyframes.length}`}>
        <LayerKeyframes layer={selectedLayer} />
      </PropertiesGroup>
    </div>
  {:else}
    <div class="flex items-center justify-center p-8">
      <div class="text-center text-sm text-muted-foreground">
        <p>No layer selected</p>
        <p class="mt-1 text-xs">Select a layer to edit its properties</p>
      </div>
    </div>
  {/if}
</div>

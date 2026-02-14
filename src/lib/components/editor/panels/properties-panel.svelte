<script lang="ts">
  import { getEditorState } from '$lib/contexts/editor.svelte';
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
    Sparkles,
    Link,
    Unlink
  } from '@lucide/svelte';
  import { nanoid } from 'nanoid';
  import type {
    AnimatableProperty,
    Transform,
    LayerStyle,
    AnchorPoint,
    Interpolation,
    InterpolationFamily
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

  import { SvelteSet } from 'svelte/reactivity';
  import PropertiesGroup from './properties-group.svelte';
  import InputsWrapper from './inputs-wrapper.svelte';
  import InputPropery from './input-propery.svelte';
  import LayerKeyframes from './layer-keyframes.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { Select } from '$lib/components/ui/select';
  import { scaleMiddleware } from '$lib/schemas/size';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);
  const selectedLayer = $derived(projectStore.selectedLayer);

  // Extract property metadata from the layer's Zod schema
  const layerPropertyMetadata = $derived.by(() => {
    if (!selectedLayer) return [];
    const schema = getLayerSchema(selectedLayer.type);
    return extractPropertyMetadata(schema);
  });

  const layerDefinition = $derived.by(() => {
    if (!selectedLayer) return null;
    return getLayerDefinition(selectedLayer.type);
  });

  const layerCustomPropertyComponents = $derived.by(() => {
    if (!selectedLayer || !layerDefinition) return [];
    return Object.entries(layerDefinition.customPropertyComponents ?? {});
  });

  // Pre-compute property rendering layout: groups + ungrouped fields
  const propertyLayout = $derived.by(() => {
    if (!layerPropertyMetadata.length) return { items: [] };
    const groups = layerDefinition?.propertyGroups ?? [];
    const renderedGroupIds = new SvelteSet<string>();
    const items: Array<
      | { kind: 'field'; field: (typeof layerPropertyMetadata)[number] }
      | {
          kind: 'group';
          group: (typeof groups)[number];
          fields: typeof layerPropertyMetadata;
        }
    > = [];

    for (const meta of layerPropertyMetadata) {
      if (meta.meta?.hidden) continue;
      const groupId = meta.meta?.group;
      if (groupId) {
        if (renderedGroupIds.has(groupId)) continue;
        renderedGroupIds.add(groupId);
        const group = groups.find((g) => g.id === groupId);
        if (group) {
          const groupFields = layerPropertyMetadata.filter((m) => m.meta?.group === groupId);
          items.push({ kind: 'group', group, fields: groupFields });
          continue;
        }
      }
      items.push({ kind: 'field', field: meta });
    }
    return { items };
  });

  // Unified current values: transform + style + props (animated when keyframes exist)
  const currentValues = $derived.by(() => {
    if (!selectedLayer) return null;

    const animatedTransform = getAnimatedTransform(
      selectedLayer.keyframes,
      projectStore.currentTime
    );
    const animatedStyle = getAnimatedStyle(selectedLayer.keyframes, projectStore.currentTime);

    return {
      transform: {
        x: animatedTransform.position.x ?? selectedLayer.transform.x,
        y: animatedTransform.position.y ?? selectedLayer.transform.y,
        z: animatedTransform.position.z ?? selectedLayer.transform.z,
        rotationX: animatedTransform.rotation.x ?? selectedLayer.transform.rotationX,
        rotationY: animatedTransform.rotation.y ?? selectedLayer.transform.rotationY,
        rotationZ: animatedTransform.rotation.z ?? selectedLayer.transform.rotationZ,
        scaleX: animatedTransform.scale.x ?? selectedLayer.transform.scaleX,
        scaleY: animatedTransform.scale.y ?? selectedLayer.transform.scaleY
      },
      style: {
        opacity: animatedStyle.opacity ?? selectedLayer.style.opacity
      },
      props: getAnimatedProps(
        selectedLayer.keyframes,
        selectedLayer.props,
        layerPropertyMetadata,
        projectStore.currentTime
      )
    };
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

  function updateLayerProperty<K extends keyof Pick<TypedLayer, 'name'>>(
    property: K,
    value: TypedLayer[K]
  ) {
    if (!selectedLayer) return;
    projectStore.updateLayer(selectedLayer.id, { [property]: value });
  }

  // Map property names to AnimatableProperty format
  const transformPropertyMap: Record<string, AnimatableProperty> = {
    x: 'position.x',
    y: 'position.y',
    z: 'position.z',
    rotationX: 'rotation.x',
    rotationY: 'rotation.y',
    rotationZ: 'rotation.z',
    scaleX: 'scale.x',
    scaleY: 'scale.y'
  };

  function mapToAnimatable(
    target: 'transform' | 'props' | 'style',
    propertyName: string
  ): AnimatableProperty {
    if (target === 'transform') return transformPropertyMap[propertyName];
    if (target === 'props') return `props.${propertyName}` as AnimatableProperty;
    return propertyName as AnimatableProperty; // style: 'opacity'
  }

  /**
   * Get default interpolation for a property based on its metadata
   */
  function getDefaultInterpolationForProperty(property: AnimatableProperty): Interpolation {
    // Extract property name from animatable property (e.g., "props.fontSize" -> "fontSize")
    const propertyName = property.includes('.') ? property.split('.').pop()! : property;

    // Find metadata for this property
    const metadata = layerPropertyMetadata.find((m) => m.name === propertyName);

    if (!metadata) {
      // Default for built-in properties (position, scale, rotation, opacity)
      return { family: 'continuous', strategy: 'ease-in-out' };
    }

    // Get first family if array, otherwise use the family
    const family: InterpolationFamily = Array.isArray(metadata.interpolationFamily)
      ? metadata.interpolationFamily[0]
      : metadata.interpolationFamily;

    // Return appropriate default based on family
    switch (family) {
      case 'continuous':
        return { family: 'continuous', strategy: 'linear' };
      case 'discrete':
        return { family: 'discrete', strategy: 'step-end' };
      case 'quantized':
        return { family: 'quantized', strategy: 'integer' };
      case 'text':
        return { family: 'text', strategy: 'char-reveal' };
      default:
        return { family: 'continuous', strategy: 'linear' };
    }
  }

  /**
   * Helper to update an animatable property - handles keyframe logic.
   * If the property has keyframes, updates/creates keyframe at current time.
   * If updateBase is provided and no keyframes exist, calls updateBase.
   * If updateBase is not provided, always creates/updates keyframe.
   */
  function updateAnimatableValue(
    layer: TypedLayer,
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
        // Get default interpolation based on property metadata
        const interpolation = getDefaultInterpolationForProperty(animatableProperty);
        projectStore.addKeyframe(layer.id, {
          id: nanoid(),
          time: currentTime,
          property: animatableProperty,
          value,
          interpolation
        });
      }
    } else {
      updateBase();
    }
  }

  /**
   * Unified property update function.
   * Handles transform, style, and props targets.
   * For props: runs middleware if defined (e.g., aspect ratio linking).
   */
  function updateProperty(
    propertyName: string,
    value: unknown,
    target: 'transform' | 'props' | 'style'
  ) {
    if (!selectedLayer) return;

    if (target === 'props' && layerDefinition?.middleware && currentValues) {
      // Run middleware for props - may return multiple updates
      const updates = layerDefinition.middleware(propertyName, value, {
        transform: { ...selectedLayer.transform, ...currentValues.transform },
        style: { ...selectedLayer.style, ...currentValues.style },
        props: currentValues.props
      });

      for (const [prop, val] of Object.entries(updates)) {
        const animatable = mapToAnimatable('props', prop);
        updateAnimatableValue(selectedLayer, animatable, val as number | string | boolean, () => {
          const newProps = { ...selectedLayer.props, [prop]: val };
          projectStore.updateLayer(selectedLayer.id, { props: newProps });
        });
      }
      return;
    }

    const animatable = mapToAnimatable(target, propertyName);

    if (target === 'transform' && currentValues) {
      // Run scale middleware for scaleX/scaleY
      const updates = scaleMiddleware(propertyName, value, {
        transform: { ...selectedLayer.transform, ...currentValues?.transform },
        style: { ...selectedLayer.style, ...currentValues.style },
        props: currentValues.props
      });

      for (const [prop, val] of Object.entries(updates)) {
        const propAnimatable = mapToAnimatable('transform', prop);
        updateAnimatableValue(
          selectedLayer,
          propAnimatable,
          val as number | string | boolean,
          () => {
            const newTransform: Transform = {
              ...selectedLayer.transform,
              [prop]: val
            };
            projectStore.updateLayer(selectedLayer.id, { transform: newTransform });
          }
        );
      }
    } else if (target === 'style') {
      updateAnimatableValue(selectedLayer, animatable, value as number | string | boolean, () => {
        const newStyle: LayerStyle = { ...selectedLayer.style, [propertyName]: value };
        projectStore.updateLayer(selectedLayer.id, { style: newStyle });
      });
    } else {
      // props without middleware
      updateAnimatableValue(selectedLayer, animatable, value as number | string | boolean, () => {
        const newProps = { ...selectedLayer.props, [propertyName]: value };
        projectStore.updateLayer(selectedLayer.id, { props: newProps });
      });
    }
  }

  function addKeyframe(property: AnimatableProperty) {
    if (!selectedLayer || !currentValues) return;

    const propertyValueMap: Record<string, number> = {
      'position.x': currentValues.transform.x,
      'position.y': currentValues.transform.y,
      'position.z': currentValues.transform.z,
      'rotation.x': currentValues.transform.rotationX,
      'rotation.y': currentValues.transform.rotationY,
      'rotation.z': currentValues.transform.rotationZ,
      'scale.x': currentValues.transform.scaleX,
      'scale.y': currentValues.transform.scaleY,
      opacity: currentValues.style.opacity
    };

    let currentValue: number | string | boolean;

    if (property in propertyValueMap) {
      currentValue = propertyValueMap[property];
    } else if (property.startsWith('props.')) {
      const propName = property.slice(6);
      currentValue = (currentValues.props[propName] as number | string | boolean) ?? 0;
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
                    projectStore.state.duration,
                    projectStore.state.duration -
                      (selectedLayer.contentDuration - (selectedLayer.contentOffset ?? 0))
                  )
                : projectStore.state.duration}
              step={0.1}
              onchange={(v) => projectStore.setLayerEnterTime(selectedLayer.id, v)}
            />
          </div>
          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">Exit (s)</Label>
            <ScrubInput
              id="exit-time"
              value={selectedLayer.exitTime ?? projectStore.state.duration}
              min={0}
              max={projectStore.state.duration}
              step={0.1}
              onchange={(v) => projectStore.setLayerExitTime(selectedLayer.id, v)}
            />
          </div>
        </div>

        <!-- Content offset control for time-based layers -->
        <!-- TODO: manage like audio/video middleware -->
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
        <!-- TODO: manage like groups -->
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
              valueX={currentValues?.transform.x ?? 0}
              valueY={currentValues?.transform.y ?? 0}
              valueZ={currentValues?.transform.z ?? 0}
              stepXY={1}
              stepZ={1}
              onchangeX={(v: number) => updateProperty('x', v, 'transform')}
              onchangeY={(v: number) => updateProperty('y', v, 'transform')}
              onchangeZ={(v: number) => updateProperty('z', v, 'transform')}
            />
          {/snippet}

          <ScrubInput
            id="pos-x"
            value={currentValues?.transform.x ?? 0}
            onchange={(v) => updateProperty('x', v, 'transform')}
          />

          <ScrubInput
            id="pos-y"
            value={currentValues?.transform.y ?? 0}
            onchange={(v) => updateProperty('y', v, 'transform')}
          />
          <ScrubInput
            id="pos-z"
            value={currentValues?.transform.z ?? 0}
            onchange={(v) => updateProperty('z', v, 'transform')}
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
            <Label class="text-xs text-muted-foreground">Rotation</Label>
            <ScrubXyz
              valueX={currentValues?.transform.rotationY ?? 0}
              valueY={currentValues?.transform.rotationX ?? 0}
              valueZ={currentValues?.transform.rotationZ ?? 0}
              stepXY={0.1}
              stepZ={0.1}
              invertY={true}
              onchangeX={(v: number) => updateProperty('rotationY', v, 'transform')}
              onchangeY={(v: number) => updateProperty('rotationX', v, 'transform')}
              onchangeZ={(v: number) => updateProperty('rotationZ', v, 'transform')}
            />
          {/snippet}
          <ScrubInput
            id="rot-x"
            value={currentValues?.transform.rotationX ?? 0}
            step={0.1}
            onchange={(v) => updateProperty('rotationX', v, 'transform')}
          />
          <ScrubInput
            id="rot-y"
            value={currentValues?.transform.rotationY ?? 0}
            step={0.1}
            onchange={(v) => updateProperty('rotationY', v, 'transform')}
          />
          <ScrubInput
            id="rot-z"
            value={currentValues?.transform.rotationZ ?? 0}
            step={0.1}
            onchange={(v) => updateProperty('rotationZ', v, 'transform')}
          />
        </InputsWrapper>

        <!-- Scale -->
        {@const scaleLocked = selectedLayer?.props._scaleLocked ?? false}
        {@const currentScaleX = currentValues?.transform.scaleX ?? 1}
        {@const currentScaleY = currentValues?.transform.scaleY ?? 1}
        <InputsWrapper
          fields={[
            { prop: 'scale.x' as AnimatableProperty, label: 'X' },
            { prop: 'scale.y' as AnimatableProperty, label: 'Y' }
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
              valueX={currentScaleX}
              valueY={currentScaleY}
              valueZ={0}
              stepXY={0.1}
              stepZ={0.1}
              onchangeX={(v: number) => updateProperty('scaleX', v || 1, 'transform')}
              onchangeY={(v: number) => updateProperty('scaleY', v || 1, 'transform')}
              onchangeZ={() => {}}
            />
            <Button
              variant="ghost"
              size="sm"
              class="ml-auto h-6 px-2 text-xs"
              title={scaleLocked ? 'Unlock proportions' : 'Lock proportions'}
              onclick={() => {
                const newLocked = !scaleLocked;
                const ratio = currentScaleX / currentScaleY;
                const newProps = {
                  ...selectedLayer.props,
                  _scaleLocked: newLocked,
                  _scaleRatio: ratio
                };
                projectStore.updateLayer(selectedLayer.id, { props: newProps });
              }}
            >
              {#if scaleLocked}
                <Link class="size-3" />
              {:else}
                <Unlink class="size-3" />
              {/if}
            </Button>
          {/snippet}
          <ScrubInput
            id="scale-x"
            value={currentScaleX}
            step={0.1}
            onchange={(v) => updateProperty('scaleX', v || 1, 'transform')}
          />
          <ScrubInput
            id="scale-y"
            value={currentScaleY}
            step={0.1}
            onchange={(v) => updateProperty('scaleY', v || 1, 'transform')}
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
            value={currentValues?.style.opacity ?? 1}
            step={0.1}
            min={0}
            max={1}
            onchange={(v) => updateProperty('opacity', v || 0, 'style')}
          />
        </InputWrapper>
      </PropertiesGroup>

      <!-- Layer-specific properties (dynamic based on schema) -->
      {#if propertyLayout.items.length > 0}
        <Separator />
        <PropertiesGroup label="Layer Properties">
          {#each propertyLayout.items as item (item.kind === 'group' ? `group:${item.group.id}` : `field:${item.field.name}`)}
            {#if item.kind === 'group'}
              <InputsWrapper
                fields={item.fields.map((field) => ({
                  id: `props.${field.name}`,
                  labels: field.description || field.name,
                  property: `props.${field.name}` as AnimatableProperty,
                  addKeyframe,
                  hasKeyframes: selectedLayer.keyframes.some(
                    (k) => k.property === `props.${field.name}`
                  )
                }))}
              >
                {#snippet prefix()}
                  <Label class="text-xs text-muted-foreground">{item.group.label}</Label>
                  {#if item.group.widget && currentValues}
                    {@const groupValues = Object.fromEntries(
                      item.fields.map((f) => [f.name, currentValues.props[f.name]])
                    )}
                    {@const Widget = item.group.widget}
                    <Widget
                      layer={selectedLayer}
                      groupId={item.group.id}
                      currentValues={groupValues}
                      onUpdate={(prop, val) => updateProperty(prop, val, 'props')}
                    />
                  {/if}
                {/snippet}

                {#each item.fields as field (field.name)}
                  <InputPropery
                    metadata={field}
                    value={currentValues?.props[field.name]}
                    onUpdateProp={(name, v) => updateProperty(name, v, 'props')}
                    layer={selectedLayer}
                  />
                {/each}
              </InputsWrapper>
            {:else}
              <InputWrapper
                id={item.field.name}
                label={item.field.description || item.field.name}
                property={`props.${item.field.name}`}
                {addKeyframe}
              >
                <InputPropery
                  metadata={item.field}
                  value={currentValues?.props[item.field.name]}
                  onUpdateProp={(name, v) => updateProperty(name, v, 'props')}
                  layer={selectedLayer}
                />
              </InputWrapper>
            {/if}
          {/each}
          {#each layerCustomPropertyComponents as [name, { component: CustomPropertyComponent }] (name)}
            <CustomPropertyComponent
              layer={selectedLayer}
              onUpdateProp={(name, v) => updateProperty(name, v, 'props')}
              {addKeyframe}
            />
          {/each}
        </PropertiesGroup>
      {/if}

      <Separator />

      <!-- Animation Presets -->
      <PropertiesGroup label="Animation Presets">
        <InputsWrapper
          fields={[
            {
              id: 'animation-presets',
              labels: 'Animation'
            },
            {
              id: 'preset-duration',
              labels: 'Duration (s)'
            }
          ]}
        >
          <Select
            bind:value={selectedPresetId}
            options={animationPresets.map((preset) => ({ label: preset.name, value: preset.id }))}
            trigger={{ class: 'w-full' }}
          />
          <ScrubInput
            id="preset-duration"
            value={presetDuration}
            min={0.1}
            step={0.1}
            onchange={(v) => (presetDuration = v)}
          />
        </InputsWrapper>

        <Button variant="default" class="w-full" onclick={applyPreset} disabled={!selectedPresetId}>
          <Sparkles class="mr-2 h-4 w-4" />
          Apply Preset
        </Button>
      </PropertiesGroup>

      <Separator />

      <!-- Keyframes -->
      <PropertiesGroup label={`Keyframes (${selectedLayer.keyframes.length})`}>
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

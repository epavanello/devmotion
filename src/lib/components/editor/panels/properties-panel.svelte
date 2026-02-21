<script lang="ts">
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Separator } from '$lib/components/ui/separator';
  import { nanoid } from 'nanoid';
  import type { AnimatableProperty, LayerStyle } from '$lib/types/animation';
  import {
    getAnimatedTransform,
    getAnimatedStyle,
    getAnimatedProps
  } from '$lib/engine/interpolation';
  import { getLayerSchema } from '$lib/layers/registry';
  import { extractPropertyMetadata } from '$lib/layers/base';
  import PropertiesGroup from './properties-group.svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import { scaleMiddleware } from '$lib/schemas/size';
  import { isProjectLayer, mapProjectLayerPropsToProject } from '$lib/layers/project-layer';
  import type { Layer } from '$lib/schemas/animation';
  import { getDefaultInterpolationForProperty } from '$lib/utils/interpolation-utils';
  import { defaultLayerStyle, defaultTransform } from '$lib/schemas/base';
  import { Clock, Move, Palette, Layers, Sparkles, Boxes } from '@lucide/svelte';

  // Property group components
  import TimeRangeGroup from './properties/groups/time-range-group.svelte';
  import TransformGroup from './properties/groups/transform-group.svelte';
  import StyleGroup from './properties/groups/style-group.svelte';
  import AnimationPresetsGroup from './properties/groups/animation-presets-group.svelte';
  import KeyframesGroup from './properties/groups/keyframes-group.svelte';
  import LayerPropertiesGroup from './properties/groups/layer-properties-group.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);
  const selectedLayer = $derived(projectStore.selectedLayer);

  /** Whether the currently selected layer is the virtual project settings layer */
  const isProjectSettings = $derived(isProjectLayer(projectStore.selectedLayerId));

  // Extract property metadata from the layer's Zod schema
  const layerPropertyMetadata = $derived.by(() => {
    if (!selectedLayer) return [];
    const schema = getLayerSchema(selectedLayer.type);
    return extractPropertyMetadata(schema);
  });

  // Unified current values: transform + style + props (animated when keyframes exist)
  const currentValues = $derived.by((): Pick<Layer, 'transform' | 'style' | 'props'> | null => {
    if (!selectedLayer) return null;

    // For the project settings layer, there are no keyframes, so just use static props
    if (isProjectSettings) {
      return {
        transform: defaultTransform(),
        style: defaultLayerStyle(),
        props: { ...selectedLayer.props }
      };
    }

    const animatedTransform = getAnimatedTransform(
      selectedLayer.keyframes,
      projectStore.currentTime
    );
    const animatedStyle = getAnimatedStyle(selectedLayer.keyframes, projectStore.currentTime);

    return {
      transform: {
        ...selectedLayer.transform,
        position: {
          x: animatedTransform.position.x ?? selectedLayer.transform.position.x,
          y: animatedTransform.position.y ?? selectedLayer.transform.position.y,
          z: animatedTransform.position.z ?? selectedLayer.transform.position.z
        },
        rotation: {
          x: animatedTransform.rotation.x ?? selectedLayer.transform.rotation.x,
          y: animatedTransform.rotation.y ?? selectedLayer.transform.rotation.y,
          z: animatedTransform.rotation.z ?? selectedLayer.transform.rotation.z
        },
        scale: {
          x: animatedTransform.scale.x ?? selectedLayer.transform.scale.x,
          y: animatedTransform.scale.y ?? selectedLayer.transform.scale.y
        }
      },
      style: {
        opacity: animatedStyle.opacity ?? selectedLayer.style.opacity,
        blur: animatedStyle.blur ?? selectedLayer.style.blur ?? 0,
        brightness: animatedStyle.brightness ?? selectedLayer.style.brightness ?? 1,
        contrast: animatedStyle.contrast ?? selectedLayer.style.contrast ?? 1,
        saturate: animatedStyle.saturate ?? selectedLayer.style.saturate ?? 1,
        dropShadowX: animatedStyle.dropShadowX ?? selectedLayer.style.dropShadowX ?? 0,
        dropShadowY: animatedStyle.dropShadowY ?? selectedLayer.style.dropShadowY ?? 0,
        dropShadowBlur: animatedStyle.dropShadowBlur ?? selectedLayer.style.dropShadowBlur ?? 0,
        dropShadowColor:
          animatedStyle.dropShadowColor ?? selectedLayer.style.dropShadowColor ?? 'transparent'
      },
      props: getAnimatedProps(
        selectedLayer.keyframes,
        selectedLayer.props,
        layerPropertyMetadata,
        projectStore.currentTime
      )
    };
  });

  function updateLayerProperty<K extends keyof Pick<TypedLayer, 'name'>>(
    property: K,
    value: TypedLayer[K]
  ) {
    if (!selectedLayer) return;
    // For the project settings layer, route name change to updateProject
    if (isProjectSettings) {
      projectStore.updateProject({ [property]: value });
      return;
    }
    projectStore.updateLayer(selectedLayer.id, { [property]: value });
  }

  function mapToAnimatable(
    target: 'transform' | 'props' | 'style',
    propertyName: string
  ): AnimatableProperty {
    if (target === 'transform') {
      return propertyName;
    }
    if (target === 'props') {
      return `props.${propertyName}` as AnimatableProperty;
    }
    return propertyName as AnimatableProperty; // style: 'opacity'
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
        const interpolation = getDefaultInterpolationForProperty(layer.type, animatableProperty);
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
   * Deep set a property on an object using dot notation.
   * E.g., setDeep(obj, 'position.x', 10) sets obj.position.x = 10
   */
  function setDeep<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
    const keys = path.split('.');
    const result = { ...obj };
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = { ...(current[key] as Record<string, unknown>) };
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return result;
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

    // For the project settings layer, route props directly to updateProject
    if (isProjectSettings && target === 'props') {
      const projectUpdates = mapProjectLayerPropsToProject({ [propertyName]: value });
      projectStore.updateProject(projectUpdates);
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
            // Handle deep property access for transform (e.g., 'position.x', 'scale.y')
            const newTransform = setDeep(selectedLayer.transform, prop, val);
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

    const propertyValueMap: Record<string, number | string> = {
      'position.x': currentValues.transform.position.x,
      'position.y': currentValues.transform.position.y,
      'position.z': currentValues.transform.position.z,
      'rotation.x': currentValues.transform.rotation.x,
      'rotation.y': currentValues.transform.rotation.y,
      'rotation.z': currentValues.transform.rotation.z,
      'scale.x': currentValues.transform.scale.x,
      'scale.y': currentValues.transform.scale.y,
      opacity: currentValues.style.opacity,
      blur: currentValues.style.blur,
      brightness: currentValues.style.brightness,
      contrast: currentValues.style.contrast,
      saturate: currentValues.style.saturate,
      dropShadowX: currentValues.style.dropShadowX,
      dropShadowY: currentValues.style.dropShadowY,
      dropShadowBlur: currentValues.style.dropShadowBlur,
      dropShadowColor: currentValues.style.dropShadowColor
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

  const hasLayerProperties = $derived(layerPropertyMetadata.length > 0);
</script>

<div
  class:pointer-events-none={projectStore.isRecording}
  class:opacity-50={projectStore.isRecording}
  data-panel="properties"
>
  {#if selectedLayer}
    <div class="space-y-4 p-4">
      <!-- Layer Name -->
      <div class="space-y-2">
        <Label for="layer-name">{isProjectSettings ? 'Project Name' : 'Name'}</Label>
        <Input
          id="layer-name"
          value={selectedLayer.name}
          oninput={(e) => updateLayerProperty('name', e.currentTarget.value)}
        />
      </div>

      <!-- Layer-specific properties (dynamic based on schema) -->
      {#if hasLayerProperties}
        <Separator />
        <PropertiesGroup label={isProjectSettings ? 'Project' : 'Layer'} icon={Layers} defaultOpen>
          {#if currentValues}
            <LayerPropertiesGroup
              layer={selectedLayer}
              {currentValues}
              {updateProperty}
              {addKeyframe}
            />
          {/if}
        </PropertiesGroup>
      {/if}

      {#if !isProjectSettings}
        <Separator />

        <!-- Transform -->
        <PropertiesGroup label="Transform" icon={Move}>
          {#if currentValues}
            <TransformGroup layer={selectedLayer} {currentValues} {updateProperty} {addKeyframe} />
          {/if}
        </PropertiesGroup>

        <Separator />

        <!-- Style -->
        <PropertiesGroup label="Style" icon={Palette}>
          {#if currentValues}
            <StyleGroup {currentValues} layer={selectedLayer} {updateProperty} {addKeyframe} />
          {/if}
        </PropertiesGroup>

        <Separator />

        <!-- Time Range -->
        <PropertiesGroup icon={Clock}>
          {#snippet label()}
            <div class="flex w-full items-center justify-between">
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
          <TimeRangeGroup layer={selectedLayer} />
        </PropertiesGroup>
      {/if}

      {#if !isProjectSettings}
        <Separator />

        <!-- Animation Presets -->
        <PropertiesGroup label="Animation Presets" icon={Sparkles}>
          <AnimationPresetsGroup layer={selectedLayer} />
        </PropertiesGroup>

        <Separator />

        <!-- Keyframes -->
        <PropertiesGroup label={`Keyframes (${selectedLayer.keyframes.length})`} icon={Boxes}>
          <KeyframesGroup layer={selectedLayer} />
        </PropertiesGroup>
      {/if}
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

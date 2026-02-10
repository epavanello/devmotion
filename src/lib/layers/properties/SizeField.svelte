<script lang="ts">
  import ScrubInput from '$lib/components/editor/panels/scrub-input.svelte';
  import InputsWrapper from '$lib/components/editor/panels/inputs-wrapper.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Link, Unlink } from '@lucide/svelte';
  import type { Layer, AnimatableProperty } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { getAnimatedProps } from '$lib/engine/interpolation';
  import { extractPropertyMetadata } from '$lib/layers/base';
  import { getLayerSchema } from '$lib/layers/registry';

  let {
    layer,
    onUpdateProp,
    addKeyframe
  }: {
    layer: Layer;
    onUpdateProp: (name: string, value: unknown) => void;
    addKeyframe: (property: AnimatableProperty) => void;
  } = $props();

  // Extract metadata for width and height
  const layerPropertyMetadata = $derived.by(() => {
    const schema = getLayerSchema(layer.type);
    return extractPropertyMetadata(schema);
  });

  // Get current animated values
  const currentAnimatedProps = $derived.by(() => {
    return getAnimatedProps(
      layer.keyframes,
      layer.props,
      layerPropertyMetadata,
      projectStore.currentTime
    );
  });

  const currentWidth = $derived((currentAnimatedProps.width as number) ?? 200);
  const currentHeight = $derived((currentAnimatedProps.height as number) ?? 200);

  // Aspect ratio lock state
  let aspectRatioLocked = $state(false);
  let aspectRatio = $state(1);

  function toggleAspectRatio() {
    if (!aspectRatioLocked && currentHeight !== 0) {
      aspectRatio = currentWidth / currentHeight;
    }
    aspectRatioLocked = !aspectRatioLocked;
  }

  function updateWidth(newWidth: number) {
    onUpdateProp('width', newWidth);
    if (aspectRatioLocked && aspectRatio !== 0) {
      const newHeight = newWidth / aspectRatio;
      onUpdateProp('height', newHeight);
    }
  }

  function updateHeight(newHeight: number) {
    onUpdateProp('height', newHeight);
    if (aspectRatioLocked && aspectRatio !== 0) {
      const newWidth = newHeight * aspectRatio;
      onUpdateProp('width', newWidth);
    }
  }
</script>

<InputsWrapper
  fields={[
    { prop: 'props.width' as AnimatableProperty, label: 'Width' },
    { prop: 'props.height' as AnimatableProperty, label: 'Height' }
  ].map((f) => ({
    id: f.prop,
    labels: f.label,
    property: f.prop,
    addKeyframe: addKeyframe,
    hasKeyframes: layer.keyframes.some((k) => k.property === f.prop)
  }))}
>
  {#snippet prefix()}
    <Label class="text-xs text-muted-foreground">Size</Label>
    <div class="ml-auto">
      <Button
        variant="ghost"
        size="sm"
        onclick={toggleAspectRatio}
        class="h-6 px-2 text-xs"
        title={aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
      >
        {#if aspectRatioLocked}
          <Link class="size-3" />
        {:else}
          <Unlink class="size-3" />
        {/if}
      </Button>
    </div>
  {/snippet}

  <ScrubInput
    id="size-width"
    value={currentWidth}
    min={1}
    max={2000}
    step={1}
    onchange={updateWidth}
  />

  <ScrubInput
    id="size-height"
    value={currentHeight}
    min={1}
    max={2000}
    step={1}
    onchange={updateHeight}
  />
</InputsWrapper>

<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { Pin, Trash2 } from 'lucide-svelte';
  import { nanoid } from 'nanoid';
  import type { AnimatableProperty } from '$lib/types/animation';
  import { getAnimatedTransform, getAnimatedStyle } from '$lib/engine/interpolation';

  const selectedLayer = $derived(projectStore.selectedLayer);

  // Get the current displayed values (animated if keyframes exist, otherwise base values)
  const currentTransform = $derived.by(() => {
    if (!selectedLayer) return null;
    const animatedTransform = getAnimatedTransform(
      selectedLayer.keyframes,
      projectStore.project.currentTime
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
    const animatedStyle = getAnimatedStyle(
      selectedLayer.keyframes,
      projectStore.project.currentTime
    );
    return {
      opacity: animatedStyle.opacity ?? selectedLayer.style.opacity
    };
  });

  const sortedKeyframes = $derived.by(() => {
    if (!selectedLayer) return [];
    return [...selectedLayer.keyframes].sort((a, b) => a.time - b.time);
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
    return labels[property] || property;
  }

  function formatKeyframeValue(value: number | string): string {
    if (typeof value === 'number') {
      return value.toFixed(2);
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

  function updateLayerProperty(property: string, value: string) {
    if (!selectedLayer) return;
    projectStore.updateLayer(selectedLayer.id, { [property]: value } as any);
  }

  function updateTransformProperty(property: string, value: number) {
    if (!selectedLayer) return;
    const newTransform = { ...selectedLayer.transform, [property]: value };
    projectStore.updateLayer(selectedLayer.id, { transform: newTransform });
  }

  function updateStyle(property: string, value: any) {
    if (!selectedLayer) return;
    const newStyle = { ...selectedLayer.style, [property]: value };
    projectStore.updateLayer(selectedLayer.id, { style: newStyle });
  }

  function updateLayerProps(property: string, value: any) {
    if (!selectedLayer) return;
    const newProps = { ...selectedLayer.props, [property]: value };
    projectStore.updateLayer(selectedLayer.id, { props: newProps } as any);
  }

  function addKeyframe(property: AnimatableProperty) {
    if (!selectedLayer || !currentTransform || !currentStyle) return;

    let currentValue: number | string = 0;

    // Get current animated value based on property
    if (property === 'position.x') currentValue = currentTransform.x;
    else if (property === 'position.y') currentValue = currentTransform.y;
    else if (property === 'position.z') currentValue = currentTransform.z;
    else if (property === 'rotation.x') currentValue = currentTransform.rotationX;
    else if (property === 'rotation.y') currentValue = currentTransform.rotationY;
    else if (property === 'rotation.z') currentValue = currentTransform.rotationZ;
    else if (property === 'scale.x') currentValue = currentTransform.scaleX;
    else if (property === 'scale.y') currentValue = currentTransform.scaleY;
    else if (property === 'scale.z') currentValue = currentTransform.scaleZ;
    else if (property === 'opacity') currentValue = currentStyle.opacity;

    projectStore.addKeyframe(selectedLayer.id, {
      id: nanoid(),
      time: projectStore.project.currentTime,
      property,
      value: currentValue,
      easing: { type: 'ease-in-out' }
    });
  }

  interface PropertyFieldProps {
    id: string;
    label: string;
    value: number;
    property: AnimatableProperty;
    step?: string;
    min?: string;
    max?: string;
    onInput: (value: number) => void;
  }
</script>

{#snippet propertyField({ id, label, value, property, step, min, max, onInput }: PropertyFieldProps)}
  <div>
    <div class="mb-1 flex items-center justify-between">
      <Label for={id} class="text-xs">{label}</Label>
      <Button
        variant="ghost"
        size="sm"
        class="h-5 w-5 p-0"
        onclick={() => addKeyframe(property)}
        title="Add keyframe for {label}"
      >
        <Pin class="size-3" />
      </Button>
    </div>
    <Input
      {id}
      type="number"
      {value}
      {step}
      {min}
      {max}
      oninput={(e) => onInput(parseFloat(e.currentTarget.value) || 0)}
    />
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
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Position</Label>
            <div class="grid grid-cols-3 gap-2">
              {@render propertyField({
                id: 'pos-x',
                label: 'X',
                value: currentTransform?.x ?? 0,
                property: 'position.x',
                onInput: (v) => updateTransformProperty('x', v)
              })}
              {@render propertyField({
                id: 'pos-y',
                label: 'Y',
                value: currentTransform?.y ?? 0,
                property: 'position.y',
                onInput: (v) => updateTransformProperty('y', v)
              })}
              {@render propertyField({
                id: 'pos-z',
                label: 'Z',
                value: currentTransform?.z ?? 0,
                property: 'position.z',
                onInput: (v) => updateTransformProperty('z', v)
              })}
            </div>
          </div>

          <!-- Scale -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Scale</Label>
            <div class="grid grid-cols-3 gap-2">
              {@render propertyField({
                id: 'scale-x',
                label: 'X',
                value: currentTransform?.scaleX ?? 1,
                property: 'scale.x',
                step: '0.1',
                onInput: (v) => updateTransformProperty('scaleX', v || 1)
              })}
              {@render propertyField({
                id: 'scale-y',
                label: 'Y',
                value: currentTransform?.scaleY ?? 1,
                property: 'scale.y',
                step: '0.1',
                onInput: (v) => updateTransformProperty('scaleY', v || 1)
              })}
              {@render propertyField({
                id: 'scale-z',
                label: 'Z',
                value: currentTransform?.scaleZ ?? 1,
                property: 'scale.z',
                step: '0.1',
                onInput: (v) => updateTransformProperty('scaleZ', v || 1)
              })}
            </div>
          </div>

          <!-- Rotation -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Rotation (radians)</Label>
            <div class="grid grid-cols-3 gap-2">
              {@render propertyField({
                id: 'rot-x',
                label: 'X',
                value: currentTransform?.rotationX ?? 0,
                property: 'rotation.x',
                step: '0.1',
                onInput: (v) => updateTransformProperty('rotationX', v)
              })}
              {@render propertyField({
                id: 'rot-y',
                label: 'Y',
                value: currentTransform?.rotationY ?? 0,
                property: 'rotation.y',
                step: '0.1',
                onInput: (v) => updateTransformProperty('rotationY', v)
              })}
              {@render propertyField({
                id: 'rot-z',
                label: 'Z',
                value: currentTransform?.rotationZ ?? 0,
                property: 'rotation.z',
                step: '0.1',
                onInput: (v) => updateTransformProperty('rotationZ', v)
              })}
            </div>
          </div>
        </div>

        <Separator />

        <!-- Style -->
        <div class="space-y-3">
          <Label class="font-semibold">Style</Label>

          {@render propertyField({
            id: 'opacity',
            label: 'Opacity',
            value: currentStyle?.opacity ?? 1,
            property: 'opacity',
            step: '0.1',
            min: '0',
            max: '1',
            onInput: (v) => updateStyle('opacity', v || 0)
          })}
        </div>

        <!-- Layer-specific properties -->
        {#if selectedLayer.type === 'text'}
          <Separator />
          <div class="space-y-3">
            <Label class="font-semibold">Text Properties</Label>

            <div class="space-y-2">
              <Label for="text-content" class="text-xs">Content</Label>
              <Input
                id="text-content"
                value={selectedLayer.props.content}
                oninput={(e) => updateLayerProps('content', e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <Label for="font-size" class="text-xs">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                value={selectedLayer.props.fontSize}
                oninput={(e) => updateLayerProps('fontSize', parseInt(e.currentTarget.value) || 48)}
              />
            </div>

            <div class="space-y-2">
              <Label for="text-color" class="text-xs">Color</Label>
              <Input
                id="text-color"
                type="color"
                value={selectedLayer.props.color}
                oninput={(e) => updateLayerProps('color', e.currentTarget.value)}
              />
            </div>
          </div>
        {/if}

        <Separator />

        <!-- Keyframes -->
        <div class="space-y-3">
          <Label class="font-semibold">Keyframes</Label>

          {#if selectedLayer.keyframes.length > 0}
            <div class="mt-4 space-y-2">
              <Label class="text-xs text-muted-foreground">
                {selectedLayer.keyframes.length} keyframe(s)
              </Label>

              <div
                class="max-h-[300px] space-y-1 overflow-y-auto rounded-md border bg-muted/20 p-2"
              >
                {#each sortedKeyframes as keyframe (keyframe.id)}
                  <div
                    class="group flex items-center justify-between rounded-sm bg-background px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                  >
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
                      class="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onclick={() => deleteKeyframe(keyframe.id)}
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
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

<!-- TODO: Implement dynamic property generation from Zod schemas using extractPropertyMetadata from layers/base.ts -->

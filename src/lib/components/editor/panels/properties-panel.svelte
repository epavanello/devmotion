<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { Plus, Trash2 } from 'lucide-svelte';
  import { nanoid } from 'nanoid';
  import type { AnimatableProperty } from '$lib/types/animation';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '$lib/components/ui/dropdown-menu';
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
</script>

<div class="flex h-full flex-col bg-background">
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
              <div>
                <Label for="pos-x" class="text-xs">X</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={currentTransform?.x ?? 0}
                  oninput={(e) =>
                    updateTransformProperty('x', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="pos-y" class="text-xs">Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={currentTransform?.y ?? 0}
                  oninput={(e) =>
                    updateTransformProperty('y', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="pos-z" class="text-xs">Z</Label>
                <Input
                  id="pos-z"
                  type="number"
                  value={currentTransform?.z ?? 0}
                  oninput={(e) =>
                    updateTransformProperty('z', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
            </div>
          </div>

          <!-- Scale -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Scale</Label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <Label for="scale-x" class="text-xs">X</Label>
                <Input
                  id="scale-x"
                  type="number"
                  step="0.1"
                  value={currentTransform?.scaleX ?? 1}
                  oninput={(e) =>
                    updateTransformProperty('scaleX', parseFloat(e.currentTarget.value) || 1)}
                />
              </div>
              <div>
                <Label for="scale-y" class="text-xs">Y</Label>
                <Input
                  id="scale-y"
                  type="number"
                  step="0.1"
                  value={currentTransform?.scaleY ?? 1}
                  oninput={(e) =>
                    updateTransformProperty('scaleY', parseFloat(e.currentTarget.value) || 1)}
                />
              </div>
              <div>
                <Label for="scale-z" class="text-xs">Z</Label>
                <Input
                  id="scale-z"
                  type="number"
                  step="0.1"
                  value={currentTransform?.scaleZ ?? 1}
                  oninput={(e) =>
                    updateTransformProperty('scaleZ', parseFloat(e.currentTarget.value) || 1)}
                />
              </div>
            </div>
          </div>

          <!-- Rotation -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Rotation (radians)</Label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <Label for="rot-x" class="text-xs">X</Label>
                <Input
                  id="rot-x"
                  type="number"
                  step="0.1"
                  value={currentTransform?.rotationX ?? 0}
                  oninput={(e) =>
                    updateTransformProperty('rotationX', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="rot-y" class="text-xs">Y</Label>
                <Input
                  id="rot-y"
                  type="number"
                  step="0.1"
                  value={currentTransform?.rotationY ?? 0}
                  oninput={(e) =>
                    updateTransformProperty('rotationY', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="rot-z" class="text-xs">Z</Label>
                <Input
                  id="rot-z"
                  type="number"
                  step="0.1"
                  value={currentTransform?.rotationZ ?? 0}
                  oninput={(e) =>
                    updateTransformProperty('rotationZ', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Style -->
        <div class="space-y-3">
          <Label class="font-semibold">Style</Label>

          <div class="space-y-2">
            <Label for="opacity" class="text-xs">Opacity</Label>
            <Input
              id="opacity"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={currentStyle?.opacity ?? 1}
              oninput={(e) => updateStyle('opacity', parseFloat(e.currentTarget.value) || 0)}
            />
          </div>
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
          <Label class="font-semibold">Animation</Label>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" class="w-full">
                <Plus class="mr-2 h-4 w-4" />
                Add Keyframe
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onclick={() => addKeyframe('position.x')}
                >Position X</DropdownMenuItem
              >
              <DropdownMenuItem onclick={() => addKeyframe('position.y')}
                >Position Y</DropdownMenuItem
              >
              <DropdownMenuItem onclick={() => addKeyframe('scale.x')}>Scale X</DropdownMenuItem>
              <DropdownMenuItem onclick={() => addKeyframe('scale.y')}>Scale Y</DropdownMenuItem>
              <DropdownMenuItem onclick={() => addKeyframe('rotation.z')}
                >Rotation Z</DropdownMenuItem
              >
              <DropdownMenuItem onclick={() => addKeyframe('opacity')}>Opacity</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

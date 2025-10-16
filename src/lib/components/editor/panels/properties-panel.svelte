<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { Plus, Sparkles, Trash2 } from 'lucide-svelte';
  import { nanoid } from 'nanoid';
  import type { AnimatableProperty } from '$lib/types/animation';
  import { animationPresets } from '$lib/engine/presets';
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
        y: animatedTransform.scale.y ?? selectedLayer.transform.scale.y,
        z: animatedTransform.scale.z ?? selectedLayer.transform.scale.z
      }
    };
  });

  const currentStyle = $derived.by(() => {
    if (!selectedLayer) return null;
    const animatedStyle = getAnimatedStyle(
      selectedLayer.keyframes,
      projectStore.project.currentTime
    );
    return {
      opacity: animatedStyle.opacity ?? selectedLayer.style.opacity,
      color: animatedStyle.color ?? selectedLayer.style.color
    };
  });

  // Sort keyframes by time for display
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
      opacity: 'Opacity',
      color: 'Color'
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

  function updateTransform(
    axis: 'x' | 'y' | 'z',
    type: 'position' | 'rotation' | 'scale',
    value: number
  ) {
    if (!selectedLayer) return;

    const property = `${type}.${axis}` as AnimatableProperty;
    const currentTime = projectStore.project.currentTime;

    // Check if there's a keyframe for this property at the current time
    const keyframe = selectedLayer.keyframes.find(
      (k) => k.property === property && k.time === currentTime
    );

    if (keyframe) {
      // Update the keyframe value
      projectStore.updateKeyframe(selectedLayer.id, keyframe.id, { value });
    } else {
      // Update the base transform
      const newTransform = { ...selectedLayer.transform };
      newTransform[type][axis] = value;
      projectStore.updateLayer(selectedLayer.id, { transform: newTransform });
    }
  }

  function updateStyle(property: string, value: any) {
    if (!selectedLayer) return;

    const currentTime = projectStore.project.currentTime;

    // Check if there's a keyframe for this property at the current time
    const keyframe = selectedLayer.keyframes.find(
      (k) => k.property === property && k.time === currentTime
    );

    if (keyframe) {
      // Update the keyframe value
      projectStore.updateKeyframe(selectedLayer.id, keyframe.id, { value });
    } else {
      // Update the base style
      const newStyle = { ...selectedLayer.style, [property]: value };
      projectStore.updateLayer(selectedLayer.id, { style: newStyle });
    }
  }

  function updateTextData(property: string, value: any) {
    if (!selectedLayer || !selectedLayer.textData) return;
    const newTextData = { ...selectedLayer.textData, [property]: value };
    projectStore.updateLayer(selectedLayer.id, { textData: newTextData });
  }

  function addKeyframe(property: AnimatableProperty) {
    if (!selectedLayer || !currentTransform || !currentStyle) return;

    let currentValue: number | string = 0;

    // Get current animated value based on property
    if (property.startsWith('position.')) {
      const axis = property.split('.')[1] as 'x' | 'y' | 'z';
      currentValue = currentTransform.position[axis];
    } else if (property.startsWith('rotation.')) {
      const axis = property.split('.')[1] as 'x' | 'y' | 'z';
      currentValue = currentTransform.rotation[axis];
    } else if (property.startsWith('scale.')) {
      const axis = property.split('.')[1] as 'x' | 'y' | 'z';
      currentValue = currentTransform.scale[axis];
    } else if (property === 'opacity') {
      currentValue = currentStyle.opacity;
    } else if (property === 'color') {
      currentValue = currentStyle.color;
    }

    projectStore.addKeyframe(selectedLayer.id, {
      id: nanoid(),
      time: projectStore.project.currentTime,
      property,
      value: currentValue,
      easing: { type: 'ease-in-out' }
    });
  }

  function applyPreset(presetId: string) {
    if (!selectedLayer) return;

    const preset = animationPresets.find((p) => p.id === presetId);
    if (!preset) return;

    // Add all keyframes from preset
    preset.keyframes.forEach((kf) => {
      projectStore.addKeyframe(selectedLayer.id, {
        id: nanoid(),
        ...kf
      });
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
          <div class="flex items-center justify-between">
            <Label class="font-semibold">Transform</Label>
          </div>

          <!-- Position -->
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Position</Label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <Label for="pos-x" class="text-xs">X</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={currentTransform?.position.x ?? 0}
                  oninput={(e) =>
                    updateTransform('x', 'position', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="pos-y" class="text-xs">Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={currentTransform?.position.y ?? 0}
                  oninput={(e) =>
                    updateTransform('y', 'position', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="pos-z" class="text-xs">Z</Label>
                <Input
                  id="pos-z"
                  type="number"
                  value={currentTransform?.position.z ?? 0}
                  oninput={(e) =>
                    updateTransform('z', 'position', parseFloat(e.currentTarget.value) || 0)}
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
                  value={currentTransform?.scale.x ?? 1}
                  oninput={(e) =>
                    updateTransform('x', 'scale', parseFloat(e.currentTarget.value) || 1)}
                />
              </div>
              <div>
                <Label for="scale-y" class="text-xs">Y</Label>
                <Input
                  id="scale-y"
                  type="number"
                  step="0.1"
                  value={currentTransform?.scale.y ?? 1}
                  oninput={(e) =>
                    updateTransform('y', 'scale', parseFloat(e.currentTarget.value) || 1)}
                />
              </div>
              <div>
                <Label for="scale-z" class="text-xs">Z</Label>
                <Input
                  id="scale-z"
                  type="number"
                  step="0.1"
                  value={currentTransform?.scale.z ?? 1}
                  oninput={(e) =>
                    updateTransform('z', 'scale', parseFloat(e.currentTarget.value) || 1)}
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
                  value={currentTransform?.rotation.x ?? 0}
                  oninput={(e) =>
                    updateTransform('x', 'rotation', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="rot-y" class="text-xs">Y</Label>
                <Input
                  id="rot-y"
                  type="number"
                  step="0.1"
                  value={currentTransform?.rotation.y ?? 0}
                  oninput={(e) =>
                    updateTransform('y', 'rotation', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="rot-z" class="text-xs">Z</Label>
                <Input
                  id="rot-z"
                  type="number"
                  step="0.1"
                  value={currentTransform?.rotation.z ?? 0}
                  oninput={(e) =>
                    updateTransform('z', 'rotation', parseFloat(e.currentTarget.value) || 0)}
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

          <div class="space-y-2">
            <Label for="color" class="text-xs">Color</Label>
            <Input
              id="color"
              type="color"
              value={currentStyle?.color ?? '#ffffff'}
              oninput={(e) => updateStyle('color', e.currentTarget.value)}
            />
          </div>
        </div>

        {#if selectedLayer.type === 'text' && selectedLayer.textData}
          <Separator />

          <!-- Text Properties -->
          <div class="space-y-3">
            <Label class="font-semibold">Text</Label>

            <div class="space-y-2">
              <Label for="text-content" class="text-xs">Content</Label>
              <Input
                id="text-content"
                value={selectedLayer.textData.content}
                oninput={(e) => updateTextData('content', e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <Label for="font-size" class="text-xs">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                value={selectedLayer.textData.fontSize}
                oninput={(e) => updateTextData('fontSize', parseInt(e.currentTarget.value) || 48)}
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

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" class="w-full">
                <Sparkles class="mr-2 h-4 w-4" />
                Apply Preset
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {#each animationPresets as preset}
                <DropdownMenuItem onclick={() => applyPreset(preset.id)}>
                  {preset.name}
                </DropdownMenuItem>
              {/each}
            </DropdownMenuContent>
          </DropdownMenu>

          {#if selectedLayer.keyframes.length > 0}
            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs text-muted-foreground">
                  {selectedLayer.keyframes.length} keyframe(s)
                </Label>
              </div>

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

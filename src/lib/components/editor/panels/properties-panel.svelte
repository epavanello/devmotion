<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { Plus, Sparkles } from 'lucide-svelte';
  import { nanoid } from 'nanoid';
  import type { AnimatableProperty } from '$lib/types/animation';
  import { animationPresets } from '$lib/engine/presets';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '$lib/components/ui/dropdown-menu';

  const selectedLayer = $derived(projectStore.selectedLayer);

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
    const newTransform = { ...selectedLayer.transform };
    newTransform[type][axis] = value;
    projectStore.updateLayer(selectedLayer.id, { transform: newTransform });
  }

  function updateStyle(property: string, value: any) {
    if (!selectedLayer) return;
    const newStyle = { ...selectedLayer.style, [property]: value };
    projectStore.updateLayer(selectedLayer.id, { style: newStyle });
  }

  function updateTextData(property: string, value: any) {
    if (!selectedLayer || !selectedLayer.textData) return;
    const newTextData = { ...selectedLayer.textData, [property]: value };
    projectStore.updateLayer(selectedLayer.id, { textData: newTextData });
  }

  function addKeyframe(property: AnimatableProperty) {
    if (!selectedLayer) return;

    let currentValue: number | string = 0;

    // Get current value based on property
    if (property.startsWith('position.')) {
      const axis = property.split('.')[1] as 'x' | 'y' | 'z';
      currentValue = selectedLayer.transform.position[axis];
    } else if (property.startsWith('rotation.')) {
      const axis = property.split('.')[1] as 'x' | 'y' | 'z';
      currentValue = selectedLayer.transform.rotation[axis];
    } else if (property.startsWith('scale.')) {
      const axis = property.split('.')[1] as 'x' | 'y' | 'z';
      currentValue = selectedLayer.transform.scale[axis];
    } else if (property === 'opacity') {
      currentValue = selectedLayer.style.opacity;
    } else if (property === 'color') {
      currentValue = selectedLayer.style.color;
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
                  value={selectedLayer.transform.position.x}
                  oninput={(e) =>
                    updateTransform('x', 'position', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="pos-y" class="text-xs">Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={selectedLayer.transform.position.y}
                  oninput={(e) =>
                    updateTransform('y', 'position', parseFloat(e.currentTarget.value) || 0)}
                />
              </div>
              <div>
                <Label for="pos-z" class="text-xs">Z</Label>
                <Input
                  id="pos-z"
                  type="number"
                  value={selectedLayer.transform.position.z}
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
                  value={selectedLayer.transform.scale.x}
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
                  value={selectedLayer.transform.scale.y}
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
                  value={selectedLayer.transform.scale.z}
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
                  value={selectedLayer.transform.rotation.x}
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
                  value={selectedLayer.transform.rotation.y}
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
                  value={selectedLayer.transform.rotation.z}
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
              value={selectedLayer.style.opacity}
              oninput={(e) => updateStyle('opacity', parseFloat(e.currentTarget.value) || 0)}
            />
          </div>

          <div class="space-y-2">
            <Label for="color" class="text-xs">Color</Label>
            <Input
              id="color"
              type="color"
              value={selectedLayer.style.color}
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
            <div class="text-xs text-muted-foreground">
              {selectedLayer.keyframes.length} keyframe(s)
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

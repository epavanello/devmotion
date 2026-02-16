<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
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
    Link,
    Unlink
  } from '@lucide/svelte';
  import type { AnchorPoint, AnimatableProperty, Transform } from '$lib/schemas/animation';
  import ScrubXyz from '../../scrub-xyz.svelte';
  import ScrubInput from '../../scrub-input.svelte';
  import InputsWrapper from '../../inputs-wrapper.svelte';
  import InputWrapper from '../../input-wrapper.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { PropertyGroupProps } from './types';

  const { layer, currentValues, updateProperty, addKeyframe }: PropertyGroupProps = $props();

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

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
    const option = anchorOptions.find((opt) => opt.value === layer.transform.anchor);
    return option?.label || 'Center';
  });

  function updateAnchor(anchor: AnchorPoint) {
    const newTransform: Transform = { ...layer.transform, anchor };
    projectStore.updateLayer(layer.id, { transform: newTransform });
  }

  const scaleLocked = $derived(layer.props._scaleLocked ?? false);
  const currentScaleX = $derived(currentValues?.transform.scale.x ?? 1);
  const currentScaleY = $derived(currentValues?.transform.scale.y ?? 1);
</script>

<!-- Position -->
<InputsWrapper
  fields={[
    { prop: 'position.x' as AnimatableProperty, label: 'X', id: 'transform.position.x' },
    { prop: 'position.y' as AnimatableProperty, label: 'Y', id: 'transform.position.y' },
    { prop: 'position.z' as AnimatableProperty, label: 'Z', id: 'transform.position.z' }
  ].map((f) => ({
    for: f.id,
    labels: f.label,
    property: f.prop,
    addKeyframe: addKeyframe,
    hasKeyframes: layer.keyframes.some((k) => k.property === f.prop)
  }))}
>
  {#snippet prefix()}
    <Label class="text-xs text-muted-foreground">Position</Label>
    <ScrubXyz
      valueX={currentValues?.transform.position.x ?? 0}
      valueY={currentValues?.transform.position.y ?? 0}
      valueZ={currentValues?.transform.position.z ?? 0}
      stepXY={1}
      stepZ={1}
      onchangeX={(v: number) => updateProperty('position.x', v, 'transform')}
      onchangeY={(v: number) => updateProperty('position.y', v, 'transform')}
      onchangeZ={(v: number) => updateProperty('position.z', v, 'transform')}
    />
  {/snippet}

  <ScrubInput
    id="transform.position.x"
    value={currentValues?.transform.position.x ?? 0}
    onchange={(v) => updateProperty('position.x', v, 'transform')}
  />

  <ScrubInput
    id="transform.position.y"
    value={currentValues?.transform.position.y ?? 0}
    onchange={(v) => updateProperty('position.y', v, 'transform')}
  />
  <ScrubInput
    id="transform.position.z"
    value={currentValues?.transform.position.z ?? 0}
    onchange={(v) => updateProperty('position.z', v, 'transform')}
  />
</InputsWrapper>

<!-- Rotation -->
<InputsWrapper
  fields={[
    { prop: 'rotation.x' as AnimatableProperty, label: 'X', id: 'transform.rotation.x' },
    { prop: 'rotation.y' as AnimatableProperty, label: 'Y', id: 'transform.rotation.y' },
    { prop: 'rotation.z' as AnimatableProperty, label: 'Z', id: 'transform.rotation.z' }
  ].map((f) => ({
    for: f.id,
    labels: f.label,
    property: f.prop,
    addKeyframe: addKeyframe,
    hasKeyframes: layer.keyframes.some((k) => k.property === f.prop)
  }))}
>
  {#snippet prefix()}
    <Label class="text-xs text-muted-foreground">Rotation</Label>
    <ScrubXyz
      valueX={currentValues?.transform.rotation.y ?? 0}
      valueY={currentValues?.transform.rotation.x ?? 0}
      valueZ={currentValues?.transform.rotation.z ?? 0}
      stepXY={0.1}
      stepZ={0.1}
      invertY={true}
      onchangeX={(v: number) => updateProperty('rotation.y', v, 'transform')}
      onchangeY={(v: number) => updateProperty('rotation.x', v, 'transform')}
      onchangeZ={(v: number) => updateProperty('rotation.z', v, 'transform')}
    />
  {/snippet}
  <ScrubInput
    id="transform.rotation.x"
    value={currentValues?.transform.rotation.x ?? 0}
    step={0.1}
    onchange={(v) => updateProperty('rotation.x', v, 'transform')}
  />
  <ScrubInput
    id="transform.rotation.y"
    value={currentValues?.transform.rotation.y ?? 0}
    step={0.1}
    onchange={(v) => updateProperty('rotation.y', v, 'transform')}
  />
  <ScrubInput
    id="transform.rotation.z"
    value={currentValues?.transform.rotation.z ?? 0}
    step={0.1}
    onchange={(v) => updateProperty('rotation.z', v, 'transform')}
  />
</InputsWrapper>

<!-- Scale -->
<InputsWrapper
  fields={[
    { prop: 'scale.x' as AnimatableProperty, label: 'X', id: 'transform.scale.x' },
    { prop: 'scale.y' as AnimatableProperty, label: 'Y', id: 'transform.scale.y' }
  ].map((f) => ({
    for: f.id,
    labels: f.label,
    property: f.prop,
    addKeyframe: addKeyframe,
    hasKeyframes: layer.keyframes.some((k) => k.property === f.prop)
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
      onchangeX={(v: number) => updateProperty('scale.x', v || 1, 'transform')}
      onchangeY={(v: number) => updateProperty('scale.y', v || 1, 'transform')}
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
          ...layer.props,
          _scaleLocked: newLocked,
          _scaleRatio: ratio
        };
        projectStore.updateLayer(layer.id, { props: newProps });
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
    id="transform.scale.x"
    value={currentScaleX}
    step={0.1}
    onchange={(v) => updateProperty('scale.x', v || 1, 'transform')}
  />
  <ScrubInput
    id="transform.scale.y"
    value={currentScaleY}
    step={0.1}
    onchange={(v) => updateProperty('scale.y', v || 1, 'transform')}
  />
</InputsWrapper>

<!-- Anchor Point -->
<InputWrapper for="anchor-point" label="Anchor Point">
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
          {@const isSelected = layer.transform.anchor === option.value}
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

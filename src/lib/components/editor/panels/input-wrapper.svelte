<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import type { Snippet } from 'svelte';
  import InputPin from './input-pin.svelte';

  const {
    id,
    label,
    children,
    property,
    addKeyframe
  }: {
    id: string;
    label: string;
    children: Snippet;
  } & (
    | {
        property?: never;
        addKeyframe?: never;
      }
    | {
        property: string;
        addKeyframe: (property: AnimatableProperty) => void;
      }
  ) = $props();

  const selectedLayer = $derived(projectStore.selectedLayer);
  const hasKeyframes = $derived(selectedLayer?.keyframes.some((k) => k.property === property));
</script>

<div>
  <div class="mb-1 flex items-center justify-between">
    <Label for={id} class="text-xs">{label}</Label>
    {#if property}
      <InputPin {property} active={!!hasKeyframes} {label} {addKeyframe} />
    {/if}
  </div>

  {@render children()}
</div>

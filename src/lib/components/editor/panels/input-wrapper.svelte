<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { Snippet } from 'svelte';
  import InputPin from './input-pin.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

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

  function removeKeyframes(property: string) {
    if (selectedLayer) {
      projectStore.removeKeyframesByProperty(selectedLayer.id, property);
    }
  }
</script>

<div class="flex flex-col gap-1">
  <div class="flex items-center gap-0.5">
    {#if property}
      <InputPin {property} active={!!hasKeyframes} {label} {addKeyframe} {removeKeyframes} />
    {/if}
    <Label for={id} class="text-[10px] text-muted-foreground">{label}</Label>
  </div>

  {@render children()}
</div>

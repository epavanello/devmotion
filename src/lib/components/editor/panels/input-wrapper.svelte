<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import type { Snippet } from 'svelte';
  import InputPin from './input-pin.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const {
    for: htmlFor,
    label,
    labelExtra,
    children,
    property,
    addKeyframe
  }: {
    for: string;
    label: string;
    labelExtra?: Snippet;
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
    <Label for={htmlFor} class="flex-1 text-[10px] text-muted-foreground">{label}</Label>
    {#if labelExtra}
      {@render labelExtra()}
    {/if}
  </div>

  {@render children()}
</div>

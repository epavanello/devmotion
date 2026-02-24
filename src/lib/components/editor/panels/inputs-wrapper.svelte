<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { getEditorState } from '$lib/contexts/editor.svelte';

  import type { Snippet } from 'svelte';
  import InputPin from './input-pin.svelte';
  import * as ButtonGroup from '$lib/components/ui/button-group';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const {
    fields,
    children,
    prefix
  }: {
    fields: ({
      for: string;
      labels: string;
      postFix?: string | Snippet;
    } & (
      | {
          property?: never;
          addKeyframe?: never;
        }
      | {
          property: string;
          addKeyframe: (property: AnimatableProperty) => void;
          hasKeyframes: boolean;
        }
    ))[];

    children: Snippet;
    prefix?: Snippet;
  } = $props();

  const selectedLayer = $derived(projectStore.selectedLayer);

  function removeKeyframes(property: string) {
    if (selectedLayer) {
      projectStore.removeKeyframesByProperty(selectedLayer.id, property);
    }
  }

  const hasPostFix = $derived(fields.some((f) => f.postFix));
</script>

<div class="flex flex-col gap-1">
  {#if prefix}
    <div class="flex flex-row gap-0.5">
      {@render prefix()}
    </div>
  {/if}

  <div class="flex gap-1">
    {#each fields as field (field.for)}
      <div class="flex flex-1 items-center gap-0.5">
        {#if field.property}
          <InputPin
            property={field.property}
            active={field.hasKeyframes}
            label={field.labels}
            addKeyframe={field.addKeyframe}
            {removeKeyframes}
          />
        {/if}
        <Label for={field.for} class="text-[10px] text-muted-foreground">{field.labels}</Label>
      </div>
    {/each}
  </div>

  <ButtonGroup.Root class="w-full">
    {@render children()}
  </ButtonGroup.Root>
</div>
{#if hasPostFix}
  <div class="flex gap-1">
    {#each fields as field (field.for)}
      <div class="flex flex-1 items-center gap-0.5">
        {#if typeof field.postFix === 'string'}
          <span class="text-[10px] text-muted-foreground">{field.postFix}</span>
        {/if}
        {#if typeof field.postFix === 'function'}
          {@render field.postFix()}
        {/if}
      </div>
    {/each}
  </div>
{/if}

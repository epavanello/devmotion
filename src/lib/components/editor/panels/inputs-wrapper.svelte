<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import type { Snippet } from 'svelte';
  import InputPin from './input-pin.svelte';
  import * as ButtonGroup from '$lib/components/ui/button-group';

  const {
    fields,
    children,
    prefix
  }: {
    fields: ({
      id: string;
      labels: string;
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
</script>

<div class="space-y-1">
  {#if prefix}
    <div class="flex gap-1">
      {@render prefix()}
    </div>
  {/if}

  <div class="flex gap-1">
    {#each fields as field (field.id)}
      <div class="flex flex-1 items-center gap-1">
        <span class="ml-1 text-[10px] text-muted-foreground">{field.labels}</span>
        {#if field.property}
          <InputPin
            property={field.property}
            active={field.hasKeyframes}
            label={field.labels}
            addKeyframe={field.addKeyframe}
          />
        {/if}
      </div>
    {/each}
  </div>

  <ButtonGroup.Root>
    {@render children()}
  </ButtonGroup.Root>
</div>

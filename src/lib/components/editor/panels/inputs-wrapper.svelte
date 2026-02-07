<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  
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

<div class="flex flex-col gap-1">
  {#if prefix}
    <div class="flex flex-row gap-0.5">
      {@render prefix()}
    </div>
  {/if}

  <div class="flex gap-1">
    {#each fields as field (field.id)}
      <div class="flex flex-1 items-center gap-0.5">
        {#if field.property}
          <InputPin
            property={field.property}
            active={field.hasKeyframes}
            label={field.labels}
            addKeyframe={field.addKeyframe}
          />
        {/if}
        <Label for={field.id} class="text-[10px] text-muted-foreground">{field.labels}</Label>
      </div>
    {/each}
  </div>

  <ButtonGroup.Root>
    {@render children()}
  </ButtonGroup.Root>
</div>

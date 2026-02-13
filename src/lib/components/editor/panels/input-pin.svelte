<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { Pin } from '@lucide/svelte';
  import * as Popover from '$lib/components/ui/popover';

  const {
    property,
    active,
    label,
    addKeyframe,
    removeKeyframes
  }: {
    property: string;
    active: boolean;
    label: string;
    addKeyframe: (property: AnimatableProperty) => void;
    removeKeyframes?: (property: string) => void;
  } = $props();

  function handleRemoveKeyframes() {
    if (removeKeyframes) {
      removeKeyframes(property);
    }
  }
</script>

{#if active && removeKeyframes}
  <Popover.Root>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          variant="ghost"
          size="sm"
          class="h-5 w-5 p-0"
          {...props}
          title={`Remove all keyframes for ${label}`}
        >
          <Pin class="size-2.5" fill="currentColor" />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-64" align="end" side="left">
      <div class="space-y-2">
        <h4 class="leading-none font-medium">Remove Keyframes</h4>
        <p class="text-sm text-muted-foreground">
          Remove all keyframes for {label}? This cannot be undone.
        </p>
        <div class="flex justify-end gap-2 pt-2">
          <Popover.Close>
            {#snippet child({ props })}
              <Button variant="outline" size="sm" {...props}>Cancel</Button>
            {/snippet}
          </Popover.Close>
          <Popover.Close>
            {#snippet child({ props })}
              <Button variant="destructive" size="sm" {...props} onclick={handleRemoveKeyframes}>
                Remove
              </Button>
            {/snippet}
          </Popover.Close>
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
{:else}
  <Button
    variant="ghost"
    size="sm"
    class="h-5 w-5 p-0"
    onclick={() => addKeyframe(property)}
    title={`Add keyframe for ${label}`}
  >
    <Pin class="size-2.5" fill={active ? 'currentColor' : 'none'} />
  </Button>
{/if}

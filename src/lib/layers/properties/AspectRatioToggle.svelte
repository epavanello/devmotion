<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Link, Unlink } from '@lucide/svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  let {
    layer,
    currentValues,
    onUpdate
  }: {
    layer: TypedLayer;
    groupId: string;
    currentValues: Record<string, unknown>;
    onUpdate: (propertyName: string, value: unknown) => void;
  } = $props();

  let aspectRatioLocked = $derived(!!layer.props._aspectRatioLocked);

  function toggleAspectRatio() {
    const newLocked = !aspectRatioLocked;
    aspectRatioLocked = newLocked;

    onUpdate('_aspectRatioLocked', newLocked);

    if (newLocked && (currentValues.height as number) !== 0) {
      const ratio = (currentValues.width as number) / (currentValues.height as number);
      onUpdate('_aspectRatio', ratio);
    }
  }
</script>

<div class="ml-auto">
  <Button
    variant="ghost"
    size="sm"
    onclick={toggleAspectRatio}
    class="h-6 px-2 text-xs"
    title={aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
  >
    {#if aspectRatioLocked}
      <Link class="size-3" />
    {:else}
      <Unlink class="size-3" />
    {/if}
  </Button>
</div>

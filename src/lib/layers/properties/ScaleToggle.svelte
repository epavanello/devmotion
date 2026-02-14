<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Link, Unlink } from '@lucide/svelte';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  let {
    layer,
    currentScaleX,
    currentScaleY,
    onUpdate
  }: {
    layer: TypedLayer;
    currentScaleX: number;
    currentScaleY: number;
    onUpdate: (propertyName: string, value: unknown) => void;
  } = $props();

  let scaleLocked = $derived(!!layer.props._scaleLocked);

  function toggleScaleLock() {
    const newLocked = !scaleLocked;
    onUpdate('_scaleLocked', newLocked);

    // Store the initial ratio when locking
    if (newLocked && currentScaleY !== 0) {
      const ratio = currentScaleX / currentScaleY;
      onUpdate('_scaleRatio', ratio);
    }
  }
</script>

<div class="ml-auto">
  <Button
    variant="ghost"
    size="sm"
    onclick={toggleScaleLock}
    class="h-6 px-2 text-xs"
    title={scaleLocked ? 'Unlock proportions' : 'Lock proportions'}
  >
    {#if scaleLocked}
      <Link class="size-3" />
    {:else}
      <Unlink class="size-3" />
    {/if}
  </Button>
</div>

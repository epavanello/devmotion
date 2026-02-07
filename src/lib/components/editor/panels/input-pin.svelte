<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { Pin } from '@lucide/svelte';

  const {
    property,
    active,
    label,
    addKeyframe
  }: {
    property: string;
    active: boolean;
    label: string;
    addKeyframe: (property: AnimatableProperty) => void;
  } = $props();
</script>

<Button
  variant="ghost"
  size="sm"
  class="h-5 w-5 p-0"
  onclick={() => addKeyframe(property)}
  title={`Add keyframe for ${label}`}
>
  <Pin class="size-2.5" fill={active ? 'currentColor' : 'none'} />
</Button>

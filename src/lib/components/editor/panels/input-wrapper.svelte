<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import type { AnimatableProperty } from '$lib/schemas/animation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Pin } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  const {
    id,
    property,
    label,
    addKeyframe,
    children
  }: {
    id: string;
    property: string;
    label: string;
    children: Snippet;
    addKeyframe: (property: AnimatableProperty) => void;
  } = $props();

  const selectedLayer = $derived(projectStore.selectedLayer);
  const hasKeyframes = $derived(selectedLayer?.keyframes.some((k) => k.property === property));
</script>

<div>
  <div class="mb-1 flex items-center justify-between">
    <Label for={id} class="text-xs">{label}</Label>
    <Button
      variant="ghost"
      size="sm"
      class="h-5 w-5 p-0"
      onclick={() => addKeyframe(property)}
      title="Add keyframe for {label}"
    >
      <Pin class="size-3" fill={hasKeyframes ? 'currentColor' : 'none'} />
    </Button>
  </div>
  {@render children()}
</div>

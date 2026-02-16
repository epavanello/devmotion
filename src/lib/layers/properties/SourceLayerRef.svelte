<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Link } from '@lucide/svelte';
  import type { CustomPropertyComponentProps } from './field-registry';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const { value }: CustomPropertyComponentProps = $props();

  const sourceLayerId = $derived(value as string);

  const sourceLayer = $derived.by(() => {
    if (!sourceLayerId) return null;
    return projectStore.state.layers.find((l) => l.id === sourceLayerId);
  });

  function handleActivateSource() {
    if (sourceLayerId) {
      projectStore.selectedLayerId = sourceLayerId;
    }
  }
</script>

{#if sourceLayer}
  <Button variant="outline" size="sm" class="w-full text-xs" onclick={handleActivateSource}>
    <Link class="mr-1 size-3" />
    Source: {sourceLayer.name}
  </Button>
{:else if sourceLayerId}
  <p class="text-xs text-muted-foreground">Source layer not found</p>
{:else}
  <p class="text-xs text-muted-foreground">No source layer assigned</p>
{/if}

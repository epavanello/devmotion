<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { initializeEditorContext } from '$lib/contexts/editor.svelte';

  // Initialize the editor context with localStorage persistence
  const editor = initializeEditorContext();

  beforeNavigate(({ cancel }) => {
    if (editor.hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        cancel();
      }
    }
  });

  let { children } = $props();
</script>

<div class="h-screen w-full">
  {@render children?.()}
</div>

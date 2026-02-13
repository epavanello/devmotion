<script lang="ts">
  import { initializeEditorContext } from '$lib/contexts/editor.svelte';

  // Initialize the editor context with localStorage persistence
  initializeEditorContext();

  let { children } = $props();
</script>

<div class="h-screen w-full">
  {@render children?.()}
</div>

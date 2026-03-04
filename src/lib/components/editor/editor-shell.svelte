<script lang="ts">
  import Toolbar from './toolbar.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex h-screen w-full flex-col bg-background">
  <!-- Toolbar -->
  <Toolbar />
  {@render children()}
</div>

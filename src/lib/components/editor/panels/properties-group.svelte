<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import type { Snippet } from 'svelte';

  const { label, children }: { label: string | Snippet; children: Snippet } = $props();
</script>

<div class="space-y-3">
  {#if typeof label === 'string'}
    <Label class="font-semibold">{label}</Label>
  {:else}
    {@render label()}
  {/if}
  {@render children()}
</div>

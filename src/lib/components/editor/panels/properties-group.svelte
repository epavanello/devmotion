<script lang="ts">
  import Label from '$lib/components/ui/label/label.svelte';
  import { ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    label,
    children,
    defaultOpen = false
  }: { label: string | Snippet; children: Snippet; defaultOpen?: boolean } = $props();

  let isOpen = $derived(defaultOpen);
</script>

<div class="space-y-3">
  <button
    type="button"
    class="flex w-full items-center gap-1.5 text-left transition-colors hover:text-foreground"
    onclick={() => (isOpen = !isOpen)}
  >
    <ChevronRight
      class="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
      style="transform: rotate({isOpen ? 90 : 0}deg)"
    />
    {#if typeof label === 'string'}
      <Label class="pointer-events-none cursor-pointer font-semibold">{label}</Label>
    {:else}
      {@render label()}
    {/if}
  </button>

  {#if isOpen}
    <div class="space-y-3">
      {@render children()}
    </div>
  {/if}
</div>

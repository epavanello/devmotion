<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import type { Component, Snippet } from 'svelte';

  interface Props {
    title: string;
    actionsComponent?: Component;
    actionsSnippet?: Snippet;
    content: Snippet;
    headerExtra?: Snippet;
    disableScroll?: boolean;
  }

  let { title, actionsComponent, actionsSnippet, content, headerExtra, disableScroll = false }: Props = $props();

  const mediaQuery = new MediaQuery('max-width: 768px');
  const isMobile = $derived(mediaQuery.current);
</script>

{#if isMobile}
  <!-- Mobile: solo contenuto (header gestito da Collapsible) -->
  {#if disableScroll}
    <div class="bg-background">
      {@render content()}
    </div>
  {:else}
    <ScrollArea>
      <div class="bg-background">
        {@render content()}
      </div>
    </ScrollArea>
  {/if}
{:else}
  <!-- Desktop: header + contenuto scrollable -->
  <div class="flex h-full flex-col bg-background">
    <!-- Panel Header -->
    <div class="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold">{title}</h2>
        {#if headerExtra}
          {@render headerExtra()}
        {/if}
      </div>
      {#if actionsComponent}
        {@const Actions = actionsComponent}
        <Actions />
      {:else if actionsSnippet}
        {@render actionsSnippet()}
      {/if}
    </div>

    <!-- Panel Content -->
    {#if disableScroll}
      <div class="flex-1 overflow-hidden">
        {@render content()}
      </div>
    {:else}
      <ScrollArea class="flex-1">
        {@render content()}
      </ScrollArea>
    {/if}
  </div>
{/if}

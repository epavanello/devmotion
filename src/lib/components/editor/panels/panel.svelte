<script lang="ts">
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import type { Component, Snippet } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  interface Props {
    title: string;
    icon?: Component;
    actionsComponent?: Component;
    actionsSnippet?: Snippet;
    content: Snippet;
    headerExtra?: Snippet;
    disableScroll?: boolean;
    collapsible?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    topOffset?: string;
    zIndex?: number;
    scrollRef?: HTMLElement | null;
  }

  let {
    title,
    icon,
    actionsComponent,
    actionsSnippet,
    content,
    headerExtra,
    disableScroll = false,
    collapsible = false,
    isOpen = false,
    onToggle,
    topOffset = '0',
    zIndex = 0,
    scrollRef = $bindable(null)
  }: Props = $props();
</script>

{#if collapsible}
  <!-- Mobile: collapsible sticky panel -->
  <div class="sticky bg-background" style="top: {topOffset}; z-index: {zIndex};">
    <button
      onclick={onToggle}
      class="flex w-full items-center justify-between border-t border-b bg-muted/80 p-4 font-medium backdrop-blur-sm transition-colors hover:bg-muted"
    >
      <div class="flex items-center gap-2">
        {#if icon}
          {@const Icon = icon}
          <Icon class="size-4" />
        {/if}
        {title}
        {#if actionsComponent}
          {@const Actions = actionsComponent}
          <Actions />
        {:else if actionsSnippet}
          {@render actionsSnippet()}
        {/if}
      </div>
      <ChevronDown
        class={cn('size-4 transition-transform duration-200', {
          'rotate-180': isOpen
        })}
      />
    </button>

    {#if isOpen}
      <div
        class="overflow-y-auto border-b bg-background"
        style="max-height: calc(60vh - 60px - 52px);"
      >
        {@render content()}
      </div>
    {/if}
  </div>
{:else}
  <!-- Desktop: standard panel with header -->
  <div class="flex h-full flex-col bg-background">
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

    {#if disableScroll}
      <div class="flex-1 overflow-hidden" bind:this={scrollRef}>
        {@render content()}
      </div>
    {:else}
      <ScrollArea class="flex-1" bind:ref={scrollRef}>
        {@render content()}
      </ScrollArea>
    {/if}
  </div>
{/if}

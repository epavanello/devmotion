<script lang="ts">
  import { Sun, Moon } from '@lucide/svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import TooltipButton from './tooltip/tooltip-button.svelte';
  import { browser } from '$app/environment';
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'ghost' | 'outline' | 'default';
    children?: Snippet;
  }

  let { variant = 'ghost', children }: Props = $props();

  const icon = $derived(themeStore.resolvedTheme === 'dark' ? Sun : Moon);
</script>

{#if browser}
  <TooltipButton
    content={themeStore.resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    {variant}
    onclick={() => themeStore.toggle()}
    {icon}
  >
    {@render children?.()}
  </TooltipButton>
{/if}

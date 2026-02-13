<script lang="ts">
  import '../app.css';
  import { asset } from '$app/paths';
  import { Toaster } from 'svelte-sonner';
  import { uiStore } from '$lib/stores/ui.svelte';
  import LoginPromptDialog from '$lib/components/editor/login-prompt-dialog.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    // Initialize theme from store (triggers system preference detection)
    themeStore.applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeStore.theme === 'system') {
        themeStore.applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  });
</script>

<svelte:head>
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="icon" href={asset('/favicon.svg')} type="image/svg+xml" />
  <link rel="apple-touch-icon" href={asset('/favicon.svg')} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://www.google-analytics.com" />
  <link rel="sitemap" href="/sitemap.xml" />
</svelte:head>

<Toaster richColors position="top-right" />
<LoginPromptDialog bind:open={uiStore.showLoginPrompt} action={uiStore.promptAction} />
{@render children?.()}

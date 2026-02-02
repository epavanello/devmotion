<script lang="ts">
  import '../app.css';
  import { asset } from '$app/paths';
  import { Toaster } from 'svelte-sonner';

  let { children } = $props();
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
{@render children?.()}

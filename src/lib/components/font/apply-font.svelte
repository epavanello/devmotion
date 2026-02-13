<script lang="ts">
  import { getGoogleFontUrl, type GoogleFont } from '$lib/utils/fonts';
  import type { Snippet } from 'svelte';

  let { fontFamily, children }: { fontFamily?: GoogleFont; children: Snippet } = $props();

  const fontUrl = $derived(fontFamily && getGoogleFontUrl(fontFamily));
</script>

<svelte:head>
  {#if fontFamily}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href={fontUrl} />
  {/if}
</svelte:head>

<div
  class="font-wrapper"
  style:--font-family={fontFamily ? `'${fontFamily}', sans-serif` : 'inherit'}
>
  {@render children()}
</div>

<style>
  .font-wrapper {
    font-family: var(--font-family);
    display: contents;
  }
</style>

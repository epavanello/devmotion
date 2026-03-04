<script lang="ts">
  import { getGoogleFontUrl, checkFontLoaded, type GoogleFont } from '$lib/utils/fonts';
  import type { Snippet } from 'svelte';

  let {
    fontFamily,
    children,
    onError
  }: {
    fontFamily?: GoogleFont;
    children: Snippet;
    onError?: (font: GoogleFont, error: string) => void;
  } = $props();

  const fontUrl = $derived(fontFamily && getGoogleFontUrl(fontFamily));
  let fontLoadFailed = $state(false);
  let isChecking = $state(false);

  // Verify font loaded successfully
  $effect(() => {
    if (!fontFamily) {
      fontLoadFailed = false;
      return;
    }

    isChecking = true;
    fontLoadFailed = false;

    // Check after a delay to allow font to load
    const timeoutId = setTimeout(async () => {
      const loaded = await checkFontLoaded(fontFamily);

      if (!loaded) {
        fontLoadFailed = true;
        console.warn(`[ApplyFont] Failed to load font: ${fontFamily}`);
        onError?.(fontFamily, 'Font failed to load from Google Fonts');
      }

      isChecking = false;
    }, 1500);

    return () => clearTimeout(timeoutId);
  });
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
  class:font-load-failed={fontLoadFailed}
  class:font-checking={isChecking}
  style:--font-family={fontFamily ? `'${fontFamily}', sans-serif` : 'inherit'}
  data-font={fontFamily || undefined}
>
  {@render children()}
</div>

<style>
  .font-wrapper {
    font-family: var(--font-family);
    display: contents;
  }

  /* Fallback to system font if load fails */
  .font-load-failed {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
</style>

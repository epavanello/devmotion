<script lang="ts">
  import { page } from '$app/state';

  let {
    title = 'DevMotion - AI Motion Design',
    description = 'AI-Powered Motion Design Editor. Create professional animations with manual controls and AI generation.',
    image = '/og.png',
    type = 'website',
    keywords = ''
  } = $props();

  let absoluteImage = $derived(image.startsWith('http') ? image : `${page.url.origin}${image}`);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  {#if keywords}
    <meta name="keywords" content={keywords} />
  {/if}

  <!-- Open Graph -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:image" content={absoluteImage} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={absoluteImage} />
</svelte:head>

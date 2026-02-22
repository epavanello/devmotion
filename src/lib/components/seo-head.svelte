<script lang="ts">
  import { page } from '$app/state';

  let {
    title = 'DevMotion - Motion Graphics, Reinvented for the Web',
    description = 'Professional motion graphics editor in your browser. AI-powered timeline, keyframe animation, and layer system. Like After Effects, but web-native and free.',
    image = '/og.png',
    type = 'website',
    keywords = '',
    canonical = '',
    imageWidth = '1200',
    imageHeight = '630',
    siteName = 'DevMotion',
    locale = 'en_US',
    author = '',
    publishedTime = '',
    modifiedTime = ''
  } = $props();

  let absoluteImage = $derived(image.startsWith('http') ? image : `${page.url.origin}${image}`);
  let canonicalUrl = $derived.by(() => {
    // If explicit canonical provided, use it
    if (canonical) {
      return canonical;
    }
    // For homepage, use origin only
    if (page.url.pathname === '/') {
      return page.url.origin;
    }
    // For all other pages, use origin + pathname (no query params or hash)
    return `${page.url.origin}${page.url.pathname}`;
  });
</script>

<svelte:head>
  <!-- Primary Meta Tags -->
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />
  {#if keywords}
    <meta name="keywords" content={keywords} />
  {/if}
  {#if author}
    <meta name="author" content={author} />
  {/if}

  <!-- Canonical URL -->
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={absoluteImage} />
  <meta property="og:image:width" content={imageWidth} />
  <meta property="og:image:height" content={imageHeight} />
  <meta property="og:site_name" content={siteName} />
  <meta property="og:locale" content={locale} />
  {#if publishedTime}
    <meta property="article:published_time" content={publishedTime} />
  {/if}
  {#if modifiedTime}
    <meta property="article:modified_time" content={modifiedTime} />
  {/if}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={page.url.href} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={absoluteImage} />

  <!-- Additional SEO -->
  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  />
  <meta name="googlebot" content="index, follow" />
</svelte:head>

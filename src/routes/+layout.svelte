<script lang="ts">
  import '../app.css';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import { asset } from '$app/paths';
  import JsonLd from '$lib/components/json-ld.svelte';

  // SEO Configuration for DevMotion
  const baseUrl = PUBLIC_BASE_URL;
  const title = 'DevMotion - Create Amazing Animated Videos Free';
  const description =
    'Create stunning animated videos with DevMotion. Design with manual controls or use AI-powered suggestions. Export your videos for free. Perfect for creators, marketers, and animators.';
  const keywords =
    'animation editor, video creator, ai animation, video export, motion graphics, animation software, free video editor, animated video maker';
  const twitterHandle = '@emadev01';

  let { children } = $props();
</script>

<svelte:head>
  <!-- Essential Meta Tags -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  <meta name="theme-color" content="#000000" />
  <meta name="msapplication-TileColor" content="#000000" />

  <!-- Open Graph Meta Tags (Social Media) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={baseUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={`${baseUrl}/og-image.png`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="DevMotion" />

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={baseUrl} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={`${baseUrl}/twitter-image.png`} />
  <meta name="twitter:creator" content={twitterHandle} />

  <!-- Canonical URL -->
  <link rel="canonical" href={baseUrl} />

  <!-- Search Engine -->
  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  />
  <meta name="googlebot" content="index, follow" />

  <!-- Favicon -->
  <link rel="icon" href={asset('/favicon.svg')} type="image/svg+xml" />
  <link rel="apple-touch-icon" href={asset('/favicon.svg')} />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Preconnect to External Resources -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://www.google-analytics.com" />

  <!-- Sitemap & RSS -->
  <link rel="sitemap" href="/sitemap.xml" />

  <!-- Alternative Titles for Dynamic Pages -->
  <title>{title}</title>
</svelte:head>

<!-- Structured Data (JSON-LD) -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DevMotion',
    description,
    url: baseUrl,
    applicationCategory: 'MultimediaApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1200'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    operatingSystem: 'Web',
    // screenshot: `${baseUrl}/screenshot.png`,
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'DevMotion'
    }
  }}
/>

{@render children?.()}

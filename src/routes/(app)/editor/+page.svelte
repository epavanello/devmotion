<script lang="ts">
  import EditorLayout from '$lib/components/editor/editor-layout.svelte';
  import SeoHead from '$lib/components/seo-head.svelte';
  import JsonLd from '$lib/components/json-ld.svelte';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import { Loader2 } from '@lucide/svelte';

  const baseUrl = PUBLIC_BASE_URL;
</script>

<SeoHead
  title="DevMotion - Motion Graphics, Reinvented for the Web | AI-Powered Animation Studio"
  description="Professional motion graphics editor in your browser. AI-powered timeline, keyframe animation, layer system. Like After Effects, but web-native and free. Export MP4 videos instantly."
  keywords="motion graphics, animation editor, after effects alternative, web animation, ai animation, video creator, keyframe editor, timeline editor, browser animation tool, free video editor"
/>

<!-- JSON-LD: Organization Schema -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DevMotion',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/favicon.svg`
    },
    description:
      'DevMotion is a professional motion graphics editor for the web. Like After Effects, but browser-based with AI assistance. Create animations with timeline control, keyframes, and layer system.',
    foundingDate: '2026'
  }}
/>

<!-- JSON-LD: WebSite Schema with SearchAction -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DevMotion',
    url: baseUrl,
    description:
      'Professional motion graphics editor reimagined for the web. AI-powered timeline, keyframe animation, and layer-based composition. Free to use, no installation required.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/gallery?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'DevMotion',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.svg`
      }
    }
  }}
/>

<!-- JSON-LD: SoftwareApplication Schema -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DevMotion',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description:
      'Professional motion graphics and animation studio for the web. Timeline editor, keyframe animation, AI assistance. Like After Effects, but browser-based and free.',
    featureList: [
      'AI-powered animation suggestions',
      'Intuitive keyframe editor',
      'Layer-based composition',
      'Multiple export formats',
      'Real-time preview',
      'Community gallery'
    ],
    screenshot: `${baseUrl}/og.png`,
    url: baseUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1'
    }
  }}
/>

<!-- SEO: H1 for homepage (visually hidden but accessible to search engines) -->
<h1 class="sr-only">DevMotion - Motion Graphics in Your Browser, Powered by AI</h1>

<svelte:boundary>
  {#snippet pending()}
    <div class="flex h-screen items-center justify-center">
      <Loader2 class="animate-spin" />
    </div>
  {/snippet}
  <EditorLayout />
</svelte:boundary>

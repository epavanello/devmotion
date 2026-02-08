<script lang="ts">
  import EditorLayout from '$lib/components/editor/editor-layout.svelte';
  import SeoHead from '$lib/components/seo-head.svelte';
  import JsonLd from '$lib/components/json-ld.svelte';
  import { PUBLIC_BASE_URL } from '$env/static/public';

  const baseUrl = PUBLIC_BASE_URL;
</script>

<SeoHead
  title="DevMotion - AI-Powered Animation Editor | Create Videos Free"
  description="Create stunning animated videos with DevMotion's AI-powered animation editor. Design with intuitive controls or leverage AI assistance. Export professional videos for free. Perfect for content creators, marketers, and animators."
  keywords="animation editor, video creator, ai animation, video export, motion graphics, animation software, free video editor, animated video maker, ai video generator"
/>

<!-- JSON-LD: Organization Schema -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DevMotion',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description:
      'DevMotion is an AI-powered animation editor that helps creators build stunning animated videos with intuitive controls and intelligent assistance.',
    foundingDate: '2024',
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description: 'Free animation editor with AI-powered features'
    }
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
      'AI-powered animation editor for creating professional animated videos. Free to use with intuitive controls and smart assistance.',
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
      'Create stunning animated videos with AI-powered animation editor. Free online tool for motion graphics, video creation, and animation.',
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

<EditorLayout />

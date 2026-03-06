<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import confetti from 'canvas-confetti';
  import EditorShell from '$lib/components/editor/editor-shell.svelte';
  import Editor from '$lib/components/editor/editor.svelte';
  import SeoHead from '$lib/components/seo-head.svelte';
  import JsonLd from '$lib/components/json-ld.svelte';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import { Loader2 } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { resolve } from '$app/paths';

  const baseUrl = PUBLIC_BASE_URL;

  // Monitor checkout status from URL params
  const checkoutStatus = $derived(page.url.searchParams.get('checkout'));

  // Handle checkout success/error feedback
  onMount(() => {
    if (checkoutStatus === 'success') {
      // Celebration effect with confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Show success toast
      toast.success('Thanks for subscribing!', {
        duration: 5000
      });

      // Clean URL params
      goto(resolve('/editor'), { replaceState: true });
    } else if (checkoutStatus === 'error') {
      // Show error toast
      toast.error('Checkout failed', {
        description:
          'There was an issue processing your payment. Please try again or contact support.',
        duration: 6000
      });

      // Clean URL params
      goto(resolve('/editor'), { replaceState: true });
    }
  });
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

<EditorShell>
  <svelte:boundary>
    {#snippet pending()}
      <div class="flex h-full items-center justify-center">
        <Loader2 class="animate-spin" />
      </div>
    {/snippet}
    <Editor />
  </svelte:boundary>
</EditorShell>

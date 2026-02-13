<script lang="ts">
  import Logo from '$lib/components/editor/Logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ArrowLeft, Github, Sun, Moon } from '@lucide/svelte';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import JsonLd from '$lib/components/json-ld.svelte';
  import SeoHead from '$lib/components/seo-head.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import TooltipButton from '$lib/components/ui/tooltip/tooltip-button.svelte';

  // SEO Configuration for DevMotion
  const baseUrl = PUBLIC_BASE_URL;
  const title = 'DevMotion - Create Amazing Animated Videos Free';
  const description =
    'Create stunning animated videos with DevMotion. Design with manual controls or use AI-powered suggestions. Export your videos for free. Perfect for creators, marketers, and animators.';
  const keywords =
    'animation editor, video creator, ai animation, video export, motion graphics, animation software, free video editor, animated video maker';

  let { children } = $props();
</script>

<SeoHead {title} {description} {keywords} />

<!-- Structured Data (JSON-LD) for Marketing Pages -->
<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DevMotion',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    sameAs: ['https://twitter.com/emadev01'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${baseUrl}`
    }
  }}
/>

<JsonLd
  item={{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DevMotion',
    url: baseUrl,
    description,
    author: {
      '@type': 'Organization',
      name: 'DevMotion'
    }
  }}
/>

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
    screenshot: `${baseUrl}/og.png`,
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'DevMotion'
    }
  }}
/>

<div class="flex min-h-screen flex-col bg-background">
  <header
    class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
  >
    <div class="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-2">
        <Logo />
        <Button
          variant="ghost"
          size="icon"
          href="https://github.com/epavanello/devmotion"
          target="_blank"
          rel="noreferrer"
          icon={Github}
        />
      </div>

      <div class="flex items-center gap-2">
        <!-- Theme Toggle -->
        <TooltipButton
          content={themeStore.resolvedTheme === 'dark'
            ? 'Switch to Light Mode'
            : 'Switch to Dark Mode'}
          variant="ghost"
          onclick={() => themeStore.toggle()}
          icon={themeStore.resolvedTheme === 'dark' ? Sun : Moon}
        />

        <Button variant="ghost" href="/" class="gap-2">
          <ArrowLeft class="h-4 w-4" />
          Back to Editor
        </Button>
      </div>
    </div>
  </header>

  <main class="flex flex-1 flex-col">
    {@render children?.()}
  </main>

  <footer class="border-t py-6 md:py-0">
    <div
      class="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:px-6 md:h-16 md:flex-row lg:px-8"
    >
      <p class="text-center text-sm leading-loose text-muted-foreground md:text-left">
        Built by <a
          href="https://twitter.com/emadev01"
          target="_blank"
          rel="noreferrer"
          class="font-medium underline underline-offset-4">EmaDev</a
        >. The source code is available on
        <a
          href="https://github.com/epavanello/devmotion"
          target="_blank"
          rel="noreferrer"
          class="font-medium underline underline-offset-4">GitHub</a
        >.
      </p>
    </div>
  </footer>
</div>

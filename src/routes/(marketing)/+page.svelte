<script lang="ts">
  import SeoHead from '$lib/components/seo-head.svelte';
  import JsonLd from '$lib/components/json-ld.svelte';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
  import Player from '$lib/components/player/player.svelte';
  import Arrow from '$lib/assets/svg/arrow.svelte';
  import {
    Clock,
    Sparkles,
    Download,
    Layers,
    Globe,
    Code,
    MousePointerClick,
    Film,
    Share2,
    Smartphone,
    Monitor,
    Square,
    Users,
    Zap,
    ChevronDown
  } from '@lucide/svelte';
  import type { SoftwareApplication, WithContext } from 'schema-dts';
  import ApplyFont from '$lib/components/font/apply-font.svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';

  const { data } = $props();

  // Structured data for SEO
  const structuredData = $derived<WithContext<SoftwareApplication>>({
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
      'Professional motion graphics editor in your browser. AI-powered timeline, keyframe animation, and layer system.'
  });

  // Social proof configuration - easy to update
  const socialProof = $derived({
    githubStars: true, // Dynamic badge from shields.io
    stats: [
      {
        icon: Users,
        label: 'Active creators',
        value: `${data.stats.totalUsers.toLocaleString()}+`,
        show: true
      },
      {
        icon: Zap,
        label: 'Projects created',
        value: `${data.stats.totalProjects.toLocaleString()}+`,
        show: true
      }
    ]
  });

  // Use cases - easy to modify
  const useCases = [
    { emoji: '📺', title: 'YouTube Intros & Outros', show: true },
    { emoji: '📱', title: 'Social Media Hooks', show: true },
    { emoji: '🛍️', title: 'Product Demo Videos', show: true },
    { emoji: '🎓', title: 'Educational Content', show: true },
    { emoji: '💼', title: 'Presentation Slides', show: true },
    { emoji: '🎬', title: 'Short-Form Content', show: true }
  ];

  // FAQ - easy to modify
  const faqs = [
    {
      question: 'Is DevMotion really free?',
      answer:
        'Yes, DevMotion is 100% free and open source (MIT license). You can use it without creating an account, and there are no hidden costs or premium tiers.',
      show: true
    },
    {
      question: 'Do I need to download or install anything?',
      answer:
        'No downloads required. DevMotion runs entirely in your browser. Just visit the site and start creating animations immediately.',
      show: true
    },
    {
      question: 'Can I export my animations as videos?',
      answer:
        'Yes, you can export your animations as high-quality MP4 videos (1080p) ready for YouTube, Instagram, TikTok, or any other platform.',
      show: true
    },
    {
      question: 'What platforms and formats does it support?',
      answer:
        'DevMotion supports multiple aspect ratios: 16:9 (landscape/YouTube), 9:16 (portrait/TikTok/Stories), and 1:1 (square/Instagram). Switch between formats instantly.',
      show: true
    },
    {
      question: 'How does the AI assistance work?',
      answer:
        'Chat with our AI assistant to create animations. Describe what you want (e.g., "Add a bounce effect" or "Make this fade in"), and the AI helps generate the animation automatically.',
      show: true
    },
    {
      question: 'Can I use DevMotion for commercial projects?',
      answer:
        'Yes, DevMotion is MIT licensed, which means you can use it for personal and commercial projects without restrictions.',
      show: true
    }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Timeline & Keyframes',
      description:
        'Unlimited layers, bezier easing curves, and frame-perfect control. Everything you expect from professional tools, zero learning curve.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Workflow',
      description:
        'Chat with AI to create animations: "Add a bounce effect" or "Make this fade in smoothly". Watch your ideas come to life instantly.'
    },
    {
      icon: Download,
      title: 'Export HD Videos',
      description:
        'Export 1080p MP4 videos ready for YouTube, Instagram, or TikTok. High-quality renders directly from your browser.'
    },
    {
      icon: Layers,
      title: 'Layer System',
      description:
        'Composable layer architecture with text, shapes, images, and more. Stack, group, and blend layers like a pro.'
    },
    {
      icon: Globe,
      title: 'Browser-Based',
      description:
        'No downloads, no installations. Open your browser and start creating. Works on any modern device with zero setup.'
    },
    {
      icon: Code,
      title: 'Open Source',
      description:
        'Free and fully transparent. Inspect the code, contribute features, and join a community of creators and developers.'
    }
  ];

  const steps = [
    {
      icon: MousePointerClick,
      title: 'Design your scene',
      description:
        'Add layers, text, shapes, and images. Arrange your composition with an intuitive visual editor.'
    },
    {
      icon: Film,
      title: 'Animate with keyframes',
      description:
        'Set keyframes on the timeline, choose easing curves, and preview your animation in real-time.'
    },
    {
      icon: Share2,
      title: 'Export & share',
      description:
        'Render to MP4 with one click. Share your creation with the world or publish to the community gallery.'
    }
  ];

  const aspectRatios = [
    {
      value: 'landscape',
      label: '16:9',
      icon: Monitor,
      width: 1280,
      height: 720,
      desc: 'Landscape'
    },
    {
      value: 'portrait',
      label: '9:16',
      icon: Smartphone,
      width: 720,
      height: 1280,
      desc: 'Portrait'
    },
    { value: 'square', label: '1:1', icon: Square, width: 720, height: 720, desc: 'Square' }
  ];

  const mediaQuery = new IsMobile();
  const isMobile = $derived(mediaQuery.current);
  let selectedAspectRatio = $derived(isMobile ? 'portrait' : 'landscape');

  const projectData = $derived.by(() => {
    const baseProject = data.projectSnapshot;
    const selectedRatio = aspectRatios.find((r) => r.value === selectedAspectRatio);

    if (selectedRatio) {
      return {
        ...baseProject,
        width: selectedRatio.width,
        height: selectedRatio.height
      };
    }

    return baseProject;
  });
</script>

<JsonLd item={structuredData} />

<SeoHead
  title="DevMotion - After Effects meets AI. In your browser."
  description="Create professional animations like After Effects, free. AI-powered timeline, keyframes, MP4 export. No download, browser-based. Start now."
  keywords="motion graphics, animation editor, browser animation, AI animation, keyframe editor, video export, open source, After Effects alternative, free video editor"
/>

<!-- ===== HERO ===== -->
<section class="relative overflow-hidden">
  <!-- Background gradient orbs -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
      class="animate-float absolute -top-40 -left-40 h-96 w-96 rounded-full bg-(--brand-blue)/20 blur-3xl"
    ></div>
    <div
      class="animate-float-delayed absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-(--brand-purple)/20 blur-3xl"
    ></div>
    <div
      class="animate-float-slow absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
    ></div>
  </div>

  <div class="container mx-auto px-4 py-24 sm:px-6 md:py-32 lg:px-8 lg:py-40">
    <div class="relative z-10 mx-auto max-w-4xl text-center">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
        <span
          class="bg-linear-to-r from-(--brand-blue) to-(--brand-purple) bg-clip-text text-transparent"
        >
          After Effects
        </span>
        meets
        <span
          class="bg-linear-to-r from-(--brand-purple) to-(--brand-blue) bg-clip-text text-transparent"
        >
          AI
        </span>
        <br />
        <span class="text-foreground">In your browser.</span>
      </h1>

      <p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Create stunning animations in minutes, not hours. Professional timeline, AI assistance, and
        one-click export. No Adobe subscription required.
      </p>

      <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" href={resolve('/(app)/editor')} class="text-base">
          Create Your First Animation →
        </Button>
        <Button variant="outline" size="lg" href={resolve('/gallery')} class="text-base">
          View Gallery
        </Button>
      </div>

      <!-- Social Proof Badges -->
      <div
        class="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
      >
        {#if socialProof.githubStars}
          <a
            href="https://github.com/epavanello/devmotion"
            target="_blank"
            rel="noreferrer"
            class="transition-opacity hover:opacity-80"
            aria-label="Star DevMotion on GitHub"
          >
            <img
              src="https://img.shields.io/github/stars/epavanello/devmotion?style=social"
              alt="GitHub stars"
              loading="lazy"
            />
          </a>
        {/if}

        {#each socialProof.stats as stat (stat.label)}
          {#if stat.show}
            {@const Icon = stat.icon}
            <div class="flex items-center gap-2">
              <Icon class="h-4 w-4" />
              <span class="font-medium text-foreground">{stat.value}</span>
              <span>{stat.label}</span>
            </div>
          {/if}
        {/each}

        <div class="flex items-center gap-2">
          <Code class="h-4 w-4" />
          <span>Open source & MIT</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Live Player Demo - Full Width -->
  <div class="relative mt-16 w-full bg-muted/20 py-12">
    <!-- Header with aspect ratio switcher -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
        <div class="text-center sm:text-left">
          <h2 class="text-xl font-bold text-foreground md:text-2xl">
            <span class="block sm:inline">One Project,</span>
            <span class="block sm:ml-1 sm:inline">Every Platform</span>
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Create once, optimize for YouTube, Instagram, TikTok instantly.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Curved Arrow with CTA text -->
          <div class="flex flex-row items-center justify-center gap-2" aria-hidden="true">
            <span class="mt-3 text-2xl font-medium whitespace-nowrap text-muted-foreground">
              <ApplyFont fontFamily="Indie Flower">Try it!</ApplyFont>
            </span>
            <div class="w-20 text-primary">
              <Arrow />
            </div>
          </div>

          <div class="flex items-center gap-2 rounded-lg border border-border bg-background p-1">
            {#each aspectRatios as ratio (ratio.value)}
              {@const Icon = ratio.icon}
              <button
                onclick={() => (selectedAspectRatio = ratio.value)}
                class="group relative flex min-w-20 flex-col items-center gap-1.5 rounded-md px-4 py-2.5 transition-all duration-200 {selectedAspectRatio ===
                ratio.value
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'hover:bg-muted/50'}"
                aria-label="Switch to {ratio.desc} format"
                aria-pressed={selectedAspectRatio === ratio.value}
              >
                <Icon class="h-4 w-4" />
                <span class="text-xs font-medium">{ratio.label}</span>
                <span class="text-[10px] opacity-70">{ratio.desc}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Player - Full Width -->
    <div class="relative w-full overflow-hidden py-8">
      <div class="relative h-128 w-full">
        {#if projectData}
          <Player project={projectData} mode="simple" autoplay={true} />
        {/if}
      </div>
    </div>
  </div>
</section>

<!-- ===== FEATURES ===== -->
<section class="relative border-t border-border/40 bg-muted/30">
  <div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
    <div class="mb-16 space-y-4 text-center">
      <h2
        class="bg-linear-to-r from-primary to-purple-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl"
      >
        Professional Motion Graphics Tools, Free
      </h2>
      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        Everything you need to create stunning animations, right in your browser.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each features as feature (feature.title)}
        <div
          class="group rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
        >
          <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-(--brand-blue)/10 to-(--brand-purple)/10 transition-colors duration-300 group-hover:from-[var(--brand-blue)]/20 group-hover:to-[var(--brand-purple)]/20"
          >
            <feature.icon
              class="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
          <p class="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ===== USE CASES ===== -->
<section class="relative border-t border-border/40">
  <div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
    <div class="mb-16 space-y-4 text-center">
      <h2 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        Perfect for every creator
      </h2>
      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        From content creators to educators, DevMotion helps bring your ideas to life.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each useCases as useCase (useCase.title)}
        {#if useCase.show}
          <div
            class="flex items-center gap-4 rounded-xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/50"
          >
            <span class="text-3xl" role="img" aria-hidden="true">{useCase.emoji}</span>
            <span class="font-medium text-foreground">{useCase.title}</span>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>

<!-- ===== HOW IT WORKS ===== -->
<section class="relative">
  <div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
    <div class="mb-16 space-y-4 text-center">
      <h2
        class="bg-linear-to-r from-primary to-purple-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl"
      >
        How to Make Animated Videos in Minutes
      </h2>
      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        From blank canvas to finished animation in three simple steps.
      </p>
    </div>

    <div class="relative mx-auto max-w-4xl">
      <!-- Connecting line (desktop) -->
      <div
        class="absolute top-7 right-24 left-24 hidden h-px bg-linear-to-r from-(--brand-blue)/30 via-(--brand-purple)/30 to-(--brand-blue)/30 lg:block"
        aria-hidden="true"
      ></div>

      <div class="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
        {#each steps as step, i (step.title)}
          <div class="relative text-center">
            <div
              class="relative z-10 mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-(--brand-blue) to-(--brand-purple) text-xl font-bold text-white shadow-lg shadow-primary/20"
            >
              {i + 1}
            </div>
            <div
              class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
            >
              <step.icon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
            <p class="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- ===== FAQ ===== -->
<section class="relative border-t border-border/40 bg-muted/30">
  <div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
    <div class="mb-16 space-y-4 text-center">
      <h2 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        Frequently Asked Questions
      </h2>
      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        Everything you need to know about DevMotion.
      </p>
    </div>

    <div class="mx-auto max-w-3xl space-y-4">
      {#each faqs as faq (faq.question)}
        {#if faq.show}
          <details
            class="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/30"
          >
            <summary
              class="flex cursor-pointer items-center justify-between p-6 font-semibold text-foreground transition-colors hover:text-primary"
            >
              <span>{faq.question}</span>
              <ChevronDown
                class="h-5 w-5 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div
              class="border-t border-border/30 px-6 py-4 text-sm leading-relaxed text-muted-foreground"
            >
              {faq.answer}
            </div>
          </details>
        {/if}
      {/each}
    </div>
  </div>
</section>

<!-- ===== BOTTOM CTA ===== -->
<section class="relative overflow-hidden">
  <div
    class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent"
    aria-hidden="true"
  ></div>

  <div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
    <div class="relative z-10 mx-auto max-w-2xl text-center">
      <h2 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        Ready to create?
      </h2>
      <p class="mt-4 text-lg text-muted-foreground">
        Start building professional animations in your browser. Free, open source, and no sign-up
        required.
      </p>
      <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" href={resolve('/(app)/editor')} class="text-base">
          Get Started Free →
        </Button>
        <Button
          variant="outline"
          size="lg"
          href="https://github.com/epavanello/devmotion"
          target="_blank"
          rel="noreferrer"
          class="text-base"
        >
          View on GitHub
        </Button>
      </div>
    </div>
  </div>
</section>

<style>
  @keyframes float {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.05);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.95);
    }
  }

  @keyframes float-delayed {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(-25px, 25px) scale(0.95);
    }
    66% {
      transform: translate(35px, -15px) scale(1.05);
    }
  }

  @keyframes float-slow {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  :global(.animate-float) {
    animation: float 15s ease-in-out infinite;
  }
  :global(.animate-float-delayed) {
    animation: float-delayed 18s ease-in-out infinite;
  }
  :global(.animate-float-slow) {
    animation: float-slow 20s ease-in-out infinite;
  }
</style>

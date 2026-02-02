<script lang="ts">
  import { page } from '$app/stores';
  import SeoHead from '$lib/components/seo-head.svelte';
  import { Button } from '$lib/components/ui/button';
  import { goto } from '$app/navigation';
  import { ArrowLeft, ArrowRight, Eye, Film } from 'lucide-svelte';
  import { resolve } from '$app/paths';

  let { data } = $props();

  function changePage(newPage: number) {
    if (newPage < 1 || newPage > data.pages) return;
    const url = new URL($page.url);
    url.searchParams.set('page', String(newPage));
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url.toString());
  }
</script>

<SeoHead
  title="Community Gallery - DevMotion"
  description="Explore amazing animations created by the DevMotion community. Search, view, and get inspired by projects from other creators."
/>

<div class="flex-1 bg-background text-foreground">
  <div class="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="mb-16 space-y-4 text-center">
      <h1
        class="bg-linear-to-r from-primary to-purple-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl lg:text-6xl"
      >
        Community Gallery
      </h1>
      <p class="mx-auto max-w-2xl text-xl text-muted-foreground">
        Discover creative animations built by our community.
      </p>
    </div>

    {#if data.projects.length === 0}
      <div
        class="rounded-3xl border border-dashed border-muted-foreground/20 bg-muted/10 py-20 text-center"
      >
        <p class="text-2xl font-light text-muted-foreground">No projects found.</p>
        <p class="mt-2 text-sm text-muted-foreground">Check back later for new creations!</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {#each data.projects as project (project.id)}
          <a
            href={resolve('/(app)/p/[id]', {
              id: project.id
            })}
            class="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
          >
            <!-- Thumbnail Placeholder -->
            <div
              class="relative flex aspect-video items-center justify-center overflow-hidden bg-linear-to-br from-muted/50 to-muted transition-colors duration-500 group-hover:from-muted/80"
            >
              <div class="bg-grid-pattern absolute inset-0 opacity-10"></div>
              <div
                class="flex h-16 w-16 items-center justify-center rounded-full bg-background/50 shadow-inner backdrop-blur-md transition-transform duration-500 group-hover:scale-110"
              >
                <Film
                  class="h-8 w-8 text-foreground/70 transition-colors duration-500 group-hover:text-primary"
                />
              </div>
              <!-- Views Badge -->
              <div
                class="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-xs text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <Eye class="h-3 w-3" />
                {project.views}
              </div>

              {#if project.isMcp}
                <div
                  class="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-[10px] font-bold tracking-wider text-primary-foreground shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
                >
                  MCP
                </div>
              {/if}
            </div>

            <div class="flex flex-1 flex-col gap-3 p-5">
              <h3
                class="line-clamp-1 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary"
              >
                {project.name}
              </h3>

              <div
                class="mt-auto flex items-center justify-between border-t border-border/40 pt-3 text-sm text-muted-foreground"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 text-[10px] font-bold text-white"
                  >
                    {(project.user?.name || '?')[0].toUpperCase()}
                  </div>
                  <span class="max-w-[100px] truncate">{project.user?.name || 'Anonymous'}</span>
                </div>
                <span class="text-xs opacity-70">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    {#if data.pages > 1}
      <div class="mt-16 flex items-center justify-center gap-6 pb-8">
        <Button
          variant="outline"
          size="lg"
          class="group w-32"
          disabled={data.currentPage === 1}
          onclick={() => changePage(data.currentPage - 1)}
        >
          <ArrowLeft class="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Previous
        </Button>
        <div class="font-medium text-foreground/80 tabular-nums">
          Page {data.currentPage} <span class="text-muted-foreground">of</span>
          {data.pages}
        </div>
        <Button
          variant="outline"
          size="lg"
          class="group w-32"
          disabled={data.currentPage === data.pages}
          onclick={() => changePage(data.currentPage + 1)}
        >
          Next
          <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    {/if}
  </div>
</div>

<style>
  .bg-grid-pattern {
    background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
</style>

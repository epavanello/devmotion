<script lang="ts">
  import { Search, Info, ExternalLink, LoaderCircle } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import Input from '$lib/components/ui/input/input.svelte';
  import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
  import Select from '$lib/components/ui/select/select.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { searchLummiImages, type LummiImage } from '$lib/functions/lummi.remote';

  interface Props {
    /** Callback when an image is selected */
    onSelect: (result: {
      url: string;
      fileName: string;
      attribution: { imageUrl: string; authorUrl: string; authorName: string };
    }) => void;
  }

  let { onSelect }: Props = $props();

  let searchQuery = $state('');
  let isSearching = $state(false);
  let searchError = $state('');
  let images = $state<LummiImage[]>([]);
  let currentPage = $state(1);
  let totalCount = $state(0);

  // Filters
  let imageType = $state<'photo' | 'illustration' | '3d' | undefined>(undefined);
  let orientation = $state<'square' | 'horizontal' | 'vertical' | undefined>(undefined);

  const hasMore = $derived(images.length < totalCount);

  async function performSearch(page = 1) {
    if (!searchQuery.trim()) {
      searchError = 'Please enter a search term';
      return;
    }

    isSearching = true;
    searchError = '';

    try {
      const params: {
        query: string;
        page: number;
        perPage: number;
        imageType?: 'photo' | 'illustration' | '3d';
        orientation?: 'square' | 'horizontal' | 'vertical';
      } = {
        query: searchQuery,
        page,
        perPage: 20
      };

      if (imageType) params.imageType = imageType;
      if (orientation) params.orientation = orientation;

      const result = await searchLummiImages(params);

      if (page === 1) {
        images = result.images;
      } else {
        images = [...images, ...result.images];
      }

      totalCount = result.totalCount;
      currentPage = page;
    } catch (err) {
      searchError = err instanceof Error ? err.message : 'Search failed';
    } finally {
      isSearching = false;
    }
  }

  function handleSearch() {
    performSearch(1);
  }

  function loadMore() {
    if (!isSearching && hasMore) {
      performSearch(currentPage + 1);
    }
  }

  function selectImage(image: LummiImage) {
    // Use optimized URL with reasonable dimensions
    const optimizedUrl = `${image.url}?w=1920&fm=webp`;

    onSelect({
      url: optimizedUrl,
      fileName: `lummi-${image.id}.webp`,
      attribution: {
        imageUrl: image.attributionUrl,
        authorUrl: image.author.attributionUrl,
        authorName: image.author.name ?? image.author.username
      }
    });
  }
</script>

<div class="flex flex-col gap-3">
  <!-- Search bar -->
  <div class="flex gap-2">
    <div class="flex-1">
      <Input
        bind:value={searchQuery}
        placeholder="Search Lummi images..."
        onkeydown={(e) => e.key === 'Enter' && handleSearch()}
      />
    </div>
    <Button
      variant="default"
      size="sm"
      onclick={handleSearch}
      disabled={isSearching}
      loading={isSearching}
      icon={Search}
    >
      Search
    </Button>
  </div>

  <!-- Filters -->
  <div class="flex gap-2">
    <Select
      bind:value={imageType}
      placeholder="Type"
      options={[
        { value: '', label: 'All types' },
        { value: 'photo', label: 'Photo' },
        { value: 'illustration', label: 'Illustration' },
        { value: '3d', label: '3D' }
      ]}
      trigger={{ class: 'w-[120px] text-xs' }}
    />

    <Select
      bind:value={orientation}
      placeholder="Orientation"
      options={[
        { value: '', label: 'All' },
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
        { value: 'square', label: 'Square' }
      ]}
      trigger={{ class: 'w-[120px] text-xs' }}
    />
  </div>

  <!-- Attribution notice -->
  <div class="flex items-start gap-2 rounded border border-blue-500/20 bg-blue-500/10 px-3 py-2">
    <Info class="mt-0.5 size-3 shrink-0 text-blue-400" />
    <p class="text-[10px] leading-tight text-blue-200">
      Images from Lummi require attribution. The author credit will be displayed automatically on
      your layer.
    </p>
  </div>

  <!-- Error message -->
  {#if searchError}
    <p class="text-xs text-destructive">{searchError}</p>
  {/if}

  <!-- Results -->
  {#if images.length > 0}
    <ScrollArea viewportClass="max-h-[400px]">
      <div class="grid grid-cols-2 gap-2 pr-2">
        {#each images as image (image.id)}
          <button
            class="group relative overflow-hidden rounded border bg-black transition-all hover:border-primary hover:ring-1 hover:ring-primary"
            onclick={() => selectImage(image)}
          >
            <img
              src={image.url}
              alt=""
              class="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            />

            <!-- Hover overlay with info -->
            <div
              class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <p class="truncate text-[10px] text-white">
                by {image.author.name ?? image.author.username}
              </p>
              <div class="mt-1 flex items-center gap-1 text-[9px] text-gray-300">
                <span>{image.width}×{image.height}</span>
                <span>•</span>
                <span class="capitalize">{image.imageType}</span>
                {#if image.pro}
                  <span>•</span>
                  <span class="text-yellow-400">PRO</span>
                {/if}
              </div>
            </div>

            <!-- Attribution link indicator -->
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger class="absolute top-1 right-1">
                  <div
                    class="rounded bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ExternalLink class="size-3 text-white" />
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p class="text-xs">Click to use this image</p>
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </button>
        {/each}
      </div>

      <!-- Load more button -->
      {#if hasMore}
        <div class="mt-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onclick={loadMore}
            disabled={isSearching}
            loading={isSearching}
          >
            Load more
          </Button>
        </div>
      {/if}
    </ScrollArea>
  {:else if !isSearching && searchQuery}
    <div class="py-8 text-center text-sm text-muted-foreground">
      No images found. Try a different search term.
    </div>
  {:else if !searchQuery}
    <div class="py-8 text-center text-sm text-muted-foreground">
      Search for free stock images from Lummi
    </div>
  {/if}

  <!-- Loading indicator -->
  {#if isSearching && images.length === 0}
    <div class="flex items-center justify-center py-8">
      <LoaderCircle class="size-6 animate-spin text-muted-foreground" />
    </div>
  {/if}
</div>

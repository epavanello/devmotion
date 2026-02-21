<script module lang="ts">
  export type DragAsset = {
    url: string;
    mediaType: string;
    originalName: string;
    duration: number | null;
  };

  export const ASSET_DRAG_TYPE = 'application/devmotion-asset';
</script>

<script lang="ts">
  import { getUserAssets, deleteAsset } from '$lib/functions/assets.remote';
  import { Button } from '$lib/components/ui/button';
  import { Upload, Trash2, Loader2, Image, Video, Music, FileIcon } from '@lucide/svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { Asset } from '$lib/server/db/schema';

  const editorState = $derived(getEditorState());

  let filterType = $state<'all' | 'image' | 'video' | 'audio'>('all');

  const assets = $derived(
    getUserAssets({ mediaType: filterType === 'all' ? undefined : filterType })
  );

  let isLoading = $derived(assets.loading);

  let isUploading = $state(false);
  let uploadError = $state('');
  let deletingIds = $state(new Set<string>());

  let fileInputEl: HTMLInputElement | undefined = $state();

  const filteredAssets = $derived(
    filterType === 'all'
      ? assets.current
      : assets.current?.filter((a) => a.mediaType === filterType)
  );

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function getMediaIcon(mediaType: string) {
    switch (mediaType) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'audio':
        return Music;
      default:
        return FileIcon;
    }
  }

  async function handleUpload(e: Event) {
    await uiStore.requireLogin('upload files', () => performUpload(e));
  }

  async function performUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isUploading = true;
    uploadError = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      // projectId is optional now
      const pid = editorState.dbProjectId;
      if (pid) {
        formData.append('projectId', pid);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Upload failed (${res.status})`);
      }

      // Reload assets list
      assets.refresh();
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      if (input) input.value = '';
    }
  }

  async function handleDelete(assetItem: Asset) {
    deletingIds = new Set([...deletingIds, assetItem.id]);
    try {
      const result = await deleteAsset({ id: assetItem.id });
      if (result.success) {
        assets.refresh();
      }
    } finally {
      const next = new SvelteSet(deletingIds);
      next.delete(assetItem.id);
      deletingIds = next;
    }
  }

  function handleDragStart(e: DragEvent, assetItem: Asset) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData(
      ASSET_DRAG_TYPE,
      JSON.stringify({
        url: assetItem.url,
        mediaType: assetItem.mediaType,
        originalName: assetItem.originalName,
        duration: assetItem.duration
      } satisfies DragAsset)
    );
    e.dataTransfer.effectAllowed = 'copy';
  }
</script>

<div class="flex h-full flex-col">
  <!-- Filter tabs -->
  <div class="flex items-center gap-1 border-b px-3 py-2">
    {#each [['all', 'All'], ['image', 'Images'], ['video', 'Videos'], ['audio', 'Audio']] as [value, label] (value)}
      <button
        class="rounded-md px-2 py-1 text-xs transition-colors {filterType === value
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted'}"
        onclick={() => (filterType = value as typeof filterType)}
      >
        {label}
      </button>
    {/each}
  </div>

  <!-- Upload button -->
  <div class="border-b px-3 py-2">
    <Button
      variant="outline"
      size="sm"
      class="w-full justify-center text-xs"
      disabled={isUploading}
      onclick={() => fileInputEl?.click()}
    >
      {#if isUploading}
        <Loader2 class="mr-2 size-3 animate-spin" />
        <span>Uploading...</span>
      {:else}
        <Upload class="mr-2 size-3" />
        <span>Upload file</span>
      {/if}
    </Button>

    {#if uploadError}
      <p class="mt-1 text-xs text-destructive">{uploadError}</p>
    {/if}
  </div>

  <!-- Assets list -->
  <div class="flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="flex items-center justify-center py-8">
        <Loader2 class="size-5 animate-spin text-muted-foreground" />
      </div>
    {:else if filteredAssets?.length === 0}
      <div class="px-4 py-8 text-center text-xs text-muted-foreground">
        {#if filterType === 'all'}
          No assets uploaded yet. Upload images, videos, or audio files to use across your projects.
        {:else}
          No {filterType} assets found.
        {/if}
      </div>
    {:else}
      <div class="divide-y">
        {#each filteredAssets as assetItem (assetItem.id)}
          {@const Icon = getMediaIcon(assetItem.mediaType)}
          <div
            class="group flex items-center gap-3 px-3 py-2 hover:bg-muted/50"
            draggable="true"
            ondragstart={(e) => handleDragStart(e, assetItem)}
            role="listitem"
          >
            <!-- Thumbnail / icon -->
            <div
              class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted"
            >
              {#if assetItem.mediaType === 'image'}
                <img
                  src={assetItem.url}
                  alt={assetItem.originalName}
                  class="size-full object-cover"
                />
              {:else}
                <Icon class="size-4 text-muted-foreground" />
              {/if}
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium">{assetItem.originalName}</p>
              <p class="text-[10px] text-muted-foreground">
                {formatSize(assetItem.size)} &middot; {assetItem.mediaType}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                class="size-7 p-0 text-destructive hover:bg-destructive/10"
                disabled={deletingIds.has(assetItem.id)}
                onclick={() => handleDelete(assetItem)}
              >
                {#if deletingIds.has(assetItem.id)}
                  <Loader2 class="size-3 animate-spin" />
                {:else}
                  <Trash2 class="size-3" />
                {/if}
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Hidden file input -->
  <input
    bind:this={fileInputEl}
    type="file"
    class="hidden"
    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,audio/mpeg,audio/wav"
    onchange={handleUpload}
  />
</div>

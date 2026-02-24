<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Upload, Loader2, FolderOpen } from '@lucide/svelte';
  import * as Popover from '$lib/components/ui/popover';
  import AudioRecorder from './AudioRecorder.svelte';
  import VideoRecorder from './VideoRecorder.svelte';
  import CameraCapture from './CameraCapture.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { getUserAssets } from '$lib/functions/assets.remote';
  import type { Asset } from '$lib/server/db/schema';
  import { extractMediaDuration } from '$lib/utils/media';
  import ScrollArea from '../ui/scroll-area/scroll-area.svelte';

  interface Props {
    /** Current file URL (if already uploaded or set) */
    value?: string;
    /** Original filename (if available) */
    currentFileName?: string;
    /** Media type: image, video, or audio */
    mediaType: 'image' | 'video' | 'audio';
    /** Callback when file is uploaded */
    onUpload: (result: { url: string; key: string; fileName: string; duration?: number }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
  }

  let { value = '', currentFileName = '', mediaType, onUpload, projectId }: Props = $props();

  const editorState = $derived(getEditorState());

  let uploadError = $state('');
  let fileInputEl: HTMLInputElement | undefined = $state();
  let displayName = $derived(currentFileName || '');

  let assetPickerOpen = $state(false);

  let assets = $derived(getUserAssets({ mediaType }));
  const existingAssets = $derived(assets.current?.filter((asset) => asset.mediaType === mediaType));
  let isLoadingAssets = $derived(assets.loading);

  function selectExistingAsset(asset: Asset) {
    assetPickerOpen = false;
    onUpload({
      url: asset.url,
      key: asset.storageKey,
      fileName: asset.originalName,
      duration: asset.duration ?? undefined
    });
  }

  // Accept patterns for file input - MP4 only for consistency with FFmpeg
  const acceptPatterns = {
    image: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    video: 'video/mp4',
    audio: 'audio/mp3'
  };

  const maxSizes =
    process.env.NODE_ENV === 'development'
      ? {
          image: '100MB',
          video: '100MB',
          audio: '100MB'
        }
      : {
          image: '1MB',
          video: '1MB',
          audio: '1MB'
        };

  async function handleFileSelect(e: Event) {
    await uiStore.requireLogin('save your project', () => {
      uiStore.requireCreateProject(editorState, () => performFileUpload(e));
    });
  }

  async function performFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploadError = '';

    try {
      // Extract duration for video/audio files
      let duration: number | undefined;
      if (mediaType === 'video' || mediaType === 'audio') {
        duration = await extractMediaDuration(file, mediaType);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);
      if (projectId) {
        formData.append('projectId', projectId);
      }
      if (duration !== undefined) {
        formData.append('duration', duration.toString());
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.file) {
        onUpload({
          url: data.file.url,
          key: data.file.key,
          fileName: data.file.originalName,
          duration
        });
      }
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      // Reset input
      if (input) input.value = '';
    }
  }
</script>

<div class="space-y-2">
  <!-- Media preview with filename (if uploaded) -->
  {#if value && (mediaType === 'image' || mediaType === 'video')}
    <div class="relative overflow-hidden rounded border bg-black">
      {#if mediaType === 'image'}
        <img
          src={value}
          alt={displayName}
          class="h-auto w-full"
          style="max-height: 180px; object-fit: contain;"
        />
      {:else}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          src={value}
          class="h-auto w-full"
          style="max-height: 180px; object-fit: contain;"
          controls
          preload="metadata"
        ></video>
      {/if}
      <div class="absolute right-0 bottom-0 left-0 bg-black/70 px-2 py-1">
        <p class="truncate text-[10px] text-white">{displayName}</p>
      </div>
    </div>
  {/if}

  <!-- Upload/Replace button -->
  <div class="flex gap-1.5">
    <Button
      variant="outline"
      size="sm"
      class="flex-1 justify-start text-xs"
      onclick={() => fileInputEl?.click()}
      icon={Upload}
    >
      {value ? 'Replace' : `Upload ${mediaType}`}
    </Button>

    <!-- Pick from existing assets -->
    <Popover.Root bind:open={assetPickerOpen}>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="sm"
            icon={FolderOpen}
            class="flex-1 justify-start text-xs"
          >
            Pick from assets
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-64 p-0" align="end">
        <ScrollArea viewportClass="max-h-[calc(100vh-20rem)]">
          {#if isLoadingAssets}
            <div class="flex items-center justify-center py-4">
              <Loader2 class="size-4 animate-spin text-muted-foreground" />
            </div>
          {:else if existingAssets?.length === 0}
            <div class="px-3 py-4 text-center text-xs text-muted-foreground">
              No {mediaType} assets found
            </div>
          {:else}
            {#each existingAssets as asset (asset.id)}
              <button
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/50"
                onclick={() => selectExistingAsset(asset)}
              >
                {#if asset.mediaType === 'image'}
                  <img
                    src={asset.url}
                    alt={asset.originalName}
                    class="size-8 shrink-0 rounded object-cover"
                  />
                {:else}
                  <div class="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                    <FolderOpen class="size-3 text-muted-foreground" />
                  </div>
                {/if}
                <span class="truncate">{asset.originalName}</span>
              </button>
            {/each}
          {/if}
        </ScrollArea>
      </Popover.Content>
    </Popover.Root>
  </div>

  <!-- Record/Capture option -->
  {#if mediaType === 'audio'}
    <AudioRecorder {projectId} onRecordingComplete={(result) => onUpload(result)} />
  {:else if mediaType === 'video'}
    <VideoRecorder {projectId} onRecordingComplete={(result) => onUpload(result)} />
  {:else if mediaType === 'image'}
    <CameraCapture {projectId} onCaptureComplete={(result) => onUpload(result)} />
  {/if}

  <!-- File input (hidden) -->
  <input
    bind:this={fileInputEl}
    type="file"
    class="hidden"
    accept={acceptPatterns[mediaType]}
    onchange={handleFileSelect}
  />

  <!-- Upload error -->
  {#if uploadError}
    <p class="text-xs text-destructive">{uploadError}</p>
  {/if}

  <!-- Max size hint -->
  <p class="text-[10px] text-muted-foreground">Max size: {maxSizes[mediaType]}</p>
</div>

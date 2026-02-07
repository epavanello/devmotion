<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Upload, Trash2, Loader2, Check } from '@lucide/svelte';
  import AudioRecorder from './AudioRecorder.svelte';
  import VideoRecorder from './VideoRecorder.svelte';
  import CameraCapture from './CameraCapture.svelte';

  interface Props {
    /** Current file URL (if already uploaded or set) */
    value?: string;
    /** Original filename (if available) */
    currentFileName?: string;
    /** Media type: image, video, or audio */
    mediaType: 'image' | 'video' | 'audio';
    /** Callback when file is uploaded */
    onUpload: (result: { url: string; key: string; fileName: string; duration?: number }) => void;
    /** Callback when file is removed */
    onRemove?: () => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
  }

  let {
    value = '',
    currentFileName = '',
    mediaType,
    onUpload,
    onRemove,
    projectId
  }: Props = $props();

  let isUploading = $state(false);
  let uploadError = $state('');
  let fileInputEl: HTMLInputElement | undefined = $state();
  let displayName = $derived(currentFileName || '');

  // Accept patterns for file input
  const acceptPatterns = {
    image: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    video: 'video/mp4,video/webm,video/quicktime,video/x-msvideo',
    audio: 'audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac'
  };

  const maxSizes = {
    image: '10MB',
    video: '500MB',
    audio: '100MB'
  };

  /**
   * Extract duration from video or audio file
   */
  async function extractMediaDuration(file: File): Promise<number | undefined> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);

      if (mediaType === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(video.duration);
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(undefined);
        };
        video.src = url;
      } else if (mediaType === 'audio') {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(audio.duration);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(undefined);
        };
        audio.src = url;
      } else {
        URL.revokeObjectURL(url);
        resolve(undefined);
      }
    });
  }

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isUploading = true;
    uploadError = '';

    try {
      // Extract duration for video/audio files
      let duration: number | undefined;
      if (mediaType === 'video' || mediaType === 'audio') {
        duration = await extractMediaDuration(file);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);
      if (projectId) {
        formData.append('projectId', projectId);
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
      isUploading = false;
      // Reset input
      if (input) input.value = '';
    }
  }

  function handleRemove() {
    if (onRemove) {
      onRemove();
    }
  }
</script>

<div class="space-y-2">
  <!-- Media preview (if uploaded) -->
  {#if value && (mediaType === 'image' || mediaType === 'video')}
    <div class="relative overflow-hidden rounded border bg-black">
      {#if mediaType === 'image'}
        <img
          src={value}
          alt={displayName}
          class="h-auto w-full"
          style="max-height: 180px; object-fit: contain;"
        />
      {:else if mediaType === 'video'}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          src={value}
          class="h-auto w-full"
          style="max-height: 180px; object-fit: contain;"
          controls
          preload="metadata"
        ></video>
      {/if}
    </div>
  {/if}

  <!-- Upload button with status -->
  <Button
    variant="outline"
    size="sm"
    class="w-full justify-start text-xs"
    disabled={isUploading}
    onclick={() => fileInputEl?.click()}
  >
    {#if isUploading}
      <Loader2 class="mr-2 size-3 animate-spin" />
      <span>Uploading...</span>
    {:else if value && displayName}
      <Check class="mr-2 size-3 text-green-500" />
      <span class="flex-1 truncate text-left">{displayName}</span>
      <button
        type="button"
        class="ml-2 rounded p-0.5 hover:bg-muted"
        onclick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
      >
        <Trash2 class="size-3" />
      </button>
    {:else}
      <Upload class="mr-2 size-3" />
      <span>Upload {mediaType}</span>
    {/if}
  </Button>

  <!-- Media capture options based on type -->
  {#if mediaType === 'audio'}
    <AudioRecorder
      {projectId}
      onRecordingComplete={(result) => {
        onUpload(result);
      }}
    />
  {:else if mediaType === 'video'}
    <VideoRecorder
      {projectId}
      onRecordingComplete={(result) => {
        onUpload(result);
      }}
    />
  {:else if mediaType === 'image'}
    <CameraCapture
      {projectId}
      onCaptureComplete={(result) => {
        onUpload(result);
      }}
    />
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

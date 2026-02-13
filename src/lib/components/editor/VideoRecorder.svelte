<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Video, Square, Loader2, RotateCw, Monitor, Camera } from '@lucide/svelte';
  import {
    uploadMediaBlob,
    generateTimestampedFileName,
    formatDuration,
    handleMediaError,
    stopMediaStream
  } from './media-upload-utils';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';

  interface Props {
    /** Callback when recording is complete and uploaded */
    onRecordingComplete: (result: { url: string; key: string; fileName: string }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
    /** Include audio in video recording (default: true) */
    audioEnabled?: boolean;
  }

  let { onRecordingComplete, projectId, audioEnabled = true }: Props = $props();

  const editorState = $derived(getEditorState());

  let isRecording = $state(false);
  let isUploading = $state(false);
  let recordingError = $state('');
  let mediaRecorder: MediaRecorder | null = $state(null);
  let mediaStream: MediaStream | null = $state(null);
  let videoChunks: Blob[] = $state([]);
  let videoPreviewEl: HTMLVideoElement | undefined = $state();
  let facingMode = $state<'user' | 'environment'>('user');
  let recordingMode = $state<'camera' | 'screen'>('camera');

  const MAX_DURATION = 300; // 5 minutes max

  // Reactive state for UI
  let displayDuration = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;
  let recordingStartTime = 0;

  async function handleStartRecording() {
    await uiStore.requireLogin('save your project', () => {
      uiStore.requireCreateProject(editorState, startRecording);
    });
  }

  async function startRecording() {
    try {
      recordingError = '';

      // Request camera or screen access
      if (recordingMode === 'screen') {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: audioEnabled
        });
      } else {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode },
          audio: audioEnabled
        });
      }

      // STRICT: Only use MP4
      const mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Your browser does not support MP4 recording. Please use Safari.');
      }

      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: recordingMode === 'screen' ? 5000000 : 2500000
      });

      videoChunks = [];
      displayDuration = 0;
      recordingStartTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopMediaStream(mediaStream);
        mediaStream = null;

        // Create blob and extract actual duration from the MP4
        const videoBlob = new Blob(videoChunks, { type: mimeType });
        await uploadWithDuration(videoBlob);
      };

      mediaRecorder.start(1000);
      isRecording = true;

      // Update display duration
      recordingInterval = setInterval(() => {
        displayDuration = (Date.now() - recordingStartTime) / 1000;
        if (displayDuration >= MAX_DURATION) {
          stopRecording();
        }
      }, 100);
    } catch (err) {
      recordingError = handleMediaError(err).message;
      console.error('Recording error:', err);
      stopMediaStream(mediaStream);
      mediaStream = null;
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
      }
    }
  }

  /**
   * Extract actual duration from MP4 blob and upload
   */
  async function uploadWithDuration(blob: Blob) {
    isUploading = true;
    recordingError = '';

    try {
      // Get actual duration from the recorded MP4 (it always contains duration metadata)
      const duration = await getBlobDuration(blob);

      const fileName = generateTimestampedFileName('video', 'mp4');
      const result = await uploadMediaBlob(blob, fileName, 'video', projectId, duration);
      onRecordingComplete(result);
    } catch (err) {
      recordingError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      displayDuration = 0;
    }
  }

  /**
   * Extract duration from MP4 blob using video element
   */
  function getBlobDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        // MP4 always has duration, default to 1s if invalid
        resolve(isFinite(video.duration) && video.duration > 0 ? video.duration : 1);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(1); // Fallback
      };
      video.src = url;
    });
  }

  async function switchCamera() {
    if (!isRecording) return;
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    stopRecording();
    stopMediaStream(mediaStream);
    mediaStream = null;
    await startRecording();
  }

  // Preview
  $effect(() => {
    if (videoPreviewEl && mediaStream && isRecording) {
      videoPreviewEl.srcObject = mediaStream;
      videoPreviewEl.play().catch(() => {});
    }
  });

  // Cleanup
  $effect(() => {
    return () => {
      if (recordingInterval) clearInterval(recordingInterval);
      stopMediaStream(mediaStream);
    };
  });
</script>

<div class="space-y-2">
  {#if isRecording}
    <div class="rounded border-2 border-destructive bg-destructive/10 p-3">
      <div class="relative mb-2 overflow-hidden rounded bg-black">
        <video
          bind:this={videoPreviewEl}
          autoplay
          muted
          playsinline
          class="h-auto w-full"
          style="max-height: 180px; aspect-ratio: 16/9;"
        ></video>
        <div class="absolute top-2 left-2 flex items-center gap-2 rounded bg-black/50 px-2 py-1">
          <div class="h-2 w-2 animate-pulse rounded-full bg-destructive"></div>
          <span class="text-xs font-medium text-white">
            Recording {recordingMode === 'screen' ? 'Screen' : 'Camera'}
          </span>
        </div>
        <div class="absolute top-2 right-2 rounded bg-black/50 px-2 py-1">
          <span class="font-mono text-xs text-white tabular-nums">
            {formatDuration(Math.floor(displayDuration))}
          </span>
        </div>
        {#if recordingMode === 'camera'}
          <button
            type="button"
            class="absolute right-2 bottom-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onclick={switchCamera}
            title="Switch camera"
          >
            <RotateCw class="size-4" />
          </button>
        {/if}
      </div>
      <Button variant="destructive" size="sm" class="w-full" onclick={stopRecording}>
        <Square class="mr-1 size-3" />
        Stop Recording
      </Button>
      {#if displayDuration >= MAX_DURATION - 10}
        <p class="mt-1 text-center text-xs text-destructive">
          {MAX_DURATION - displayDuration}s remaining
        </p>
      {/if}
    </div>
  {:else if isUploading}
    <div class="rounded border bg-muted/30 p-3 text-center">
      <Loader2 class="mx-auto mb-2 size-6 animate-spin text-primary" />
      <span class="text-sm">Uploading video...</span>
    </div>
  {:else}
    <div class="flex gap-1 rounded border bg-muted/30 p-1">
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs transition-colors {recordingMode ===
        'camera'
          ? 'bg-background shadow-sm'
          : 'hover:bg-background/50'}"
        onclick={() => (recordingMode = 'camera')}
      >
        <Camera class="size-3" />
        Camera
      </button>
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs transition-colors {recordingMode ===
        'screen'
          ? 'bg-background shadow-sm'
          : 'hover:bg-background/50'}"
        onclick={() => (recordingMode = 'screen')}
      >
        <Monitor class="size-3" />
        Screen
      </button>
    </div>
    <Button variant="default" size="sm" class="w-full text-xs" onclick={handleStartRecording}>
      {#if recordingMode === 'screen'}
        <Monitor class="mr-1 size-3" />
        Record Screen
      {:else}
        <Video class="mr-1 size-3" />
        Record Camera
      {/if}
    </Button>
  {/if}
  {#if recordingError}
    <p class="text-xs text-destructive">{recordingError}</p>
  {/if}
</div>

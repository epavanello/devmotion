<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Video, Square, Loader2 } from '@lucide/svelte';
  import {
    uploadMediaBlob,
    generateTimestampedFileName,
    formatDuration,
    handleMediaError,
    getSupportedMimeType,
    stopMediaStream
  } from './media-upload-utils';

  interface Props {
    /** Callback when recording is complete and uploaded */
    onRecordingComplete: (result: { url: string; key: string; fileName: string }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
    /** Include audio in video recording (default: true) */
    audioEnabled?: boolean;
  }

  let { onRecordingComplete, projectId, audioEnabled = true }: Props = $props();

  let isRecording = $state(false);
  let isUploading = $state(false);
  let recordingError = $state('');
  let mediaRecorder: MediaRecorder | null = $state(null);
  let mediaStream: MediaStream | null = $state(null);
  let videoChunks: Blob[] = $state([]);
  let recordingDuration = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;
  let videoPreviewEl: HTMLVideoElement | undefined = $state();

  const MAX_DURATION = 300; // 5 minutes in seconds

  async function startRecording() {
    try {
      recordingError = '';

      // Request camera and mic access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: audioEnabled
      });

      // Show preview
      if (videoPreviewEl) {
        videoPreviewEl.srcObject = mediaStream;
      }

      // Get supported mime type with fallback
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];

      const mimeType = await getSupportedMimeType(mimeTypes);
      if (!mimeType) {
        throw new Error('No supported video codec found in your browser');
      }

      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      videoChunks = [];
      recordingDuration = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop the stream
        stopMediaStream(mediaStream);
        mediaStream = null;

        // Create blob from chunks
        const videoBlob = new Blob(videoChunks, { type: mimeType });

        // Upload the recording
        await uploadRecording(videoBlob);
      };

      mediaRecorder.start(1000); // Get chunks every second
      isRecording = true;

      // Update duration display and enforce max duration
      recordingInterval = setInterval(() => {
        recordingDuration += 1;

        // Auto-stop at max duration
        if (recordingDuration >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      const error = handleMediaError(err);
      recordingError = error.message;
      console.error('Recording error:', err);

      // Clean up on error
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

  async function uploadRecording(blob: Blob) {
    isUploading = true;
    recordingError = '';

    try {
      const fileName = generateTimestampedFileName('video', 'webm');
      const result = await uploadMediaBlob(blob, fileName, 'video', projectId);
      onRecordingComplete(result);
    } catch (err) {
      recordingError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      recordingDuration = 0;
    }
  }

  // Cleanup on unmount
  $effect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      stopMediaStream(mediaStream);
    };
  });
</script>

<div class="space-y-2">
  {#if isRecording}
    <!-- Recording in progress -->
    <div class="rounded border-2 border-destructive bg-destructive/10 p-3">
      <!-- Video preview -->
      <div class="relative mb-2 overflow-hidden rounded bg-black">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          bind:this={videoPreviewEl}
          autoplay
          muted
          playsinline
          class="h-auto w-full"
          style="max-height: 180px; aspect-ratio: 16/9;"
        ></video>

        <!-- Recording indicator overlay -->
        <div class="absolute top-2 left-2 flex items-center gap-2 rounded bg-black/50 px-2 py-1">
          <div class="h-2 w-2 animate-pulse rounded-full bg-destructive"></div>
          <span class="text-xs font-medium text-white">Recording</span>
        </div>

        <!-- Duration overlay -->
        <div class="absolute top-2 right-2 rounded bg-black/50 px-2 py-1">
          <span class="font-mono text-xs text-white tabular-nums">
            {formatDuration(recordingDuration)}
          </span>
        </div>
      </div>

      <!-- Stop button -->
      <Button variant="destructive" size="sm" class="w-full" onclick={stopRecording}>
        <Square class="mr-1 size-3" />
        Stop Recording
      </Button>

      {#if recordingDuration >= MAX_DURATION - 10}
        <p class="mt-1 text-center text-xs text-destructive">
          {MAX_DURATION - recordingDuration}s remaining
        </p>
      {/if}
    </div>
  {:else if isUploading}
    <!-- Uploading -->
    <div class="rounded border bg-muted/30 p-3 text-center">
      <Loader2 class="mx-auto mb-2 size-6 animate-spin text-primary" />
      <span class="text-sm">Uploading video...</span>
    </div>
  {:else}
    <!-- Start recording button -->
    <Button variant="outline" size="sm" class="w-full text-xs" onclick={startRecording}>
      <Video class="mr-1 size-3" />
      Record Video
    </Button>
  {/if}

  <!-- Error message -->
  {#if recordingError}
    <p class="text-xs text-destructive">{recordingError}</p>
  {/if}
</div>

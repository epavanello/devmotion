<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Video, Square, Loader2, RotateCw } from '@lucide/svelte';
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
  let recordingStartTime = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;
  let videoPreviewEl: HTMLVideoElement | undefined = $state();
  let facingMode = $state<'user' | 'environment'>('user');

  const MAX_DURATION = 300; // 5 minutes in seconds

  async function startRecording() {
    try {
      recordingError = '';

      // Request camera and mic access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode
        },
        audio: audioEnabled
      });

      // Note: srcObject is set in the $effect below after video element is rendered

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
      recordingStartTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Calculate final precise duration (ensure it's never NaN)
        const elapsed = Date.now() - recordingStartTime;
        const finalDuration = recordingStartTime > 0 && elapsed > 0 ? elapsed / 1000 : 1;

        // Stop the stream
        stopMediaStream(mediaStream);
        mediaStream = null;

        // Create blob from chunks
        const videoBlob = new Blob(videoChunks, { type: mimeType });

        // Upload the recording with precise duration
        await uploadRecording(videoBlob, finalDuration);
      };

      mediaRecorder.start(1000); // Get chunks every second
      isRecording = true;

      // Update duration display (more frequently for smoother UI) and enforce max duration
      recordingInterval = setInterval(() => {
        recordingDuration = (Date.now() - recordingStartTime) / 1000;

        // Auto-stop at max duration
        if (recordingDuration >= MAX_DURATION) {
          stopRecording();
        }
      }, 100);
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

  async function uploadRecording(blob: Blob, duration: number) {
    isUploading = true;
    recordingError = '';

    try {
      const fileName = generateTimestampedFileName('video', 'webm');
      const result = await uploadMediaBlob(blob, fileName, 'video', projectId, duration);
      onRecordingComplete(result);
    } catch (err) {
      recordingError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      recordingDuration = 0;
    }
  }

  async function switchCamera() {
    if (!isRecording) return;

    // Toggle facing mode
    facingMode = facingMode === 'user' ? 'environment' : 'user';

    // Stop current recording
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;

      if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
      }
    }

    // Clean up current stream
    stopMediaStream(mediaStream);
    mediaStream = null;

    // Restart recording with new camera
    await startRecording();
  }

  // Reactively set srcObject when both video element and stream are ready
  $effect(() => {
    if (videoPreviewEl && mediaStream && isRecording) {
      videoPreviewEl.srcObject = mediaStream;
      // Explicitly play to ensure preview shows (autoplay isn't always reliable)
      videoPreviewEl.play().catch((err) => {
        console.warn('Preview autoplay failed:', err);
      });
    }
  });

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
            {formatDuration(Math.floor(recordingDuration))}
          </span>
        </div>

        <!-- Camera switch button -->
        <button
          type="button"
          class="absolute right-2 bottom-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          onclick={switchCamera}
          title="Switch camera"
        >
          <RotateCw class="size-4" />
        </button>
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

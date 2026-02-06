<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Camera, Loader2, RotateCw, Check, X } from '@lucide/svelte';
  import {
    uploadMediaBlob,
    generateTimestampedFileName,
    handleMediaError,
    stopMediaStream
  } from './media-upload-utils';

  interface Props {
    /** Callback when photo capture is complete and uploaded */
    onCaptureComplete: (result: { url: string; key: string; fileName: string }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
  }

  let { onCaptureComplete, projectId }: Props = $props();

  type State = 'idle' | 'preview' | 'review' | 'uploading';
  let state = $state<State>('idle');
  let captureError = $state('');
  let mediaStream: MediaStream | null = $state(null);
  let facingMode = $state<'user' | 'environment'>('user');
  let videoEl: HTMLVideoElement | undefined = $state();
  let canvasEl: HTMLCanvasElement | undefined = $state();
  let capturedImageUrl = $state(''); // Data URL for review

  async function startPreview() {
    try {
      captureError = '';

      // Request camera access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode
        },
        audio: false
      });

      // Show preview
      if (videoEl) {
        videoEl.srcObject = mediaStream;
      }

      state = 'preview';
    } catch (err) {
      const error = handleMediaError(err);
      captureError = error.message;
      console.error('Camera error:', err);
      state = 'idle';
    }
  }

  function capturePhoto() {
    if (!videoEl || !canvasEl) return;

    try {
      // Set canvas size to match video dimensions
      canvasEl.width = videoEl.videoWidth || 1920;
      canvasEl.height = videoEl.videoHeight || 1080;

      // Draw current video frame to canvas
      const ctx = canvasEl.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      // Convert canvas to data URL for preview
      capturedImageUrl = canvasEl.toDataURL('image/jpeg', 0.92);

      // Stop the camera stream
      stopMediaStream(mediaStream);
      mediaStream = null;

      // Move to review state
      state = 'review';
    } catch (err) {
      captureError = err instanceof Error ? err.message : 'Failed to capture photo';
      console.error('Capture error:', err);
    }
  }

  async function usePhoto() {
    if (!canvasEl) return;

    state = 'uploading';
    captureError = '';

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasEl!.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const fileName = generateTimestampedFileName('photo', 'jpg');
      const result = await uploadMediaBlob(blob, fileName, 'image', projectId);
      onCaptureComplete(result);

      // Reset state
      state = 'idle';
      capturedImageUrl = '';
    } catch (err) {
      captureError = err instanceof Error ? err.message : 'Upload failed';
      state = 'review'; // Stay in review to allow retry
    }
  }

  function retakePhoto() {
    capturedImageUrl = '';
    state = 'idle';
    startPreview();
  }

  function cancelPreview() {
    stopMediaStream(mediaStream);
    mediaStream = null;
    state = 'idle';
  }

  async function switchCamera() {
    // Toggle facing mode
    facingMode = facingMode === 'user' ? 'environment' : 'user';

    // Restart preview with new camera
    stopMediaStream(mediaStream);
    mediaStream = null;
    await startPreview();
  }

  // Cleanup on unmount
  $effect(() => {
    return () => {
      stopMediaStream(mediaStream);
      if (capturedImageUrl) {
        URL.revokeObjectURL(capturedImageUrl);
      }
    };
  });
</script>

<div class="space-y-2">
  {#if state === 'idle'}
    <!-- Take photo button -->
    <Button variant="outline" size="sm" class="w-full text-xs" onclick={startPreview}>
      <Camera class="mr-1 size-3" />
      Take Photo
    </Button>
  {:else if state === 'preview'}
    <!-- Camera preview -->
    <div class="rounded border-2 border-primary bg-black p-2">
      <!-- Video preview -->
      <div class="relative mb-2 overflow-hidden rounded">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          bind:this={videoEl}
          autoplay
          playsinline
          muted
          class="h-auto w-full"
          style="max-height: 240px;"
        ></video>

        <!-- Camera switch button (if supported) -->
        <button
          type="button"
          class="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          onclick={switchCamera}
          title="Switch camera"
        >
          <RotateCw class="size-4" />
        </button>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <Button variant="outline" size="sm" class="flex-1 text-xs" onclick={cancelPreview}>
          <X class="mr-1 size-3" />
          Cancel
        </Button>
        <Button variant="default" size="sm" class="flex-1 text-xs" onclick={capturePhoto}>
          <Camera class="mr-1 size-3" />
          Capture
        </Button>
      </div>
    </div>
  {:else if state === 'review'}
    <!-- Review captured photo -->
    <div class="rounded border-2 border-primary bg-black p-2">
      <!-- Captured image preview -->
      <div class="relative mb-2 overflow-hidden rounded">
        <img
          src={capturedImageUrl}
          alt="Captured"
          class="h-auto w-full"
          style="max-height: 240px;"
        />
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <Button variant="outline" size="sm" class="flex-1 text-xs" onclick={retakePhoto}>
          <RotateCw class="mr-1 size-3" />
          Retake
        </Button>
        <Button variant="default" size="sm" class="flex-1 text-xs" onclick={usePhoto}>
          <Check class="mr-1 size-3" />
          Use Photo
        </Button>
      </div>
    </div>
  {:else if state === 'uploading'}
    <!-- Uploading -->
    <div class="rounded border bg-muted/30 p-3 text-center">
      <Loader2 class="mx-auto mb-2 size-6 animate-spin text-primary" />
      <span class="text-sm">Uploading photo...</span>
    </div>
  {/if}

  <!-- Hidden canvas for capture -->
  <canvas bind:this={canvasEl} class="hidden"></canvas>

  <!-- Error message -->
  {#if captureError}
    <p class="text-xs text-destructive">{captureError}</p>
  {/if}
</div>

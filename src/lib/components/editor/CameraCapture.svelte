<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Camera, Loader2, RotateCw, Check, X } from '@lucide/svelte';
  import {
    uploadMediaBlob,
    generateTimestampedFileName,
    handleMediaError,
    stopMediaStream
  } from './media-upload-utils';
  import { getUser } from '$lib/functions/auth.remote';

  interface Props {
    /** Callback when photo capture is complete and uploaded */
    onCaptureComplete: (result: { url: string; key: string; fileName: string }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
  }

  let { onCaptureComplete, projectId }: Props = $props();

  const user = $derived(await getUser());

  type State = 'idle' | 'preview' | 'review' | 'uploading';
  let cameraState = $state<State>('idle');
  let captureError = $state('');
  let mediaStream: MediaStream | null = $state(null);
  let facingMode = $state<'user' | 'environment'>('user');
  let videoEl: HTMLVideoElement | undefined = $state();
  let canvasEl: HTMLCanvasElement | undefined = $state();
  let capturedImageUrl = $state(''); // Data URL for review

  async function startPreview() {
    try {
      captureError = '';

      // Require user login
      if (!user) {
        captureError = 'Please login to capture photos';
        return;
      }

      // Require projectId - user must save project before capturing
      if (!projectId || projectId.trim() === '') {
        captureError = 'Please save your project to the cloud before capturing photos';
        return;
      }

      // Request camera access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode
        },
        audio: false
      });

      cameraState = 'preview';
      // Note: srcObject is set in the $effect below after video element is rendered
    } catch (err) {
      const error = handleMediaError(err);
      captureError = error.message;
      console.error('Camera error:', err);
      cameraState = 'idle';
    }
  }

  // Reactively set srcObject when both video element and stream are ready
  $effect(() => {
    if (videoEl && mediaStream && cameraState === 'preview') {
      videoEl.srcObject = mediaStream;
      // Explicitly play to ensure preview shows (autoplay isn't always reliable)
      videoEl.play().catch((err) => {
        console.warn('Preview autoplay failed:', err);
      });
    }
  });

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
      cameraState = 'review';
    } catch (err) {
      captureError = err instanceof Error ? err.message : 'Failed to capture photo';
      console.error('Capture error:', err);
    }
  }

  async function usePhoto() {
    if (!canvasEl) return;

    cameraState = 'uploading';
    captureError = '';

    try {
      // Double-check projectId exists before upload
      if (!projectId || projectId.trim() === '') {
        throw new Error('Please save your project to the cloud before uploading photos');
      }

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
      cameraState = 'idle';
      capturedImageUrl = '';
    } catch (err) {
      captureError = err instanceof Error ? err.message : 'Upload failed';
      cameraState = 'review'; // Stay in review to allow retry
    }
  }

  function retakePhoto() {
    capturedImageUrl = '';
    cameraState = 'idle';
    startPreview();
  }

  function cancelPreview() {
    stopMediaStream(mediaStream);
    mediaStream = null;
    cameraState = 'idle';
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
  {#if cameraState === 'idle'}
    <!-- Take photo button -->
    <Button variant="outline" size="sm" class="w-full text-xs" onclick={startPreview}>
      <Camera class="mr-1 size-3" />
      Take Photo
    </Button>
  {:else if cameraState === 'preview'}
    <!-- Camera preview -->
    <div class="rounded border-2 border-primary bg-black p-2">
      <!-- Video preview -->
      <div class="relative mb-2 overflow-hidden rounded">
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
  {:else if cameraState === 'review'}
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
  {:else if cameraState === 'uploading'}
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

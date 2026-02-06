<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Mic, Square, Loader2 } from '@lucide/svelte';
  import {
    uploadMediaBlob,
    generateTimestampedFileName,
    formatDuration,
    handleMediaError,
    stopMediaStream
  } from './media-upload-utils';

  interface Props {
    /** Callback when recording is complete and uploaded */
    onRecordingComplete: (result: { url: string; key: string; fileName: string }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
  }

  let { onRecordingComplete, projectId }: Props = $props();

  let isRecording = $state(false);
  let isUploading = $state(false);
  let recordingError = $state('');
  let mediaRecorder: MediaRecorder | null = $state(null);
  let mediaStream: MediaStream | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  let recordingDuration = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;

  async function startRecording() {
    try {
      recordingError = '';
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunks = [];
      recordingDuration = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop the stream
        stopMediaStream(mediaStream);
        mediaStream = null;

        // Create blob from chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        // Upload the recording
        await uploadRecording(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;

      // Update duration display
      recordingInterval = setInterval(() => {
        recordingDuration += 1;
      }, 1000);
    } catch (err) {
      const error = handleMediaError(err);
      recordingError = error.message;
      console.error('Recording error:', err);
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
      const fileName = generateTimestampedFileName('recording', 'webm');
      const result = await uploadMediaBlob(blob, fileName, 'audio', projectId);
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
    <div class="rounded border-2 border-destructive bg-destructive/10 p-3 text-center">
      <div class="mb-2 flex items-center justify-center gap-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-destructive"></div>
        <span class="text-sm font-medium">Recording...</span>
      </div>
      <div class="mb-2 font-mono text-2xl tabular-nums">{formatDuration(recordingDuration)}</div>
      <Button variant="destructive" size="sm" onclick={stopRecording}>
        <Square class="mr-1 size-3" />
        Stop Recording
      </Button>
    </div>
  {:else if isUploading}
    <!-- Uploading -->
    <div class="rounded border bg-muted/30 p-3 text-center">
      <Loader2 class="mx-auto mb-2 size-6 animate-spin text-primary" />
      <span class="text-sm">Uploading recording...</span>
    </div>
  {:else}
    <!-- Start recording button -->
    <Button variant="outline" size="sm" class="w-full text-xs" onclick={startRecording}>
      <Mic class="mr-1 size-3" />
      Record Audio
    </Button>
  {/if}

  <!-- Error message -->
  {#if recordingError}
    <p class="text-xs text-destructive">{recordingError}</p>
  {/if}
</div>

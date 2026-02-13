<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Mic, Square, Loader2 } from '@lucide/svelte';
  import {
    uploadMediaBlob,
    generateTimestampedFileName,
    formatDuration,
    handleMediaError,
    getSupportedMimeType,
    stopMediaStream
  } from './media-upload-utils';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { getEditorState } from '$lib/contexts/editor.svelte';

  interface Props {
    /** Callback when recording is complete and uploaded */
    onRecordingComplete: (result: { url: string; key: string; fileName: string }) => void;
    /** Optional project ID for organizing uploads */
    projectId?: string;
  }

  let { onRecordingComplete, projectId }: Props = $props();
  const editorState = $derived(getEditorState());

  let isRecording = $state(false);
  let isUploading = $state(false);
  let recordingError = $state('');
  let mediaRecorder: MediaRecorder | null = $state(null);
  let mediaStream: MediaStream | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  let recordingDuration = $state(0);
  let recordingStartTime = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;

  async function startRecording() {
    try {
      recordingError = '';

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get supported mime type with fallback
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];

      const mimeType = await getSupportedMimeType(mimeTypes);
      if (!mimeType) {
        throw new Error('No supported audio codec found in your browser');
      }

      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType
      });

      audioChunks = [];
      recordingDuration = 0;
      recordingStartTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
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
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        // Upload the recording with precise duration
        await uploadRecording(audioBlob, finalDuration);
      };

      mediaRecorder.start();
      isRecording = true;

      // Update duration display (more frequently for smoother UI)
      recordingInterval = setInterval(() => {
        recordingDuration = (Date.now() - recordingStartTime) / 1000;
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

  async function handleStartRecording() {
    await uiStore.requireLogin('save your project', () => {
      uiStore.requireCreateProject(editorState, startRecording);
    });
  }

  async function uploadRecording(blob: Blob, duration: number) {
    isUploading = true;
    recordingError = '';

    try {
      const fileName = generateTimestampedFileName('recording', 'webm');
      const result = await uploadMediaBlob(blob, fileName, 'audio', projectId, duration);
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
      <div class="mb-2 font-mono text-2xl tabular-nums">
        {formatDuration(Math.floor(recordingDuration))}
      </div>
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
    <Button variant="default" size="sm" class="w-full text-xs" onclick={handleStartRecording}>
      <Mic class="mr-1 size-3" />
      Record Audio
    </Button>
  {/if}

  <!-- Error message -->
  {#if recordingError}
    <p class="text-xs text-destructive">{recordingError}</p>
  {/if}
</div>

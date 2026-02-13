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

  // UI state
  let displayDuration = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;
  let recordingStartTime = 0;

  async function startRecording() {
    try {
      recordingError = '';
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // STRICT: Only use M4A (AAC)
      const mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Your browser does not support M4A recording. Please use Safari.');
      }

      mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      audioChunks = [];
      displayDuration = 0;
      recordingStartTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopMediaStream(mediaStream);
        mediaStream = null;

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        await uploadWithDuration(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;

      // Update display
      recordingInterval = setInterval(() => {
        displayDuration = (Date.now() - recordingStartTime) / 1000;
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
   * Extract actual duration from M4A blob and upload
   */
  async function uploadWithDuration(blob: Blob) {
    isUploading = true;
    recordingError = '';

    try {
      const duration = await getBlobDuration(blob);
      const fileName = generateTimestampedFileName('recording', 'm4a');
      const result = await uploadMediaBlob(blob, fileName, 'audio', projectId, duration);
      onRecordingComplete(result);
    } catch (err) {
      recordingError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      displayDuration = 0;
    }
  }

  /**
   * Extract duration from audio blob
   */
  function getBlobDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 1);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(1);
      };
      audio.src = url;
    });
  }

  async function handleStartRecording() {
    await uiStore.requireLogin('save your project', () => {
      uiStore.requireCreateProject(editorState, startRecording);
    });
  }

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
    <div class="rounded border-2 border-destructive bg-destructive/10 p-3 text-center">
      <div class="mb-2 flex items-center justify-center gap-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-destructive"></div>
        <span class="text-sm font-medium">Recording...</span>
      </div>
      <div class="mb-2 font-mono text-2xl tabular-nums">
        {formatDuration(Math.floor(displayDuration))}
      </div>
      <Button variant="destructive" size="sm" onclick={stopRecording}>
        <Square class="mr-1 size-3" />
        Stop Recording
      </Button>
    </div>
  {:else if isUploading}
    <div class="rounded border bg-muted/30 p-3 text-center">
      <Loader2 class="mx-auto mb-2 size-6 animate-spin text-primary" />
      <span class="text-sm">Uploading recording...</span>
    </div>
  {:else}
    <Button variant="default" size="sm" class="w-full text-xs" onclick={handleStartRecording}>
      <Mic class="mr-1 size-3" />
      Record Audio
    </Button>
  {/if}
  {#if recordingError}
    <p class="text-xs text-destructive">{recordingError}</p>
  {/if}
</div>

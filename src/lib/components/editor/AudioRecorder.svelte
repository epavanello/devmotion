<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Mic, Square, Loader2 } from '@lucide/svelte';

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
  let audioChunks: Blob[] = $state([]);
  let recordingDuration = $state(0);
  let recordingInterval: ReturnType<typeof setInterval> | null = null;

  async function startRecording() {
    try {
      recordingError = '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream, {
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
        stream.getTracks().forEach((track) => track.stop());

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
      recordingError =
        err instanceof Error ? err.message : 'Failed to access microphone. Please allow access.';
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${timestamp}.webm`;

      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('mediaType', 'audio');
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
        onRecordingComplete({
          url: data.file.url,
          key: data.file.key,
          fileName: data.file.originalName
        });
      }
    } catch (err) {
      recordingError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      recordingDuration = 0;
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
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

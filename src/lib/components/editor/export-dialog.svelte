<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Progress } from '$lib/components/ui/progress';
  import { projectStore } from '$lib/stores/project.svelte';
  import { VideoCapture } from '$lib/utils/video-capture';
  import { Loader2, AlertCircle, Monitor, Server } from '@lucide/svelte';

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getCanvasElement: () => HTMLDivElement | undefined;
    isRecording?: boolean;
    projectId?: string | null;
  }

  let {
    open,
    onOpenChange,
    getCanvasElement,
    isRecording = $bindable(false),
    projectId = null
  }: Props = $props();

  type ExportMode = 'browser' | 'server';

  let isExporting = $state(false);
  let isConverting = $state(false);
  let isPreparing = $state(false);
  let exportProgress = $state(0);
  let errorMessage = $state<string | null>(null);
  let videoCapture = new VideoCapture();
  let serverExportAbortController = $state<AbortController | null>(null);

  let exportSettings = $derived({
    format: 'webm',
    fps: projectStore.state.fps,
    width: projectStore.state.width,
    height: projectStore.state.height
  });

  let exportMode = $derived<ExportMode>(projectId ? 'server' : 'browser');

  // Server export requires saved project
  const canUseServerExport = $derived(!!projectId);

  let serverPhase = $state<'initializing' | 'capturing' | 'encoding' | 'done' | 'error' | 'ready'>(
    'ready'
  );

  async function handleExport() {
    if (exportMode === 'server' && canUseServerExport) {
      await handleServerExport();
    } else {
      await handleBrowserExport();
    }
  }

  async function handleServerExport() {
    if (!projectId) {
      errorMessage = 'Please save the project first to use server-side export.';
      return;
    }

    const renderId = crypto.randomUUID();
    isExporting = true;
    exportProgress = 0;
    errorMessage = null;
    serverPhase = 'initializing';

    // Start SSE for progress
    const eventSource = new EventSource(`/api/export/${projectId}?renderId=${renderId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        exportProgress = data.percent;
        serverPhase = data.phase;

        if (data.phase === 'done' || data.phase === 'error') {
          eventSource.close();
          if (data.phase === 'error') {
            errorMessage = data.error || 'Server export failed.';
          }
        }
      } catch (err) {
        console.error('Error parsing SSE:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection failed');
      errorMessage = 'Lost connection to render progress. The export might still be processing.';
      eventSource.close();
    };

    try {
      serverExportAbortController = new AbortController();
      const response = await fetch(`/api/export/${projectId}?renderId=${renderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: exportSettings.width,
          height: exportSettings.height,
          fps: exportSettings.fps
        }),
        signal: serverExportAbortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Export failed with status ${response.status}`);
      }

      // In a streaming response, we have to read it as a blob if we want to trigger a download window
      const blob = await response.blob();
      const filename = `${projectStore.state.name || 'video'}.mp4`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Server export failed:', error);
      errorMessage =
        error instanceof Error ? error.message : 'Server export failed. Please try again.';
      serverPhase = 'error';
    } finally {
      eventSource.close();
      isExporting = false;
      exportProgress = 0;
      serverExportAbortController = null;
    }
  }

  async function handleBrowserExport() {
    isExporting = true;
    exportProgress = 0;
    errorMessage = null;

    // Check browser support
    if (!VideoCapture.isSupported()) {
      errorMessage =
        'Video capture APIs are not supported in this browser. Please use Chrome 104+ on desktop.';
      isExporting = false;
      return;
    }

    const canvasElement = getCanvasElement();
    if (!canvasElement) {
      errorMessage = 'Canvas element not found. Please try again.';
      isExporting = false;
      return;
    }

    // Store original viewport state
    const originalZoom = projectStore.viewport.zoom;
    const originalPan = { ...projectStore.viewport.pan };

    try {
      // Stop playback if running
      projectStore.pause();

      // Reset timeline to beginning
      projectStore.setCurrentTime(0);

      // Reset viewport to default (zoom 1, no pan) for cleaner capture
      projectStore.setZoom(1);
      projectStore.setPan(0, 0);

      // Prepare frame cache for optimized recording
      isPreparing = true;

      // Wait for the UI to update with new viewport
      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 300)),
        projectStore.prepareRecording()
      ]);
      isPreparing = false;

      // Close the dialog and enable recording mode
      onOpenChange(false);
      isRecording = true;
      projectStore.isRecording = true;

      // Wait for UI to switch to recording mode
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start video capture (this will request screen permission)
      await videoCapture.startCapture(canvasElement, {
        width: exportSettings.width,
        height: exportSettings.height,
        fps: exportSettings.fps,
        duration: projectStore.state.duration,
        onReadyToRecord: () => {
          // Start playback synchronized with recording
          projectStore.play();

          // Monitor playback and stop recording when it ends
          const checkInterval = setInterval(() => {
            if (!projectStore.isPlaying && isExporting) {
              clearInterval(checkInterval);
              videoCapture.stopCapture();
            }
          }, 100);
        },
        onProgress: (progress) => {
          exportProgress = progress;
        },
        onComplete: async (blob) => {
          // Convert to MP4
          isConverting = true;
          exportProgress = 0;
          onOpenChange(true); // Reopen dialog to show conversion progress

          try {
            // Download the video
            const filename = `${projectStore.state.name || 'video'}.mp4`;
            VideoCapture.downloadBlob(blob, filename);

            // Close dialog after successful export
            onOpenChange(false);
          } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Failed to convert video to MP4';
          }

          // Reset timeline and restore viewport
          projectStore.setCurrentTime(0);
          projectStore.setZoom(originalZoom);
          projectStore.setPan(originalPan.x, originalPan.y);

          // Reset state and clear cache
          isExporting = false;
          isConverting = false;
          isRecording = false;
          projectStore.isRecording = false;
          projectStore.clearFrameCache();
          exportProgress = 0;
        },
        onError: (error) => {
          errorMessage = error.message || 'An error occurred during export';
          projectStore.pause();
          projectStore.setCurrentTime(0);
          projectStore.setZoom(originalZoom);
          projectStore.setPan(originalPan.x, originalPan.y);

          isExporting = false;
          isRecording = false;
          projectStore.isRecording = false;
          projectStore.clearFrameCache();
          exportProgress = 0;
          onOpenChange(true);
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      errorMessage = error instanceof Error ? error.message : 'Export failed. Please try again.';
      projectStore.pause();
      projectStore.setCurrentTime(0);

      // Restore original viewport
      projectStore.setZoom(originalZoom);
      projectStore.setPan(originalPan.x, originalPan.y);

      isExporting = false;
      isPreparing = false;
      isRecording = false;
      projectStore.isRecording = false;
      projectStore.clearFrameCache();
      exportProgress = 0;

      // Reopen dialog to show error
      onOpenChange(true);
    }
  }

  function handleCancel() {
    if (isExporting) {
      if (exportMode === 'server') {
        serverExportAbortController?.abort();
      } else {
        videoCapture.stopCapture();
      }

      projectStore.pause();
      projectStore.setCurrentTime(0);

      isExporting = false;
      isPreparing = false;
      isRecording = false;
      projectStore.isRecording = false;
      projectStore.clearFrameCache();
      exportProgress = 0;
    }
    onOpenChange(false);
  }
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent class="sm:max-w-106.25">
    <DialogHeader>
      <DialogTitle>Export Video</DialogTitle>
      <DialogDescription>
        Configure your video export settings. The animation will play and be captured as a video.
      </DialogDescription>
    </DialogHeader>

    {#if errorMessage}
      <div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
        <div>{errorMessage}</div>
      </div>
    {/if}

    {#if isConverting}
      <div class="space-y-4 py-8">
        <div class="flex items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
        <div class="space-y-2">
          <div class="text-center text-sm text-muted-foreground">
            Converting to MP4... Please wait.
          </div>
          <Progress value={exportProgress} class="w-full" />
          <div class="text-center text-xs text-muted-foreground">
            {Math.round(exportProgress)}%
          </div>
        </div>
      </div>
    {:else if !isExporting}
      <div class="grid gap-4 py-4">
        <!-- Export Mode Selection -->
        <div class="space-y-3">
          <Label>Export Method</Label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              onclick={() => canUseServerExport && (exportMode = 'server')}
              disabled={!canUseServerExport}
              class="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 {exportMode ===
              'server'
                ? 'border-primary bg-primary/5'
                : ''}"
            >
              <div class="flex items-center gap-2">
                <Server class="h-4 w-4" />
                <span class="font-medium">Server (HQ)</span>
              </div>
              <span class="text-xs text-muted-foreground">
                {#if canUseServerExport}
                  High quality, no frame drops
                {:else}
                  Save project first
                {/if}
              </span>
            </button>
            <button
              type="button"
              onclick={() => (exportMode = 'browser')}
              class="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 {exportMode ===
              'browser'
                ? 'border-primary bg-primary/5'
                : ''}"
            >
              <div class="flex items-center gap-2">
                <Monitor class="h-4 w-4" />
                <span class="font-medium">Browser</span>
              </div>
              <span class="text-xs text-muted-foreground">Screen capture, may have artifacts</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="export-fps" class="text-right">FPS</Label>
          <Input
            id="export-fps"
            type="number"
            value={exportSettings.fps}
            class="col-span-3"
            readonly
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="export-width" class="text-right">Width</Label>
          <Input
            id="export-width"
            type="number"
            value={exportSettings.width}
            class="col-span-3"
            readonly
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="export-height" class="text-right">Height</Label>
          <Input
            id="export-height"
            type="number"
            bind:value={exportSettings.height}
            class="col-span-3"
          />
        </div>

        {#if exportMode === 'browser'}
          <div class="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p class="mb-1 font-medium">Instructions:</p>
            <ol class="list-inside list-decimal space-y-1">
              <li>Click Export to start the capture</li>
              <li>Select "This tab" when prompted by the browser</li>
              <li>The animation will play and be recorded</li>
            </ol>
          </div>
        {:else}
          <div class="rounded-md bg-primary/10 p-3 text-xs text-primary">
            <p class="font-medium">Server-side rendering</p>
            <p class="mt-1 text-muted-foreground">
              The video will be rendered on the server with perfect frame accuracy. This may take a
              few moments.
            </p>
          </div>
        {/if}
      </div>

      <DialogFooter>
        <Button variant="outline" onclick={handleCancel}>Cancel</Button>
        <Button onclick={handleExport}>Export</Button>
      </DialogFooter>
    {:else}
      <div class="space-y-4 py-8">
        <div class="flex items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
        <div class="space-y-2">
          <div class="text-center text-sm text-muted-foreground">
            {#if isPreparing}
              Preparing frames for recording...
            {:else if exportMode === 'server'}
              {#if serverPhase === 'initializing'}
                Initializing render engine...
              {:else if serverPhase === 'capturing'}
                Capturing animation frames...
              {:else if serverPhase === 'encoding'}
                Encoding high-quality video...
              {:else if serverPhase === 'done'}
                Download starting...
              {:else}
                Rendering video...
              {/if}
            {:else}
              Recording video... Please wait.
            {/if}
          </div>
          <Progress
            value={isPreparing ? projectStore.preparingProgress : exportProgress}
            class="w-full"
          />
          <div class="text-center text-xs text-muted-foreground">
            {Math.round(isPreparing ? projectStore.preparingProgress : exportProgress)}%
          </div>
        </div>
        <div class="text-center">
          <Button variant="outline" size="sm" onclick={handleCancel}>Cancel</Button>
        </div>
      </div>
    {/if}
  </DialogContent>
</Dialog>

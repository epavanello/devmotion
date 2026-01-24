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
  import { Loader2, AlertCircle } from 'lucide-svelte';

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getCanvasElement: () => HTMLDivElement | undefined;
    isRecording?: boolean;
  }

  let { open, onOpenChange, getCanvasElement, isRecording = $bindable(false) }: Props = $props();

  let isExporting = $state(false);
  let exportProgress = $state(0);
  let errorMessage = $state<string | null>(null);
  let videoCapture = new VideoCapture();

  let exportSettings = $derived({
    format: 'webm',
    fps: projectStore.project.fps,
    width: projectStore.project.width,
    height: projectStore.project.height
  });

  async function handleExport() {
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
      // Reset timeline to beginning
      projectStore.setCurrentTime(0);

      // Reset viewport to default (zoom 1, no pan) for cleaner capture
      projectStore.setZoom(1);
      projectStore.setPan(0, 0);

      // Wait for the UI to update with new viewport
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Close the dialog to avoid capturing it
      onOpenChange(false);
      isRecording = true;
      projectStore.isRecording = true;

      // Wait for dialog to close and UI to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start video capture (this will request screen permission)
      await videoCapture.startCapture(canvasElement, {
        width: exportSettings.width,
        height: exportSettings.height,
        fps: exportSettings.fps,
        duration: projectStore.project.duration,
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
        onComplete: (blob) => {
          // Download the video
          const filename = `${projectStore.project.name || 'video'}.webm`;
          VideoCapture.downloadBlob(blob, filename);

          // Reset timeline and restore viewport
          projectStore.setCurrentTime(0);
          projectStore.setZoom(originalZoom);
          projectStore.setPan(originalPan.x, originalPan.y);

          // Reset state
          isExporting = false;
          isRecording = false;
          projectStore.isRecording = false;
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
          exportProgress = 0;
          onOpenChange(true);
        }
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      errorMessage = error.message || 'Export failed. Please try again.';
      projectStore.pause();
      projectStore.setCurrentTime(0);

      // Restore original viewport
      projectStore.setZoom(originalZoom);
      projectStore.setPan(originalPan.x, originalPan.y);

      isExporting = false;
      isRecording = false;
      projectStore.isRecording = false;
      exportProgress = 0;

      // Reopen dialog to show error
      onOpenChange(true);
    }
  }

  function handleCancel() {
    if (isExporting) {
      videoCapture.stopCapture();
      projectStore.pause();
      projectStore.setCurrentTime(0);

      // Try to restore viewport (may not have been saved yet)
      try {
        const zoom = projectStore.viewport.zoom;
        if (zoom !== 1) {
          // Viewport was already modified, leave it
        } else {
          // Could restore here if we track state differently
        }
      } catch (e) {
        // Ignore
      }

      isExporting = false;
      isRecording = false;
      projectStore.isRecording = false;
      exportProgress = 0;
    }
    onOpenChange(false);
  }
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Export Video</DialogTitle>
      <DialogDescription>
        Configure your video export settings. The animation will play and be captured as a video.
      </DialogDescription>
    </DialogHeader>

    {#if errorMessage}
      <div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>{errorMessage}</div>
      </div>
    {/if}

    {#if !isExporting}
      <div class="grid gap-4 py-4">
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

        <div class="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p class="mb-1 font-medium">Instructions:</p>
          <ol class="list-inside list-decimal space-y-1">
            <li>Click Export to start the capture</li>
            <li>Select "This tab" when prompted by the browser</li>
            <li>The animation will play and be recorded</li>
          </ol>
        </div>
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
            Recording video... Please wait.
          </div>
          <Progress value={exportProgress} class="w-full" />
          <div class="text-center text-xs text-muted-foreground">
            {Math.round(exportProgress)}%
          </div>
        </div>
        <div class="text-center">
          <Button variant="outline" size="sm" onclick={handleCancel}>Cancel</Button>
        </div>
      </div>
    {/if}
  </DialogContent>
</Dialog>

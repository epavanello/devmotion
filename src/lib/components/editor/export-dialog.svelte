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
  import { Loader2 } from 'lucide-svelte';

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: () => Promise<void>;
  }

  let { open, onOpenChange, onExport }: Props = $props();

  let isExporting = $state(false);
  let exportProgress = $state(0);
  let exportSettings = $state({
    format: 'mp4',
    quality: 'medium',
    fps: projectStore.project.fps,
    width: projectStore.project.width,
    height: projectStore.project.height
  });

  async function handleExport() {
    isExporting = true;
    exportProgress = 0;

    try {
      await onExport();
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      isExporting = false;
      exportProgress = 0;
    }
  }
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Export Video</DialogTitle>
      <DialogDescription>
        Configure your video export settings. This may take a few minutes depending on the duration.
      </DialogDescription>
    </DialogHeader>

    {#if !isExporting}
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="export-fps" class="text-right">FPS</Label>
          <Input id="export-fps" type="number" bind:value={exportSettings.fps} class="col-span-3" />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="export-width" class="text-right">Width</Label>
          <Input
            id="export-width"
            type="number"
            bind:value={exportSettings.width}
            class="col-span-3"
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
      </div>

      <DialogFooter>
        <Button variant="outline" onclick={() => onOpenChange(false)}>Cancel</Button>
        <Button onclick={handleExport}>Export</Button>
      </DialogFooter>
    {:else}
      <div class="space-y-4 py-8">
        <div class="flex items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
        <div class="space-y-2">
          <div class="text-center text-sm text-muted-foreground">
            Exporting video... This may take a while.
          </div>
          <Progress value={exportProgress} class="w-full" />
          <div class="text-center text-xs text-muted-foreground">
            {Math.round(exportProgress)}%
          </div>
        </div>
      </div>
    {/if}
  </DialogContent>
</Dialog>

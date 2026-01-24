<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import {
    Play,
    Pause,
    SkipBack,
    Type,
    Square,
    Circle,
    Triangle,
    Download,
    Upload,
    Save,
    FileText,
    Layers,
    Fullscreen
  } from 'lucide-svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { createTextLayer, createShapeLayer } from '$lib/engine/layer-factory';
  import ExportDialog from './export-dialog.svelte';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '$lib/components/ui/dropdown-menu';

  interface Props {
    getCanvasElement: () => HTMLDivElement | undefined;
    isRecording?: boolean;
  }

  let { getCanvasElement, isRecording = $bindable(false) }: Props = $props();

  let showExportDialog = $state(false);

  function togglePlayback() {
    if (projectStore.isPlaying) {
      projectStore.pause();
    } else {
      projectStore.play();
    }
  }

  function resetPlayhead() {
    projectStore.setCurrentTime(0);
    projectStore.pause();
  }

  function addTextLayer() {
    const layer = createTextLayer(0, 0);
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addShapeLayer(shapeType: 'rectangle' | 'circle' | 'triangle') {
    const layer = createShapeLayer(shapeType, 0, 0);
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function saveProject() {
    const json = projectStore.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectStore.project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          projectStore.importFromJSON(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  function newProject() {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      projectStore.newProject();
    }
  }

  function openExportDialog() {
    showExportDialog = true;
  }
</script>

<div class="flex items-center gap-2 bg-muted/50 p-2">
  <!-- DevMotion Branding -->
  <div class="flex items-center gap-2 pl-2">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
    >
      <Fullscreen class="h-5 w-5 text-white" />
    </div>
    <span class="hidden font-bold text-foreground sm:inline">DevMotion</span>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Project Actions -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={newProject} disabled={isRecording}>
      <FileText class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={saveProject} disabled={isRecording}>
      <Save class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={loadProject} disabled={isRecording}>
      <Upload class="h-4 w-4" />
    </Button>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Playback Controls -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={resetPlayhead} disabled={isRecording}>
      <SkipBack class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={togglePlayback} disabled={isRecording}>
      {#if projectStore.isPlaying}
        <Pause class="h-4 w-4" />
      {:else}
        <Play class="h-4 w-4" />
      {/if}
    </Button>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Creation Tools -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={addTextLayer} disabled={isRecording}>
      <Type class="h-4 w-4" />
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger disabled={isRecording}>
        <Button variant="ghost" size="sm" disabled={isRecording}>
          <Layers class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onclick={() => addShapeLayer('rectangle')}>
          <Square class="mr-2 h-4 w-4" />
          Rectangle
        </DropdownMenuItem>
        <DropdownMenuItem onclick={() => addShapeLayer('circle')}>
          <Circle class="mr-2 h-4 w-4" />
          Circle
        </DropdownMenuItem>
        <DropdownMenuItem onclick={() => addShapeLayer('triangle')}>
          <Triangle class="mr-2 h-4 w-4" />
          Triangle
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <div class="flex-1"></div>

  <!-- Export -->
  <Button variant="default" size="sm" onclick={openExportDialog} disabled={isRecording}>
    <Download class="mr-2 h-4 w-4" />
    Export Video
  </Button>

  {#if isRecording}
    <div
      class="flex animate-pulse items-center gap-2 rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white"
    >
      <span class="h-2 w-2 rounded-full bg-white"></span>
      Recording...
    </div>
  {/if}
</div>

<ExportDialog
  open={showExportDialog}
  onOpenChange={(open) => (showExportDialog = open)}
  {getCanvasElement}
  bind:isRecording
/>

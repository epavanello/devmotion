<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Type,
    Square,
    Circle,
    Triangle,
    Image,
    Download,
    Upload,
    Save,
    FileText,
    Grid3x3,
    Layers
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
    const layer = createTextLayer(projectStore.project.width / 2, projectStore.project.height / 2);
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addShapeLayer(shapeType: 'rectangle' | 'circle' | 'triangle') {
    const layer = createShapeLayer(
      shapeType,
      projectStore.project.width / 2,
      projectStore.project.height / 2
    );
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

  function toggleGrid() {
    projectStore.toggleGrid();
  }

  function openExportDialog() {
    showExportDialog = true;
  }

  async function handleExport() {
    // For now, just export JSON since video export requires canvas access
    // This will be properly implemented when integrated with the canvas component
    alert(
      'Video export feature will be available soon. For now, use Save Project to export as JSON.'
    );
  }
</script>

<div class="flex items-center gap-2 bg-muted/50 p-2">
  <!-- Project Actions -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={newProject}>
      <FileText class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={saveProject}>
      <Save class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={loadProject}>
      <Upload class="h-4 w-4" />
    </Button>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Playback Controls -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={resetPlayhead}>
      <SkipBack class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={togglePlayback}>
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
    <Button variant="ghost" size="sm" onclick={addTextLayer}>
      <Type class="h-4 w-4" />
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm">
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

  <!-- View Controls -->
  <div class="flex items-center gap-1">
    <Button
      variant={projectStore.viewport.showGrid ? 'secondary' : 'ghost'}
      size="sm"
      onclick={toggleGrid}
    >
      <Grid3x3 class="h-4 w-4" />
    </Button>
  </div>

  <div class="flex-1"></div>

  <!-- Export -->
  <Button variant="default" size="sm" onclick={openExportDialog}>
    <Download class="mr-2 h-4 w-4" />
    Export Video
  </Button>
</div>

<ExportDialog
  open={showExportDialog}
  onOpenChange={(open) => (showExportDialog = open)}
  onExport={handleExport}
/>

<script lang="ts">
  import Toolbar from './toolbar.svelte';
  import Canvas from './canvas/canvas.svelte';
  import Timeline from './timeline/timeline.svelte';
  import LayersPanel from './panels/layers-panel.svelte';
  import PropertiesPanel from './panels/properties-panel.svelte';
  import KeyboardHandler from './keyboard-handler.svelte';
  import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib/components/ui/resizable';
  import { projectStore } from '$lib/stores/project.svelte';

  interface Props {
    projectId?: string | null;
    isOwner?: boolean;
    canEdit?: boolean;
    isPublic?: boolean;
  }

  let { projectId = null, isOwner = true, canEdit = true, isPublic = false }: Props = $props();

  let projectViewport: HTMLDivElement | undefined = $state();
</script>

<KeyboardHandler />

<div class="flex h-screen w-full flex-col bg-background">
  <!-- Toolbar -->
  <Toolbar getCanvasElement={() => projectViewport} {projectId} {isOwner} {canEdit} {isPublic} />

  <!-- Main Content Area -->
  <div class="flex-1 overflow-hidden">
    <ResizablePaneGroup direction="horizontal" class="h-full">
      <!-- Left Panel - Layers -->
      <ResizablePane defaultSize={20} minSize={15} maxSize={30}>
        <LayersPanel />
      </ResizablePane>

      <ResizableHandle />

      <!-- Center - Canvas and Timeline -->
      <ResizablePane defaultSize={60} minSize={40}>
        <ResizablePaneGroup direction="vertical">
          <!-- Canvas -->
          <ResizablePane defaultSize={70} minSize={30}>
            <Canvas bind:projectViewport isRecording={projectStore.isRecording} />
          </ResizablePane>

          <ResizableHandle />

          <!-- Timeline -->
          <ResizablePane defaultSize={30} minSize={20}>
            {#if !projectStore.isRecording}
              <Timeline />
            {/if}
          </ResizablePane>
        </ResizablePaneGroup>
      </ResizablePane>

      <ResizableHandle />

      <!-- Right Panel - Properties -->
      <ResizablePane defaultSize={20} minSize={15} maxSize={30}>
        {#if !projectStore.isRecording}
          <PropertiesPanel />
        {/if}
      </ResizablePane>
    </ResizablePaneGroup>
  </div>
</div>

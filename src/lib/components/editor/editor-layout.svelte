<script lang="ts">
  import Toolbar from './toolbar.svelte';
  import Canvas from './canvas/canvas.svelte';
  import Timeline from './timeline/timeline.svelte';
  import LayersPanel from './panels/layers-panel.svelte';
  import PropertiesPanel from './panels/properties-panel.svelte';
  import KeyboardHandler from './keyboard-handler.svelte';
  import WelcomeOverlay from './welcome-overlay.svelte';
  import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib/components/ui/resizable';
</script>

<KeyboardHandler />
<WelcomeOverlay />

<div class="flex h-screen w-full flex-col bg-background">
  <!-- Toolbar -->
  <div class="border-b">
    <Toolbar />
  </div>

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
            <Canvas />
          </ResizablePane>

          <ResizableHandle />

          <!-- Timeline -->
          <ResizablePane defaultSize={30} minSize={20}>
            <Timeline />
          </ResizablePane>
        </ResizablePaneGroup>
      </ResizablePane>

      <ResizableHandle />

      <!-- Right Panel - Properties -->
      <ResizablePane defaultSize={20} minSize={15} maxSize={30}>
        <PropertiesPanel />
      </ResizablePane>
    </ResizablePaneGroup>
  </div>
</div>

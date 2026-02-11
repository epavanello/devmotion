<script lang="ts">
  import Toolbar from './toolbar.svelte';
  import Canvas from './canvas/canvas.svelte';
  import Timeline from './timeline/timeline.svelte';
  import LayersPanel from './panels/layers-panel.svelte';
  import PropertiesPanel from './panels/properties-panel.svelte';
  import Panel from './panels/panel.svelte';
  import KeyboardHandler from './keyboard-handler.svelte';
  import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib/components/ui/resizable';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Layers, Settings, Clock, Sparkles } from '@lucide/svelte';
  import AiChat from '$lib/components/ai/ai-chat.svelte';
  import ModelSelector from '$lib/components/ai/model-selector.svelte';
  import { DEFAULT_MODEL_ID } from '$lib/ai/models';
  import AddLayer from './panels/add-layer.svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';

  interface Props {
    projectId?: string | null;
    isOwner?: boolean;
    canEdit?: boolean;
    isPublic?: boolean;
    isMcp?: boolean;
  }

  let {
    projectId = null,
    isOwner = true,
    canEdit = true,
    isPublic = false,
    isMcp = false
  }: Props = $props();

  let projectViewport: HTMLDivElement | undefined = $state();
  const mediaQuery = new IsMobile();
  const isMobile = $derived(mediaQuery.current);
  const isRecording = $derived(projectStore.isRecording);

  // AI Chat model selection
  let aiChatModelId = $state(DEFAULT_MODEL_ID);

  // Mobile panel state - start with all closed
  let openPanels = $state({
    aiChat: false,
    layers: false,
    timeline: false,
    properties: false
  });
</script>

{#snippet canvasSection()}
  <Canvas bind:projectViewport {isRecording} />
{/snippet}

<KeyboardHandler />

<div class="flex h-screen w-full flex-col bg-background">
  <!-- Toolbar -->
  <Toolbar
    getCanvasElement={() => projectViewport}
    {projectId}
    {isOwner}
    {canEdit}
    {isPublic}
    {isMcp}
    {isMobile}
  />

  <!-- Main Content Area -->
  <div class="flex-1 overflow-hidden">
    {#if isMobile}
      <!-- Mobile Layout: Sticky collapsible panels -->
      <div class="flex h-full flex-col overflow-y-auto">
        <!-- Canvas fisso in alto - sempre visibile -->
        <div
          class="sticky shrink-0 border-b bg-muted/20"
          style="top: 0; z-index: 50; height: 40vh;"
        >
          {@render canvasSection()}
        </div>

        <!-- AI Chat Panel -->
        <Panel
          title="AI Chat"
          icon={Sparkles}
          collapsible={true}
          isOpen={openPanels.aiChat}
          onToggle={() => (openPanels.aiChat = !openPanels.aiChat)}
          topOffset="calc(40vh)"
          zIndex={10}
        >
          {#snippet content()}
            <AiChat bind:selectedModelId={aiChatModelId} />
          {/snippet}
          {#snippet actionsSnippet()}
            <ModelSelector
              selectedModelId={aiChatModelId}
              onModelChange={(id) => (aiChatModelId = id)}
            />
          {/snippet}
        </Panel>

        <!-- Layers Panel -->
        <Panel
          title="Layers ({projectStore.state.layers.length})"
          icon={Layers}
          actionsComponent={AddLayer}
          collapsible={true}
          isOpen={openPanels.layers}
          onToggle={() => (openPanels.layers = !openPanels.layers)}
          topOffset="calc(40vh)"
          zIndex={20}
        >
          {#snippet content()}
            <LayersPanel />
          {/snippet}
        </Panel>

        {#if !isRecording}
          <!-- Timeline Panel -->
          <Panel
            title="Timeline"
            icon={Clock}
            collapsible={true}
            isOpen={openPanels.timeline}
            onToggle={() => (openPanels.timeline = !openPanels.timeline)}
            topOffset="calc(40vh)"
            zIndex={30}
          >
            {#snippet content()}
              <Timeline />
            {/snippet}
            {#snippet actionsSnippet()}
              <span class="text-xs text-muted-foreground">
                {projectStore.currentTime.toFixed(2)}s / {projectStore.state.duration}s
              </span>
            {/snippet}
          </Panel>

          <!-- Properties Panel -->
          <Panel
            title="Properties"
            icon={Settings}
            collapsible={true}
            isOpen={openPanels.properties}
            onToggle={() => (openPanels.properties = !openPanels.properties)}
            topOffset="calc(40vh)"
            zIndex={40}
          >
            {#snippet content()}
              <PropertiesPanel />
            {/snippet}
          </Panel>
        {/if}

        <!-- Spazio extra per permettere lo scroll completo -->
        <div style="height: 40vh"></div>
      </div>
    {:else}
      <!-- Desktop Layout: Resizable panes -->
      <ResizablePaneGroup direction="horizontal" class="h-full">
        <!-- Left Panel: Layers and AI Chat -->
        <ResizablePane defaultSize={25} minSize={15} maxSize={30}>
          <ResizablePaneGroup direction="vertical">
            <ResizablePane defaultSize={60} minSize={30}>
              <Panel
                title="Layers ({projectStore.state.layers.length})"
                actionsComponent={AddLayer}
              >
                {#snippet content()}
                  <LayersPanel />
                {/snippet}
              </Panel>
            </ResizablePane>
            <ResizableHandle />
            <ResizablePane defaultSize={40} minSize={20}>
              <Panel title="AI Chat">
                {#snippet content()}
                  <AiChat bind:selectedModelId={aiChatModelId} />
                {/snippet}
                {#snippet actionsSnippet()}
                  <ModelSelector
                    selectedModelId={aiChatModelId}
                    onModelChange={(id) => (aiChatModelId = id)}
                  />
                {/snippet}
              </Panel>
            </ResizablePane>
          </ResizablePaneGroup>
        </ResizablePane>

        <ResizableHandle />

        <!-- Center: Canvas and Timeline -->
        <ResizablePane defaultSize={60} minSize={40}>
          <ResizablePaneGroup direction="vertical">
            <ResizablePane defaultSize={70} minSize={30}>
              {@render canvasSection()}
            </ResizablePane>

            <ResizableHandle />

            <ResizablePane defaultSize={30} minSize={20}>
              {#if !isRecording}
                <Panel title="Timeline" disableScroll={true}>
                  {#snippet content()}
                    <Timeline />
                  {/snippet}
                  {#snippet actionsSnippet()}
                    <span class="text-xs text-muted-foreground">
                      {projectStore.currentTime.toFixed(2)}s / {projectStore.state.duration}s
                    </span>
                  {/snippet}
                </Panel>
              {/if}
            </ResizablePane>
          </ResizablePaneGroup>
        </ResizablePane>

        <ResizableHandle />

        <!-- Right Panel: Properties -->
        <ResizablePane defaultSize={25} minSize={15} maxSize={30}>
          {#if !isRecording}
            <Panel title="Properties">
              {#snippet content()}
                <PropertiesPanel />
              {/snippet}
            </Panel>
          {/if}
        </ResizablePane>
      </ResizablePaneGroup>
    {/if}
  </div>
</div>

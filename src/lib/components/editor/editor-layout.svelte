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
  import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
  } from '$lib/components/ui/collapsible';
  import { ChevronDown, Layers, Settings, Clock, Sparkles } from '@lucide/svelte';
  import AiChat from '$lib/components/ai/ai-chat.svelte';
  import ModelSelector from '$lib/components/ai/model-selector.svelte';
  import { DEFAULT_MODEL_ID } from '$lib/ai/models';
  import type { Component, Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import AddLayer from './panels/add-layer.svelte';

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
  const mediaQuery = new MediaQuery('max-width: 768px');
  const isMobile = $derived(mediaQuery.current);
  const isRecording = $derived(projectStore.isRecording);

  // AI Chat model selection
  let aiChatModelId = $state(DEFAULT_MODEL_ID);
</script>

{#snippet canvasSection()}
  <Canvas bind:projectViewport {isRecording} />
{/snippet}

{#snippet timelineSection()}
  {#if !isRecording}
    <Panel title="Timeline" disableScroll={true}>
      {#snippet content()}
        <Timeline />
      {/snippet}
      {#snippet headerExtra()}
        {projectStore.currentTime.toFixed(2)}s / {projectStore.project.duration}s
      {/snippet}
    </Panel>
  {/if}
{/snippet}

{#snippet layersSection()}
  <Panel title="Layers ({projectStore.project.layers.length})" actionsComponent={AddLayer}>
    {#snippet content()}
      <LayersPanel />
    {/snippet}
  </Panel>
{/snippet}

{#snippet propertiesSection()}
  {#if !isRecording}
    <Panel title="Properties">
      {#snippet content()}
        <PropertiesPanel />
      {/snippet}
    </Panel>
  {/if}
{/snippet}

{#snippet chatSection()}
  <Panel title="AI Chat">
    {#snippet content()}
      <AiChat bind:selectedModelId={aiChatModelId} />
    {/snippet}
    {#snippet actionsSnippet()}
      <ModelSelector selectedModelId={aiChatModelId} onModelChange={(id) => (aiChatModelId = id)} />
    {/snippet}
  </Panel>
{/snippet}

{#snippet collapsiblePane(title: string, Icon: Component, content: Snippet, Actions?: Component)}
  <Collapsible class="border-b">
    <CollapsibleTrigger
      class="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 data-[state=open]:bg-muted/50"
    >
      <div class="flex items-center gap-2">
        <Icon class="size-4" />
        {title}
        {#if Actions}
          <Actions />
        {/if}
      </div>
      <ChevronDown class="size-4 transition-transform duration-200 data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="border-t">
        {@render content()}
      </div>
    </CollapsibleContent>
  </Collapsible>
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
      <!-- Mobile Layout: Simplified vertical scrollable list -->
      <div class="flex h-full flex-col overflow-y-auto">
        <div style="height: 60vh" class="shrink-0 border-b bg-muted/20">
          {@render canvasSection()}
        </div>

        {@render collapsiblePane('AI Chat', Sparkles, chatSection)}
        {@render collapsiblePane('Layers', Layers, layersSection, AddLayer)}

        {#if !isRecording}
          {@render collapsiblePane('Timeline', Clock, timelineSection)}
          {@render collapsiblePane('Properties', Settings, propertiesSection)}
        {/if}
      </div>
    {:else}
      <!-- Desktop Layout: Resizable panes -->
      <ResizablePaneGroup direction="horizontal" class="h-full">
        <!-- Left Panel: Layers and AI Chat -->
        <ResizablePane defaultSize={25} minSize={15} maxSize={30}>
          <ResizablePaneGroup direction="vertical">
            <ResizablePane defaultSize={60} minSize={30}>
              {@render layersSection()}
            </ResizablePane>
            <ResizableHandle />
            <ResizablePane defaultSize={40} minSize={20}>
              {@render chatSection()}
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
              {@render timelineSection()}
            </ResizablePane>
          </ResizablePaneGroup>
        </ResizablePane>

        <ResizableHandle />

        <!-- Right Panel: Properties -->
        <ResizablePane defaultSize={25} minSize={15} maxSize={30}>
          {@render propertiesSection()}
        </ResizablePane>
      </ResizablePaneGroup>
    {/if}
  </div>
</div>

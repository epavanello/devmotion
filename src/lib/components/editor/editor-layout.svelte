<script lang="ts">
  import Toolbar from './toolbar.svelte';
  import Canvas from './canvas/canvas.svelte';
  import Timeline from './timeline/timeline.svelte';
  import LayersPanel from './panels/layers-panel.svelte';
  import PropertiesPanel from './panels/properties-panel.svelte';
  import KeyboardHandler from './keyboard-handler.svelte';
  import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib/components/ui/resizable';
  import { projectStore } from '$lib/stores/project.svelte';
  import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
  } from '$lib/components/ui/collapsible';
  import { ChevronDown, Layers, Settings, Clock } from 'lucide-svelte';
  import AiChat from '$lib/components/ai/ai-chat.svelte';
  import type { ComponentType, Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

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
</script>

{#snippet canvasSection()}
  <Canvas bind:projectViewport {isRecording} />
{/snippet}

{#snippet timelineSection()}
  {#if !isRecording}
    <Timeline />
  {/if}
{/snippet}

{#snippet layersSection()}
  <LayersPanel />
{/snippet}

{#snippet propertiesSection()}
  {#if !isRecording}
    <PropertiesPanel />
  {/if}
{/snippet}

{#snippet chatSection()}
  <AiChat />
{/snippet}

{#snippet collapsiblePane(title: string, Icon: ComponentType, content: Snippet)}
  <Collapsible class="border-b">
    <CollapsibleTrigger
      class="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 data-[state=open]:bg-muted/50"
    >
      <div class="flex items-center gap-2">
        <Icon class="size-4" />
        {title}
      </div>
      <ChevronDown class="size-4 transition-transform duration-200 data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="h-75 border-t">
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
        <div style="height: 40vh" class="shrink-0 border-b bg-muted/20">
          {@render canvasSection()}
        </div>

        <div class="relative shrink-0 border-b" style="height: 40vh">
          {@render chatSection()}
        </div>

        {@render collapsiblePane('Layers', Layers, layersSection)}

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

<script lang="ts">
  import Toolbar from './toolbar.svelte';
  import Canvas from './canvas/canvas.svelte';
  import PropertiesPanel from './panels/properties-panel.svelte';
  import Panel from './panels/panel.svelte';
  import KeyboardHandler from './keyboard-handler.svelte';
  import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib/components/ui/resizable';
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Settings, Clock, Sparkles } from '@lucide/svelte';
  import AssetsPanel from './panels/assets-panel.svelte';
  import AiChat from '$lib/components/ai/ai-chat.svelte';
  import ModelSelector from '$lib/components/ai/model-selector.svelte';
  import { DEFAULT_MODEL_ID } from '$lib/ai/models';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import Timeline from './timeline/timeline.svelte';
  import ScrollArea from '../ui/scroll-area/scroll-area.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  const projectId = $derived(editorState.dbProjectId);
  const isOwner = $derived(editorState.isOwner);
  const canEdit = $derived(editorState.canEdit);
  const isPublic = $derived(editorState.isPublic);
  const isMcp = $derived(editorState.isMcp);

  let projectViewport: HTMLDivElement | undefined = $state();
  const mediaQuery = new IsMobile();
  const isMobile = $derived(mediaQuery.current);
  const isRecording = $derived(projectStore.isRecording);

  // AI Chat model selection
  let aiChatModelId: string = $state(DEFAULT_MODEL_ID);

  // Mobile panel state - start with all closed
  let openPanels = $state({
    aiChat: false,
    timeline: false,
    properties: false
  });

  let aiChatScrollRef: HTMLElement | null = $state(null);
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
          bind:scrollRef={aiChatScrollRef}
        >
          {#snippet content()}
            <AiChat bind:selectedModelId={aiChatModelId} scrollRef={aiChatScrollRef} />
          {/snippet}
          {#snippet actionsSnippet()}
            <ModelSelector
              selectedModelId={aiChatModelId}
              onModelChange={(id) => (aiChatModelId = id)}
            />
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
            zIndex={20}
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
            zIndex={30}
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
        <!-- Canvas & Timeline -->
        <ResizablePane>
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

        <ResizablePane defaultSize={30} minSize={20} maxSize={40}>
          <Tabs.Root value="chat" class="flex h-full flex-col gap-0">
            <div class="border-b p-1.5">
              <Tabs.List class="w-full">
                <Tabs.Trigger value="chat">Chat</Tabs.Trigger>
                <Tabs.Trigger value="properties" id="properties-tab">Properties</Tabs.Trigger>
                <Tabs.Trigger value="assets">Assets</Tabs.Trigger>
              </Tabs.List>
            </div>
            <Tabs.Content value="chat" class="overflow-auto">
              <Panel title="AI Chat" bind:scrollRef={aiChatScrollRef}>
                {#snippet content()}
                  <AiChat bind:selectedModelId={aiChatModelId} scrollRef={aiChatScrollRef} />
                {/snippet}
                {#snippet actionsSnippet()}
                  <ModelSelector
                    selectedModelId={aiChatModelId}
                    onModelChange={(id) => (aiChatModelId = id)}
                  />
                {/snippet}
              </Panel>
            </Tabs.Content>
            <Tabs.Content value="properties" class="overflow-auto">
              <ScrollArea class="h-full">
                <PropertiesPanel />
              </ScrollArea>
            </Tabs.Content>
            <Tabs.Content value="assets" class="overflow-auto">
              <svelte:boundary>
                <AssetsPanel />
                {#snippet pending()}{/snippet}
              </svelte:boundary>
            </Tabs.Content>
          </Tabs.Root>
        </ResizablePane>
      </ResizablePaneGroup>
    {/if}
  </div>
</div>

<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Sparkles, ChevronDown, Bot, Loader2, User } from 'lucide-svelte';
  import { AI_MODELS, DEFAULT_MODEL_ID } from '$lib/ai/models';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport, isToolUIPart, type UIMessage, type UIDataTypes } from 'ai';
  import { resolve } from '$app/paths';
  import type { GenerateRequest } from '../../../routes/(app)/chat/+server';
  import {
    executeCreateLayer,
    executeAnimateLayer,
    executeEditLayer,
    executeRemoveLayer,
    executeConfigureProject,
    resetLayerTracking
  } from '$lib/ai/ai-operations.svelte';
  import {
    type CreateLayerInput,
    type AnimateLayerInput,
    type EditLayerInput,
    type RemoveLayerInput,
    type ConfigureProjectInput,
    type AnimationUITools,
    type ToolIDs
  } from '$lib/ai/schemas';

  let prompt = $state('');
  let showModelSelector = $state(false);
  let selectedModelId = $state(DEFAULT_MODEL_ID);

  const models = Object.values(AI_MODELS);
  const selectedModel = $derived(AI_MODELS[selectedModelId] || AI_MODELS[DEFAULT_MODEL_ID]);

  let messagesContainer: HTMLDivElement | null = $state(null);

  const chat = new Chat<UIMessage<never, UIDataTypes, AnimationUITools>>({
    transport: new DefaultChatTransport({
      api: resolve('/(app)/chat'),
      get body() {
        return {
          project: projectStore.project,
          modelId: selectedModelId
        } satisfies Omit<GenerateRequest, 'messages'>;
      }
    }),
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }

      console.log(toolCall.toolName);

      // get_layer_info is executed server-side, no need for client execution
      if (toolCall.toolName === 'get_layer_info') {
        return;
      }

      const toolName = toolCall.toolName as ToolIDs;
      let result: unknown;

      switch (toolName) {
        case 'create_layer':
          result = executeCreateLayer(toolCall.input as CreateLayerInput);
          break;
        case 'animate_layer':
          result = executeAnimateLayer(toolCall.input as AnimateLayerInput);
          break;
        case 'edit_layer':
          result = executeEditLayer(toolCall.input as EditLayerInput);
          break;
        case 'remove_layer':
          result = executeRemoveLayer(toolCall.input as RemoveLayerInput);
          break;
        case 'configure_project':
          result = executeConfigureProject(toolCall.input as ConfigureProjectInput);
          break;
        default:
          result = { success: false, error: `Unknown tool: ${toolCall.toolName}` };
      }

      console.log(result);

      chat.addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result
      });
    }
  });

  function onSubmit(event?: Event) {
    event?.preventDefault();
    if (!prompt.trim() || chat.status === 'streaming') return;

    // Reset layer tracking for new message
    resetLayerTracking();

    chat.sendMessage({ text: prompt });
    prompt = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  // Auto-scroll to bottom when messages change
  $effect(() => {
    if (messagesContainer && chat.messages.length > 0) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
</script>

<div class="flex h-full flex-col border-t bg-background">
  <!-- Header -->
  <div class="flex items-center justify-between border-b px-4 py-2">
    <label class="flex items-center gap-2 text-xs font-medium">
      <Sparkles class="h-3 w-3" />
      AI Animation Generator
    </label>

    <!-- Model selector -->
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted"
        onclick={() => (showModelSelector = !showModelSelector)}
      >
        {selectedModel.name}
        <ChevronDown class="h-3 w-3" />
      </button>

      {#if showModelSelector}
        <div
          class="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md"
        >
          {#each models as model (model.id)}
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
              class:bg-muted={model.id === selectedModelId}
              onclick={() => {
                selectedModelId = model.id;
                showModelSelector = false;
              }}
            >
              <span>{model.name}</span>
              {#if model.recommended}
                <span class="text-[10px] text-primary">Recommended</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Messages -->
  <div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4">
    {#if chat.messages.length === 0}
      <div class="flex h-full flex-col items-center justify-center text-center">
        <Bot class="mb-4 size-12 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          Describe your animation and I'll build it step by step.
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each chat.messages as message (message.id)}
          <div class="flex gap-3">
            <div
              class="flex size-7 shrink-0 items-center justify-center rounded-full {message.role ===
              'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'}"
            >
              {#if message.role === 'user'}
                <User class="size-3.5" />
              {:else}
                <Bot class="size-3.5" />
              {/if}
            </div>

            <div class="min-w-0 flex-1 space-y-2">
              <p class="text-xs font-medium text-muted-foreground">
                {message.role === 'user' ? 'You' : 'AI'}
              </p>

              {#each message.parts as part, partIndex (partIndex)}
                {#if part.type === 'text' && part.text.trim()}
                  <p class="text-sm whitespace-pre-wrap">{part.text}</p>
                {:else if isToolUIPart(part)}
                  TOOL: {part.type}
                  <!-- <ToolCallDisplay
                    toolName={part.type.replace('tool-', '')}
                    input={part.input}
                    state={part.state}
                  /> -->
                {/if}
              {/each}
            </div>
          </div>
        {/each}

        {#if chat.status === 'streaming' || chat.status === 'submitted'}
          <div class="flex gap-3">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot class="size-3.5" />
            </div>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 class="size-4 animate-spin" />
              Thinking...
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Input -->
  <form onsubmit={onSubmit} class="border-t p-4">
    <textarea
      bind:value={prompt}
      onkeydown={handleKeyDown}
      placeholder="Describe your animation... e.g., 'Create a title that fades in with a subtitle below'"
      disabled={chat.status === 'streaming' || projectStore.isRecording}
      class="mb-3 flex min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
    ></textarea>

    <Button
      class="w-full"
      type="submit"
      disabled={!prompt.trim() || chat.status === 'streaming' || projectStore.isRecording}
    >
      {#if chat.status === 'streaming'}
        Generating...
      {:else}
        Generate with {selectedModel.name}
      {/if}
    </Button>
  </form>
</div>

<script lang="ts">
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Bot, Loader2, User, Trash2, Send } from '@lucide/svelte';
  import { DEFAULT_MODEL_ID } from '$lib/ai/models';
  import { Chat } from '@ai-sdk/svelte';
  import {
    DefaultChatTransport,
    isToolUIPart,
    lastAssistantMessageIsCompleteWithToolCalls,
    type UIMessage,
    type UIDataTypes
  } from 'ai';
  import { resolve } from '$app/paths';
  import type { GenerateRequest } from '../../../routes/(app)/chat/+server';
  import {
    executeCreateLayer,
    executeAnimateLayer,
    executeEditLayer,
    executeRemoveLayer,
    executeConfigureProject,
    executeGroupLayers,
    executeUngroupLayers,
    executeUpdateKeyframe,
    executeRemoveKeyframe,
    resetLayerTracking
  } from '$lib/ai/ai-operations.svelte';
  import {
    type AnimateLayerInput,
    type EditLayerInput,
    type RemoveLayerInput,
    type ConfigureProjectInput,
    type GroupLayersInput,
    type UngroupLayersInput,
    type AnimationUITools,
    isLayerCreationTool,
    getLayerTypeFromToolName,
    type CreateLayerInput,
    type UpdateKeyframeInput,
    type RemoveKeyframeInput
  } from '$lib/ai/schemas';
  import { toast } from 'svelte-sonner';
  import { parseErrorMessage } from '$lib/utils';
  import { uiStore } from '$lib/stores/ui.svelte';

  import { PersistedState, watch } from 'runed';
  import ToolPart from './tool-part.svelte';
  import ReasoningPart from './reasoning-part.svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  interface Props {
    selectedModelId?: string;
    scrollRef?: HTMLElement | null;
  }

  let { selectedModelId = $bindable(DEFAULT_MODEL_ID), scrollRef }: Props = $props();
  let prompt = new PersistedState('prompt', '');

  // svelte-ignore state_referenced_locally
  const persistedMessages = new PersistedState<UIMessage<never, UIDataTypes, AnimationUITools>[]>(
    `ai-chat-messages-${projectStore.state.id}`,
    []
  );

  const chat = new Chat<UIMessage<never, UIDataTypes, AnimationUITools>>({
    transport: new DefaultChatTransport({
      api: resolve('/(app)/chat'),
      body: () => {
        return {
          project: projectStore.state,
          modelId: selectedModelId
        } satisfies Omit<GenerateRequest, 'messages'>;
      }
    }),
    messages: persistedMessages.current,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError(error) {
      toast.error(parseErrorMessage(error));
    },
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }
      const toolName = toolCall.toolName;
      let result: unknown;

      // Handle layer creation tools (create_text_layer, create_icon_layer, etc.)
      if (isLayerCreationTool(toolName)) {
        const layerType = getLayerTypeFromToolName(toolName);
        if (layerType) {
          const input = toolCall.input as CreateLayerInput;
          result = executeCreateLayer(projectStore, {
            type: layerType,
            name: input.name,
            visible: input.visible,
            locked: input.locked,
            transform: input.transform,
            props: input.props || {},
            animation: input.animation,
            enterTime: input.enterTime,
            exitTime: input.exitTime,
            contentDuration: input.contentDuration,
            contentOffset: input.contentOffset
          });
        } else {
          result = { success: false, error: `Invalid layer creation tool: ${toolName}` };
        }
      } else {
        // Handle other tools
        switch (toolName) {
          case 'animate_layer':
            result = executeAnimateLayer(projectStore, toolCall.input as AnimateLayerInput);
            break;
          case 'edit_layer':
            result = executeEditLayer(projectStore, toolCall.input as EditLayerInput);
            break;
          case 'update_keyframe':
            result = executeUpdateKeyframe(projectStore, toolCall.input as UpdateKeyframeInput);
            break;
          case 'remove_keyframe':
            result = executeRemoveKeyframe(projectStore, toolCall.input as RemoveKeyframeInput);
            break;
          case 'remove_layer':
            result = executeRemoveLayer(projectStore, toolCall.input as RemoveLayerInput);
            break;
          case 'group_layers':
            result = executeGroupLayers(projectStore, toolCall.input as GroupLayersInput);
            break;
          case 'ungroup_layers':
            result = executeUngroupLayers(projectStore, toolCall.input as UngroupLayersInput);
            break;
          case 'configure_project':
            result = executeConfigureProject(projectStore, toolCall.input as ConfigureProjectInput);
            break;
          default:
            result = { success: false, error: `Unknown tool: ${toolName}` };
        }
      }

      chat.addToolOutput({
        tool: toolName,
        toolCallId: toolCall.toolCallId,
        output: result
      });
    },
    onFinish() {
      persistedMessages.current = chat.messages;
    }
  });

  function sendMessage() {
    // Reset layer tracking for new message
    resetLayerTracking();

    chat.sendMessage({ text: prompt.current });
    prompt.current = '';
  }

  function onSubmit(event?: Event) {
    event?.preventDefault();
    if (!prompt.current.trim() || chat.status === 'streaming') return;

    uiStore.requireLogin('send a message', sendMessage);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  function resetMessages() {
    chat.messages = [];
    persistedMessages.current = [];
    toast.success('Chat history cleared');
  }

  watch.pre(
    () => $state.snapshot(chat.messages),
    () => {
      let isAtBottom = false;
      if (scrollRef) {
        const top = scrollRef.scrollTop;
        const scrollHeight = scrollRef.scrollHeight;
        const clientHeight = scrollRef.clientHeight;
        const diff = scrollHeight - clientHeight;
        isAtBottom = top >= diff - 100;
      }
      // allow the user to scroll up to read previous messages
      if (isAtBottom) {
        scrollRef?.scrollTo({
          top: scrollRef.scrollHeight,
          behavior: 'instant'
        });
      }
    }
  );
</script>

<div class="flex h-full flex-col">
  <!-- Messages -->
  <div class="flex-1 p-4">
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
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
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
              <p class="text-xs font-medium text-muted-foreground">
                {message.role === 'user' ? 'You' : 'AI'}
              </p>
            </div>

            <div class="space-y-2 pl-0">
              {#each message.parts as part, partIndex (partIndex)}
                {#if part.type === 'reasoning' && part.text.trim()}
                  <ReasoningPart reasoning={part.text} />
                {:else if part.type === 'text' && part.text.trim()}
                  <p class="text-sm whitespace-pre-wrap">{part.text}</p>
                {:else if isToolUIPart(part)}
                  <ToolPart tool={part} />
                {/if}
              {/each}
            </div>
          </div>
        {/each}

        {#if (chat.status === 'streaming' || chat.status === 'submitted') && chat.messages[chat.messages.length - 1].role !== 'assistant'}
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot class="size-3.5" />
              </div>
              <p class="text-xs font-medium text-muted-foreground">AI</p>
            </div>
            <div class="flex items-center gap-2 pl-0 text-sm text-muted-foreground">
              <Loader2 class="size-4 animate-spin" />
              Thinking...
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Input -->
  <form onsubmit={onSubmit} class="sticky bottom-0 border-t bg-background p-4">
    <textarea
      bind:value={prompt.current}
      onkeydown={handleKeyDown}
      placeholder="Describe your animation... e.g., 'Create a title that fades in with a subtitle below'"
      disabled={chat.status === 'streaming' || projectStore.isRecording}
      class="mb-3 flex min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
    ></textarea>

    <div class="flex gap-2">
      <Button
        class="flex-1"
        type="submit"
        disabled={!prompt.current.trim() || chat.status === 'streaming' || projectStore.isRecording}
        loading={chat.status === 'streaming' || chat.status === 'submitted'}
      >
        {#if chat.status !== 'ready'}
          Generating...
        {:else}
          Send
          <Send class="size-4" />
        {/if}
      </Button>

      {#if chat.messages.length > 0}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onclick={resetMessages}
          disabled={chat.status === 'streaming'}
          title="Clear chat history"
        >
          <Trash2 class="size-4" />
        </Button>
      {/if}
    </div>
  </form>
</div>

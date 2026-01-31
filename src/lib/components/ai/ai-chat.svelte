<script module lang="ts">
  const TestSchema = z.object({
    parTest: z.number()
  });
  export const testTool = tool({
    description: 'test',
    inputSchema: TestSchema
  });
</script>

<script lang="ts">
  import { projectStore } from '$lib/stores/project.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Sparkles, ChevronDown, Bot, Loader2, User } from 'lucide-svelte';
  import { AI_MODELS, DEFAULT_MODEL_ID } from '$lib/ai/models';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, tool } from 'ai';
  import { resolve } from '$app/paths';
  import z from 'zod';
  import type { GenerateRequest } from '../../../routes/(app)/chat/+server';

  let prompt = $state('');
  let isGenerating = $state(false);
  let selectedModelId = $state(DEFAULT_MODEL_ID);
  let showModelSelector = $state(false);

  const models = Object.values(AI_MODELS);
  const selectedModel = $derived(AI_MODELS[selectedModelId] || AI_MODELS[DEFAULT_MODEL_ID]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSubmit(e);
    }
  }

  let messagesContainer: HTMLDivElement | null = $state(null);

  const chat = new Chat({
    transport: new DefaultChatTransport({
      api: resolve('/(app)/chat'),
      get body() {
        return {
          project: projectStore.project,
          modelId: selectedModelId
        } satisfies Omit<GenerateRequest, 'messages'>;
      }
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }

      toolCall.input;

      if (toolCall.toolName === 'testTool') {
        const params = TestSchema.parse(toolCall.input);
        // do something
        params.parTest;

        // return result
        chat.addToolOutput({
          tool: toolCall.toolName,
          state: 'output-available',
          toolCallId: toolCall.toolCallId,
          output: {
            //
          }
        });
      }
      toolCall.toolName;

      /**
       * Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
       */
      toolCall.input;

      /**
       * Whether the tool call will be executed by the provider.
       * If this flag is not set or is false, the tool call will be executed by the client.
       */
      toolCall.providerExecuted;
    }
  });

  function onSubmit(event?: Event) {
    event?.preventDefault();
    if (!prompt.trim() || chat.status === 'streaming') return;
    chat.sendMessage({ text: prompt });
  }
</script>

<div class="border-t bg-background p-4">
  <label for="ai-prompt" class="flex items-center gap-2 text-xs font-medium">
    <Sparkles class="h-3 w-3" />
    AI Animation Generator
  </label>
  <div bind:this={messagesContainer} class="overflow-y-auto">
    <div class="container mx-auto max-w-4xl px-4 py-6">
      {#if chat.messages.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <Bot class="mb-4 size-16 text-muted-foreground" />
          <h2 class="mb-2 text-xl font-semibold">Start a conversation</h2>
        </div>
      {:else}
        <div class="space-y-6">
          {#each chat.messages as message (message.id)}
            <div class="flex gap-4">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full {message.role ===
                'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'}"
              >
                {#if message.role === 'user'}
                  <User class="size-4" />
                {:else}
                  <Bot class="size-4" />
                {/if}
              </div>
              <div class="flex-1 space-y-2">
                <p class="text-sm font-medium">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <div class="prose prose-sm max-w-none dark:prose-invert">
                  <p class="whitespace-pre-wrap">
                    {#each message.parts as part, index (index)}
                      {#if part.type === 'text'}
                        {part.text}
                      {:else if part.type === 'dynamic-tool'}
                        {part.toolCallId}
                        {part.toolName}
                        {part.input}
                        {part.output}
                      {/if}
                    {/each}
                  </p>
                </div>
              </div>
            </div>
          {/each}

          {#if chat.status === 'streaming' || chat.status === 'submitted'}
            <div class="flex gap-4">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot class="size-4" />
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
  </div>
  <div class="mb-2 flex items-center justify-end">
    <!-- Model selector -->
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
        onclick={() => (showModelSelector = !showModelSelector)}
      >
        <span class="max-w-24 truncate">{selectedModel.name}</span>
        <ChevronDown class="h-3 w-3" />
      </button>

      {#if showModelSelector}
        <div
          class="absolute top-full right-0 z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-lg"
        >
          {#each models as model (model.id)}
            <button
              type="button"
              class="flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
              class:bg-accent={model.id === selectedModelId}
              onclick={() => {
                selectedModelId = model.id;
                showModelSelector = false;
              }}
            >
              <div class="flex items-center gap-1">
                <span class="font-medium">{model.name}</span>
                {#if model.recommended}
                  <span class="rounded bg-primary/20 px-1 text-[10px] text-primary"
                    >recommended</span
                  >
                {/if}
              </div>
              <span class="text-muted-foreground">{model.description}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <form onsubmit={onSubmit}>
    <textarea
      id="ai-prompt"
      bind:value={prompt}
      onkeydown={handleKeyDown}
      placeholder="Describe your video animation in detail... e.g., 'Create a 5-second promo video for CloudSync app with animated title, features, and CTA button'"
      disabled={isGenerating || projectStore.isRecording}
      class="mb-3 flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
    ></textarea>

    <Button
      class="w-full"
      type="submit"
      disabled={!prompt.trim() || isGenerating || projectStore.isRecording}
    >
      {#if isGenerating}
        Generating with {selectedModel.name}...
      {:else}
        Generate
      {/if}
    </Button>
  </form>
</div>

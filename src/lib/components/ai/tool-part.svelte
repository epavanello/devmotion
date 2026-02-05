<script lang="ts">
  import type { AnimationUITools } from '$lib/ai/schemas';
  import type { DynamicToolUIPart, ToolUIPart } from 'ai';

  const { tool }: { tool: DynamicToolUIPart | ToolUIPart<AnimationUITools> } = $props();

  const output = $derived(
    tool.output as { success?: boolean; message?: string; [key: string]: unknown }
  );

  const hasOutput = $derived(output && typeof output === 'object');
  const success = $derived(hasOutput && output.success === true);
  const message = $derived(
    hasOutput && typeof output.message === 'string' ? output.message : undefined
  );
</script>

<div class="space-y-1">
  <!-- Success/Failure indicator and message -->
  <div class="flex items-start gap-2 text-xs">
    <span class="shrink-0">
      {#if success}
        ✅
      {:else if hasOutput && output.success === false}
        ❌
      {:else}
        ⏳
      {/if}
    </span>
    <div class="flex-1">
      {#if message}
        <p class="text-sm">{message}</p>
      {:else}
        <p class="text-sm text-muted-foreground italic">
          {tool.state === 'output-available' ? 'Completed' : 'Processing...'}
        </p>
      {/if}
    </div>
  </div>

  <!-- Compact details in summary -->
  <details class="rounded border bg-muted/30 px-2 py-0.5 text-[10px]">
    <summary class="cursor-pointer font-mono text-muted-foreground hover:text-foreground">
      🔧 {tool.type.replace('tool-', '')}
      {#if hasOutput && Object.keys(output).length > 2}
        <span class="ml-1">• {Object.keys(output).length - 2} more fields</span>
      {/if}
    </summary>
    <div class="mt-1.5 mb-1 space-y-1 font-mono">
      {#if tool.input}
        <div class="rounded bg-muted/50 p-1.5">
          <div class="mb-0.5 font-semibold text-foreground/70">Input:</div>
          <pre class="text-[9px] leading-tight whitespace-pre-wrap">{JSON.stringify(
              tool.input,
              null,
              2
            )}</pre>
        </div>
      {/if}
      {#if hasOutput}
        {@const otherFields = Object.fromEntries(
          Object.entries(output).filter(([key]) => key !== 'success' && key !== 'message')
        )}
        {#if Object.keys(otherFields).length > 0}
          <div class="rounded bg-muted/50 p-1.5">
            <div class="mb-0.5 font-semibold text-foreground/70">Details:</div>
            <pre class="text-[9px] leading-tight whitespace-pre-wrap">{JSON.stringify(
                otherFields,
                null,
                2
              )}</pre>
          </div>
        {/if}
      {/if}
    </div>
  </details>
</div>

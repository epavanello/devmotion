<script lang="ts">
  import type { AnimationUITools } from '$lib/ai/schemas';
  import type { DynamicToolUIPart, ToolUIPart } from 'ai';

  interface OutputErrorTool {
    state: 'output-error';
    errorText?: string;
  }

  function isOutputError(t: unknown): t is OutputErrorTool {
    return typeof t === 'object' && t !== null && (t as OutputErrorTool).state === 'output-error';
  }

  const { tool }: { tool: DynamicToolUIPart | ToolUIPart<AnimationUITools> } = $props();

  const output = $derived(
    tool.output as { success?: boolean; message?: string; [key: string]: unknown }
  );

  const hasOutput = $derived(output && typeof output === 'object');
  const success = $derived(hasOutput && output.success === true);
  const message = $derived(
    hasOutput && typeof output.message === 'string' ? output.message : undefined
  );
  const isError = $derived(tool.state === 'output-error');
  const errorText = $derived(isOutputError(tool) ? tool.errorText : undefined);
</script>

<details class="rounded border bg-muted/30 px-2 py-0.5 text-[10px]">
  <summary
    class="flex cursor-pointer items-center gap-1.5 font-mono text-muted-foreground hover:text-foreground"
  >
    <span>
      {#if success}
        ✅
      {:else if isError || (hasOutput && output.success === false)}
        ❌
      {:else if tool.state === 'input-streaming'}
        ⏳
      {:else}
        🔧
      {/if}
    </span>
    <span>{tool.type.replace('tool-', '')}</span>
    {#if message}
      <span class="ml-1 truncate text-foreground/60">{message}</span>
    {/if}
  </summary>
  <div class="mt-1.5 mb-1 space-y-1 font-mono">
    {#if errorText}
      <div class="rounded bg-destructive/10 p-1.5 text-destructive">
        <div class="mb-0.5 font-semibold">Error:</div>
        <pre class="text-[9px] leading-tight whitespace-pre-wrap">{errorText}</pre>
      </div>
    {/if}
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

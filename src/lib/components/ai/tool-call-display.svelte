<script lang="ts">
  import {
    CheckCircle,
    XCircle,
    Loader2,
    Layers,
    Sparkles,
    Settings,
    Trash2,
    Edit,
    Info
  } from 'lucide-svelte';
  import type { Component, ComponentType } from 'svelte';

  interface Props {
    toolName: string;
    input: unknown;
    state: string;
  }

  let { toolName, input, state: toolState, result }: Props = $props();

  const toolConfig: Record<
    string,
    { icon: Component | ComponentType; label: string; color: string }
  > = {
    get_layer_info: { icon: Info, label: 'Layer Info', color: 'text-cyan-500' },
    create_layer: { icon: Layers, label: 'Create Layer', color: 'text-blue-500' },
    animate_layer: { icon: Sparkles, label: 'Animate', color: 'text-purple-500' },
    edit_layer: { icon: Edit, label: 'Edit Layer', color: 'text-amber-500' },
    remove_layer: { icon: Trash2, label: 'Remove', color: 'text-red-500' },
    configure_project: { icon: Settings, label: 'Configure', color: 'text-emerald-500' }
  };

  const config = $derived(
    toolConfig[toolName] || { icon: Layers, label: toolName, color: 'text-gray-500' }
  );
  const Icon = $derived(config.icon);
  const success = $derived((result as { success?: boolean })?.success !== false);
  const errorMsg = $derived((result as { error?: string })?.error || '');

  // Custom message formatting for different tool types
  const message = $derived.by(() => {
    const res = result as {
      message?: string;
      properties?: Array<{ required?: boolean }>;
      layerType?: string;
    };
    if (res.message) return res.message;

    // Special formatting for get_layer_info
    if (toolName === 'get_layer_info' && res.properties && res.layerType) {
      const count = res.properties.length;
      const requiredCount = res.properties.filter((p) => p.required).length;
      return `Found ${count} properties (${requiredCount} required) for ${res.layerType}`;
    }

    return '';
  });

  // Extract meaningful info from input for display
  const inputSummary = $derived.by(() => {
    const inp = input as Record<string, unknown>;
    if (toolName === 'create_layer') {
      return `${inp.type}${inp.name ? ` "${inp.name}"` : ''}`;
    }
    if (toolName === 'animate_layer') {
      const preset = (inp.preset as { id?: string })?.id;
      return preset ? `preset: ${preset}` : 'custom keyframes';
    }
    if (toolName === 'get_layer_info') {
      return inp.layerType as string;
    }
    if (toolName === 'edit_layer' || toolName === 'remove_layer') {
      return inp.layerId as string;
    }
    return '';
  });

  let showDetails = $state(false);
</script>

<div class="my-1.5 rounded-lg border bg-muted/30 p-2.5">
  <div class="flex items-center gap-2">
    <Icon class="size-4 {config.color}" />
    <span class="text-xs font-medium">{config.label}</span>
    {#if inputSummary}
      <span class="text-xs text-muted-foreground">({inputSummary})</span>
    {/if}

    <div class="ml-auto flex items-center gap-1">
      {#if toolState === 'partial-call' || toolState === 'call'}
        <Loader2 class="size-3.5 animate-spin text-muted-foreground" />
      {:else if toolState === 'result'}
        {#if success}
          <CheckCircle class="size-3.5 text-green-500" />
        {:else}
          <XCircle class="size-3.5 text-red-500" />
        {/if}
      {/if}
    </div>
  </div>

  {#if toolState === 'result' && (message || errorMsg)}
    <p class="mt-1 text-xs {success ? 'text-muted-foreground' : 'text-red-500'}">
      {message || errorMsg}
    </p>
  {/if}

  <!-- Expandable details -->
  <button
    type="button"
    class="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground"
    onclick={() => (showDetails = !showDetails)}
  >
    {showDetails ? 'Hide' : 'Show'} details
  </button>

  {#if showDetails}
    <pre
      class="mt-1.5 max-h-32 overflow-auto rounded bg-background p-2 text-[10px]">{JSON.stringify(
        input,
        null,
        2
      )}</pre>
    {#if result}
      <pre
        class="mt-1 max-h-32 overflow-auto rounded bg-background p-2 text-[10px]">{JSON.stringify(
          result,
          null,
          2
        )}</pre>
    {/if}
  {/if}
</div>

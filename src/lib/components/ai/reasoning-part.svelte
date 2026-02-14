<script lang="ts">
  const { reasoning }: { reasoning: string } = $props();
</script>

<details class="rounded border bg-muted/30 text-xs">
  <summary class="cursor-pointer px-2 py-1 font-mono text-muted-foreground hover:text-foreground">
    💭 Reasoning
    <span class="ml-1 text-[10px]">(click to expand)</span>
  </summary>
  <div class="px-2 pb-2">
    <pre class="font-mono text-[10px] leading-tight whitespace-pre-wrap">{reasoning}</pre>
  </div>
</details>

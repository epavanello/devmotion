<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils.js';

  type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    /** Compact size variant (smaller padding and gaps) */
    size?: 'default' | 'compact';
  };

  let {
    ref = $bindable(null),
    class: className,
    size = 'default',
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  bind:this={ref}
  data-slot="card"
  class={cn(
    'flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm',
    size === 'compact' ? 'gap-3 py-3' : 'gap-6 py-6',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>

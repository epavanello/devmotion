<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

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
  data-slot="card-header"
  class={cn(
    '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
    size === 'compact' ? 'gap-1 px-3' : 'gap-1.5 px-6',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>

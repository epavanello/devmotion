<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils.js';

  type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    /** Compact size variant (smaller padding) */
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
  data-slot="card-content"
  class={cn(size === 'compact' ? 'px-3' : 'px-6', className)}
  {...restProps}
>
  {@render children?.()}
</div>

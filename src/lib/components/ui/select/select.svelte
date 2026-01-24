<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import type { WithElementRef } from '$lib/utils.js';

  type Props = WithElementRef<
    HTMLSelectAttributes & {
      class?: string;
      'data-slot'?: string;
    }
  >;

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    'data-slot': dataSlot = 'select',
    children,
    ...restProps
  }: Props = $props();
</script>

<select
  bind:this={ref}
  bind:value
  data-slot={dataSlot}
  class={cn(
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</select>

<style>
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
    background-position: right 0.75rem center;
    background-repeat: no-repeat;
    background-size: 16px 16px;
    padding-right: 2.5rem;
  }

  select:disabled {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%9ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  }
</style>

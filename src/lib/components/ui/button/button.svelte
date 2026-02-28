<script lang="ts" module>
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { cn, type WithElementRef } from '$lib/utils.js';
  import { LoaderCircle } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { type VariantProps, tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white',
        outline:
          'bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-6 gap-1 rounded px-2 text-xs has-[>svg]:px-1.5',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': 'size-6',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  const iconSizeMap = {
    default: 'size-4',
    xs: 'size-3',
    sm: 'size-4',
    lg: 'size-5',
    icon: 'size-4',
    'icon-xs': 'size-3',
    'icon-sm': 'size-4',
    'icon-lg': 'size-5'
  } as const;

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
      icon?: Component;
      loading?: boolean;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = 'default',
    size = 'default',
    ref = $bindable(null),
    href = undefined,
    type = 'button',
    disabled: externalDisabled,
    children,
    onclick,
    icon,
    loading,
    ...restProps
  }: ButtonProps = $props();

  let isLoading = $derived(loading);
  const disabled = $derived(externalDisabled || isLoading);

  const handleClick: ButtonProps['onclick'] = (event) => {
    const result = onclick?.(event as Parameters<NonNullable<ButtonProps['onclick']>>[0]);
    if (result instanceof Promise) {
      isLoading = true;
      result.finally(() => {
        isLoading = false;
      });
    }
  };
</script>

{#snippet spinnerAndIcon()}
  {#if isLoading}
    <LoaderCircle class={cn('animate-spin', iconSizeMap[size])} />
  {:else if icon}
    {@const Icon = icon}
    <Icon class={cn('pointer-events-none shrink-0', iconSizeMap[size])} />
  {/if}
{/snippet}

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    onclick={handleClick}
    {...restProps}
  >
    {@render spinnerAndIcon()}
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    onclick={handleClick}
    {...restProps}
  >
    {@render spinnerAndIcon()}
    {@render children?.()}
  </button>
{/if}

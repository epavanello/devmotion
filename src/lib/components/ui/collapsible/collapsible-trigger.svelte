<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    child,
    children,
    ...restProps
  }: CollapsiblePrimitive.TriggerProps = $props();
</script>

<CollapsiblePrimitive.Trigger bind:ref data-slot="collapsible-trigger" {...restProps}>
  {#if child}
    {@render child({ props: restProps })}
  {:else if children}
    {@render children()}
  {/if}
</CollapsiblePrimitive.Trigger>

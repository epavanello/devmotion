<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Check } from '@lucide/svelte';
  import type { PlanConfig } from '$lib/config/plans';

  interface Props {
    plan: PlanConfig;
    onclick?: () => void;
    disabled?: boolean;
    isCurrentPlan?: boolean;
  }

  let { plan, onclick, disabled = false, isCurrentPlan = false }: Props = $props();
</script>

<div
  class="relative flex flex-col rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 {disabled
    ? 'opacity-60'
    : plan.popular
      ? 'shadow-lg ring-2 shadow-primary/10 ring-primary/50'
      : 'hover:border-primary/30'}"
>
  {#if isCurrentPlan}
    <div
      class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-4 py-1 text-xs font-semibold text-white"
    >
      Current Plan
    </div>
  {:else if plan.popular}
    <div
      class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground"
    >
      Most Popular
    </div>
  {/if}

  <div class="mb-8">
    <h3 class="mb-2 text-2xl font-bold text-foreground">{plan.name}</h3>
    <div class="mb-2 flex items-baseline gap-1">
      <span class="text-4xl font-extrabold text-foreground">${plan.price}</span>
      <span class="text-muted-foreground">/{plan.period}</span>
    </div>
    <p class="text-sm text-muted-foreground">{plan.description}</p>
  </div>

  <Button size="lg" variant={plan.variant} class="mb-8 w-full" {onclick} {disabled}>
    {isCurrentPlan ? 'Current Plan' : plan.cta}
  </Button>

  <ul class="grow space-y-3">
    {#each plan.features as feature (feature.text)}
      <li class="flex items-start gap-3">
        <div
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full {feature.highlight
            ? 'bg-primary/20'
            : 'bg-muted'}"
        >
          <Check
            class="h-3.5 w-3.5 {feature.highlight ? 'text-primary' : 'text-muted-foreground'}"
          />
        </div>
        <span
          class="text-sm {feature.highlight
            ? 'font-medium text-foreground'
            : 'text-muted-foreground'}"
        >
          {feature.text}
        </span>
      </li>
    {/each}
  </ul>
</div>

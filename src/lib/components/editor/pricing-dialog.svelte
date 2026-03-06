<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Sparkles } from '@lucide/svelte';
  import PricingCard from '$lib/components/marketing/pricing-card.svelte';
  import {
    getPaidPlans,
    getPlan,
    compareTiers,
    type PlanConfig,
    type PlanTier
  } from '$lib/config/plans';
  import { authClient, useSession } from '$lib/auth-client';
  import { toast } from 'svelte-sonner';
  import LoginPromptDialog from './login-prompt-dialog.svelte';
  import { page } from '$app/stores';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  const plans = getPaidPlans();
  const session = useSession();

  const currentTier = $derived($page.data.user?.subscriptionTier ?? 'free');
  const currentPlan = $derived(getPlan(currentTier));

  function isDisabled(planTier: PlanTier): boolean {
    // Disable current plan and all lower tiers
    return compareTiers(planTier, currentTier) <= 0;
  }

  function isCurrentPlan(planTier: PlanTier): boolean {
    return planTier === currentTier;
  }

  let showLoginDialog = $state(false);
  let selectedPlanForCheckout = $state<PlanConfig | null>(null);

  async function handleUpgrade(plan: PlanConfig) {
    // Check if user is authenticated
    if (!$session.data) {
      // Store plan and show login dialog
      selectedPlanForCheckout = plan;
      showLoginDialog = true;
      return;
    }

    // Authenticated - proceed to checkout
    await initiateCheckout(plan);
  }

  async function initiateCheckout(plan: PlanConfig) {
    try {
      // Initiate Polar checkout using the plan slug
      await authClient.checkout({
        slug: plan.tier // 'creator' or 'pro'
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    }
  }

  // After login, proceed to checkout
  $effect(() => {
    if ($session.data && selectedPlanForCheckout && !showLoginDialog) {
      const planToCheckout = selectedPlanForCheckout;
      selectedPlanForCheckout = null;
      initiateCheckout(planToCheckout);
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-2xl">
        <Sparkles class="h-6 w-6 text-primary" />
        Upgrade Your Plan
      </Dialog.Title>
      <Dialog.Description>
        Unlock more AI animations, cloud storage, and premium features.
      </Dialog.Description>
    </Dialog.Header>

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      {#each plans as plan (plan.tier)}
        <PricingCard
          {plan}
          onclick={async () => await handleUpgrade(plan)}
          disabled={isDisabled(plan.tier)}
          isCurrentPlan={isCurrentPlan(plan.tier)}
        />
      {/each}
    </div>

    <div class="mt-6 rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
      <p>
        <span class="font-semibold text-foreground">Current Plan:</span>
        {currentPlan.name}
        <span class="mx-2">•</span>
        Manual timeline editing is always free for everyone.
      </p>
    </div>
  </Dialog.Content>
</Dialog.Root>

<LoginPromptDialog
  bind:open={showLoginDialog}
  action={selectedPlanForCheckout
    ? `upgrade to ${selectedPlanForCheckout.name}`
    : 'upgrade your plan'}
/>

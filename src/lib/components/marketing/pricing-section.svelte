<script lang="ts">
  import LoginPromptDialog from '$lib/components/editor/login-prompt-dialog.svelte';
  import PricingCard from './pricing-card.svelte';
  import { compareTiers, getAllPlans, type PlanConfig, type PlanTier } from '$lib/config/plans';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { getUser } from '$lib/functions/auth.remote';

  const plans = getAllPlans();
  const user = $derived(await getUser());
  const currentTier = $derived(user?.subscriptionTier ?? 'free');

  let showLoginDialog = $state(false);
  let loginAction = $state('upgrade your plan');
  let loginCallbackURL = $state<string | undefined>(undefined);

  async function handleCTA(plan: PlanConfig) {
    // Check if user is authenticated
    if (!user) {
      // For free plan, redirect to editor after login
      if (plan.ctaAction === 'start') {
        loginAction = 'get started';
        loginCallbackURL = resolve('/(app)/editor');
        showLoginDialog = true;
        return;
      }

      // Show login dialog and redirect to subscribe after login
      loginAction = `upgrade to ${plan.name}`;
      loginCallbackURL = resolve('/(app)/subscribe/[slug]', { slug: plan.tier });
      showLoginDialog = true;
      return;
    }

    // Authenticated users - redirect to checkout
    await goto(resolve('/(app)/subscribe/[slug]', { slug: plan.tier }));
  }

  function isDisabled(planTier: PlanTier): boolean {
    if (!user) return false;
    // Disable current plan and all lower tiers
    return compareTiers(planTier, currentTier) <= 0;
  }

  function isCurrentPlan(planTier: PlanTier): boolean {
    return planTier === currentTier;
  }
</script>

<section id="pricing" class="relative border-t border-border/40 bg-muted/30">
  <div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
    <div class="mb-16 space-y-4 text-center">
      <h2 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Pricing</h2>
      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        Choose the plan that fits your needs. All plans include real-time collaboration and export
        to all formats.
      </p>
    </div>

    <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 xl:max-w-7xl xl:grid-cols-4">
      {#each plans as plan (plan.tier)}
        <PricingCard
          {plan}
          onclick={async () => await handleCTA(plan)}
          disabled={isDisabled(plan.tier)}
          isCurrentPlan={isCurrentPlan(plan.tier)}
        />
      {/each}
    </div>

    <div class="mt-12 text-center">
      <p class="text-sm text-muted-foreground">
        <span class="font-semibold text-foreground">AI animations</span> use OpenRouter API credits. Manual
        timeline editing is always free for everyone.
      </p>
    </div>
  </div>
</section>

<LoginPromptDialog
  bind:open={showLoginDialog}
  action={loginAction}
  callbackURL={loginCallbackURL}
/>

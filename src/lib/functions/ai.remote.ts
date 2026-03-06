import { query, getRequestEvent } from '$app/server';
import { getUserSubscription, getMonthlyUsageCost } from '$lib/server/services/ai-access';

export const getCredits = query(async () => {
  const { locals } = getRequestEvent();
  if (!locals.user) {
    return false;
  }

  // Use existing service methods
  const subscription = await getUserSubscription(locals.user.id);
  const usedCredits = await getMonthlyUsageCost(locals.user.id);

  const maxCredits = subscription?.maxCostPerMonth ?? 0;
  const remainingCredits = Math.max(0, maxCredits - usedCredits);

  return {
    maxCredits,
    usedCredits,
    remainingCredits,
    tier: subscription?.tier ?? 'free'
  };
});

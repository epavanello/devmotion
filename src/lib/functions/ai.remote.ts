import { query, getRequestEvent } from '$app/server';
import { getUserAIUnlock, getMonthlyUsageCost } from '$lib/server/services/ai-access';

export const getCredits = query(async () => {
  const { locals } = getRequestEvent();
  if (!locals.user) {
    return false;
  }

  // Use existing service methods
  const unlock = await getUserAIUnlock(locals.user.id);
  const usedCredits = await getMonthlyUsageCost(locals.user.id);

  const maxCredits = unlock?.maxCostPerMonth ?? 0;
  const remainingCredits = Math.max(0, maxCredits - usedCredits);

  return {
    maxCredits,
    usedCredits,
    remainingCredits,
    plan: unlock?.plan ?? 'free'
  };
});

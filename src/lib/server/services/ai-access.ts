/**
 * AI Access Control Service
 * Manages per-user AI usage based on subscription tier
 */
import { db } from '$lib/server/db';
import { aiUsageLog } from '$lib/server/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getModel } from '$lib/ai/models';
import { getPlan, type PlanTier } from '$lib/config/plans';
import { subscriptionService } from './subscription';

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = getModel(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}. Please use a supported model.`);
  }
  const pricing = model.pricing;

  // Convert from per-1M to actual cost
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Get user subscription
 */
export async function getUserSubscription(userId: string): Promise<{
  tier: PlanTier;
  enabled: boolean;
  maxCostPerMonth: number;
} | null> {
  const sub = await subscriptionService.getByUserId(userId);

  if (sub) {
    const plan = getPlan(sub.tier);
    return {
      tier: sub.tier,
      enabled: sub.enabled,
      maxCostPerMonth: plan.limits.maxCostPerMonth
    };
  }

  return null;
}

/**
 * Calculate total usage cost for a user in the current month
 */
export async function getMonthlyUsageCost(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      totalCost: sql<number>`COALESCE(SUM(${aiUsageLog.estimatedCost}), 0)`
    })
    .from(aiUsageLog)
    .where(and(eq(aiUsageLog.userId, userId), gte(aiUsageLog.createdAt, startOfMonth)));

  return result[0]?.totalCost || 0;
}

/**
 * Check if user can use AI (enabled + within monthly limit or credit balance)
 */
export async function canUserAccessAI(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCost?: number;
  maxCost?: number;
  creditBalance?: number;
  tier?: PlanTier;
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No subscription found. Please sign in to get free AI credits.',
      tier: 'free'
    };
  }

  if (!subscription.enabled) {
    return {
      allowed: false,
      reason: 'AI access is disabled',
      tier: subscription.tier
    };
  }

  const maxCost = subscription.maxCostPerMonth;

  // Lifetime plan: use expandable credit balance
  if (maxCost === -2) {
    const creditBalance = await subscriptionService.getCreditBalance(userId);

    if (creditBalance <= 0) {
      return {
        allowed: false,
        reason: 'Credit balance exhausted. Top up your credits to continue using AI features.',
        creditBalance,
        tier: subscription.tier
      };
    }

    return {
      allowed: true,
      creditBalance,
      tier: subscription.tier
    };
  }

  // Unlimited plan
  if (maxCost === -1) {
    const currentCost = await getMonthlyUsageCost(userId);
    return {
      allowed: true,
      currentCost,
      maxCost: -1,
      tier: subscription.tier
    };
  }

  // Monthly limit plans
  const currentCost = await getMonthlyUsageCost(userId);
  if (currentCost >= maxCost) {
    return {
      allowed: false,
      reason: `Monthly AI credit limit reached (${Math.round(maxCost * 100)} credits used). Upgrade your plan for more credits.`,
      currentCost,
      maxCost,
      tier: subscription.tier
    };
  }

  return {
    allowed: true,
    currentCost,
    maxCost,
    tier: subscription.tier
  };
}

/**
 * Log AI usage for tracking and billing
 * For lifetime plans, also deducts from credit balance
 */
export async function logAIUsage(params: {
  userId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, modelId, promptTokens, completionTokens, metadata } = params;

  const totalTokens = promptTokens + completionTokens;
  const estimatedCost = calculateCost(modelId, promptTokens, completionTokens);

  // Log usage
  await db.insert(aiUsageLog).values({
    id: nanoid(),
    userId,
    modelId,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
    metadata: metadata ? JSON.stringify(metadata) : null
  });

  // For lifetime plans, deduct from credit balance
  const subscription = await subscriptionService.getByUserId(userId);
  if (subscription?.tier === 'lifetime') {
    await subscriptionService.updateCreditBalance(userId, -estimatedCost);
  }
}

/**
 * Create or update user subscription
 */
export async function ensureUserSubscription(userId: string, tier: PlanTier = 'free') {
  return await subscriptionService.ensure(userId, tier);
}

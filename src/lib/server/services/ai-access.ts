/**
 * AI Access Control Service
 * Manages per-user AI unlock status and usage tracking
 */
import { db } from '$lib/server/db';
import { aiUserUnlock, aiUsageLog } from '$lib/server/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { AI_MODELS, getModel } from '$lib/ai/models';

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
 * Get AI unlock details for a user
 */
export async function getUserAIUnlock(userId: string) {
  const unlock = await db
    .select()
    .from(aiUserUnlock)
    .where(eq(aiUserUnlock.userId, userId))
    .limit(1);

  return unlock[0] || null;
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
 * Check if user can use AI (enabled + within monthly limit)
 */
export async function canUserAccessAI(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCost?: number;
  maxCost?: number;
}> {
  const unlock = await getUserAIUnlock(userId);

  if (!unlock) {
    return { allowed: false, reason: 'AI access not enabled for this user' };
  }

  if (!unlock.enabled) {
    return { allowed: false, reason: 'AI access is disabled' };
  }

  // Check monthly cost limit if set
  if (unlock.maxCostPerMonth !== null) {
    const currentCost = await getMonthlyUsageCost(userId);

    if (currentCost >= unlock.maxCostPerMonth) {
      return {
        allowed: false,
        reason: 'Monthly cost limit exceeded',
        currentCost,
        maxCost: unlock.maxCostPerMonth
      };
    }

    return {
      allowed: true,
      currentCost,
      maxCost: unlock.maxCostPerMonth
    };
  }

  return { allowed: true };
}

/**
 * Log AI usage for tracking and billing
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
}

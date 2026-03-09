/**
 * Subscription and plan schemas for DevMotion.
 * Defines subscription status and usage tracking.
 *
 * NOTE: Plan configurations (pricing, features, limits) are centralized in:
 * @see src/lib/config/plans.ts
 *
 * This file focuses on user subscription status and usage tracking for Zod validation.
 */
import { z } from 'zod';
import { getPlan, type PlanTier } from '$lib/config/plans';

// ============================================
// Plan Tiers
// ============================================

/**
 * Available subscription plan tiers
 */
export const PlanTierSchema = z.enum(['free', 'creator', 'pro', 'lifetime']);

export type { PlanTier };

// ============================================
// Usage Tracking
// ============================================

/**
 * Current usage for billing period
 */
export const UsageStatsSchema = z.object({
  aiCostUsed: z.number().min(0).default(0).describe('AI cost used this month in USD'),
  cloudProjects: z.number().int().min(0).default(0).describe('Current number of cloud projects'),
  storageUsedBytes: z.number().int().min(0).default(0).describe('Storage used in bytes'),
  creditBalance: z
    .number()
    .min(0)
    .default(0)
    .describe('Expandable credit balance in USD (for lifetime plans)'),
  periodStart: z.date().describe('Billing period start'),
  periodEnd: z.date().describe('Billing period end')
});

export type UsageStats = z.infer<typeof UsageStatsSchema>;

// ============================================
// Subscription Status
// ============================================

/**
 * Subscription status
 */
export const SubscriptionStatusSchema = z.enum([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid'
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

/**
 * User subscription information
 */
export const UserSubscriptionSchema = z.object({
  userId: z.string().describe('User ID'),
  tier: PlanTierSchema,
  status: SubscriptionStatusSchema,
  currentPeriodStart: z.date().describe('Current billing period start'),
  currentPeriodEnd: z.date().describe('Current billing period end'),
  cancelAtPeriodEnd: z
    .boolean()
    .default(false)
    .describe('Whether subscription will cancel at period end'),

  // External billing provider data
  stripeCustomerId: z.string().optional().describe('Stripe customer ID'),
  stripeSubscriptionId: z.string().optional().describe('Stripe subscription ID'),
  polarSubscriptionId: z.string().optional().describe('Polar subscription ID'),

  // Usage tracking
  usage: UsageStatsSchema,

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date()
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if user has reached a specific limit
 */
export function hasReachedLimit(
  usage: UsageStats,
  tier: PlanTier,
  limitType: 'maxCostPerMonth' | 'cloudProjects'
): boolean {
  const plan = getPlan(tier);
  const limit = plan.limits[limitType];

  // Unlimited
  if (limit === -1) return false;

  switch (limitType) {
    case 'maxCostPerMonth':
      return usage.aiCostUsed >= limit;
    case 'cloudProjects':
      return usage.cloudProjects >= limit;
    default:
      return false;
  }
}

/**
 * Check if user can use a specific feature based on their plan
 */
export function canUseFeature(
  tier: PlanTier,
  feature: 'watermarkFree' | 'prioritySupport'
): boolean {
  const plan = getPlan(tier);
  return plan.limits[feature];
}

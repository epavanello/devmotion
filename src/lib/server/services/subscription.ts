import type { PlanTier } from '$lib/config/plans';
import { db } from '../db';
import { userSubscription } from '../db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type SubscriptionTier = PlanTier;

export interface SubscriptionData {
  tier: SubscriptionTier;
  polarSubscriptionId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  enabled: boolean;
}

/**
 * Service for managing user subscriptions
 * Centralizes all subscription-related database operations
 */
export const subscriptionService = {
  /**
   * Get user subscription by userId
   */
  async getByUserId(userId: string) {
    const result = await db
      .select()
      .from(userSubscription)
      .where(eq(userSubscription.userId, userId))
      .limit(1);

    return result[0] || null;
  },

  /**
   * Create or update user subscription (upsert)
   */
  async upsert(userId: string, data: Partial<SubscriptionData>) {
    const now = new Date();

    await db
      .insert(userSubscription)
      .values({
        id: nanoid(),
        userId,
        tier: data.tier || 'free',
        polarSubscriptionId: data.polarSubscriptionId || null,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        currentPeriodStart: data.currentPeriodStart || now,
        currentPeriodEnd: data.currentPeriodEnd || now,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        enabled: data.enabled ?? true,
        storageUsedBytes: 0
      })
      .onConflictDoUpdate({
        target: userSubscription.userId,
        set: {
          ...data,
          updatedAt: new Date()
        }
      });
  },

  /**
   * Create free tier subscription for new users
   */
  async createFreeTier(userId: string, notes?: string) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.insert(userSubscription).values({
      id: nanoid(),
      userId,
      tier: 'free',
      enabled: true,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      storageUsedBytes: 0,
      notes
    });
  },

  /**
   * Update subscription from Polar webhook data
   */
  async updateFromPolar(
    userId: string,
    polarData: {
      id: string;
      productId: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
    },
    tierMapping: { [productId: string]: SubscriptionTier }
  ) {
    const tier = tierMapping[polarData.productId] || 'free';

    const periodStart = polarData.currentPeriodStart || new Date();
    const periodEnd = polarData.currentPeriodEnd || new Date();

    await this.upsert(userId, {
      tier,
      polarSubscriptionId: polarData.id,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: polarData.cancelAtPeriodEnd || false,
      enabled: true
    });
  },

  /**
   * Mark subscription as canceled (but active until period end)
   */
  async markCanceled(userId: string) {
    await this.upsert(userId, {
      cancelAtPeriodEnd: true
    });
  },

  /**
   * Revoke subscription and downgrade to free tier
   */
  async revokeAndDowngrade(userId: string) {
    await this.upsert(userId, {
      tier: 'free',
      polarSubscriptionId: null,
      stripeSubscriptionId: null,
      enabled: true,
      cancelAtPeriodEnd: false
    });
  },

  /**
   * Check if user exists (for new user detection)
   */
  async exists(userId: string): Promise<boolean> {
    const sub = await this.getByUserId(userId);
    return sub !== null;
  },

  /**
   * Ensure user has a subscription (create if missing)
   */
  async ensure(userId: string, _tier: SubscriptionTier = 'free') {
    const existing = await this.getByUserId(userId);

    if (existing) {
      return existing;
    }

    // Create new subscription
    await this.createFreeTier(userId);
    return await this.getByUserId(userId);
  },

  /**
   * Update storage usage (increment/decrement)
   */
  async updateStorageUsage(userId: string, deltaBytes: number) {
    const { sql } = await import('drizzle-orm');
    await db
      .update(userSubscription)
      .set({
        storageUsedBytes: sql`${userSubscription.storageUsedBytes} + ${deltaBytes}`,
        updatedAt: new Date()
      })
      .where(eq(userSubscription.userId, userId));
  }
};

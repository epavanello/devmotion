import {
  pgTable,
  text,
  timestamp,
  boolean,
  real,
  index,
  pgEnum,
  integer
} from 'drizzle-orm/pg-core';
import { user } from './auth';

// =============================================================================
// CURRENT SCHEMA - Unified subscription system
// =============================================================================

export const planTierEnum = pgEnum('plan_tier', ['free', 'creator', 'pro', 'lifetime']);

/**
 * User subscription/plan information
 * Unified table for tracking user's plan tier and usage
 */
export const userSubscription = pgTable(
  'user_subscription',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    tier: planTierEnum('tier').default('free').notNull(),
    enabled: boolean('enabled').default(true).notNull(),

    // External billing provider IDs
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    polarSubscriptionId: text('polar_subscription_id'),

    // Billing period
    currentPeriodStart: timestamp('current_period_start').defaultNow().notNull(),
    currentPeriodEnd: timestamp('current_period_end').defaultNow().notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),

    // Usage tracking (reset monthly)
    storageUsedBytes: integer('storage_used_bytes').default(0).notNull(),

    // Expandable credit balance for lifetime plans (in USD, e.g., 10.0 = $10.00 = 1000 credits)
    // This balance can be topped up without a subscription
    creditBalance: real('credit_balance').default(0).notNull(),

    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    index('user_subscription_user_id_idx').on(table.userId),
    index('user_subscription_tier_idx').on(table.tier)
  ]
);

/**
 * AI usage log for tracking token consumption and costs
 */
export const aiUsageLog = pgTable(
  'ai_usage_log',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    modelId: text('model_id').notNull(),
    promptTokens: real('prompt_tokens').notNull(),
    completionTokens: real('completion_tokens').notNull(),
    totalTokens: real('total_tokens').notNull(),
    estimatedCost: real('estimated_cost').notNull(), // Cost in USD
    metadata: text('metadata'), // JSON string for additional data
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    index('ai_usage_log_user_id_idx').on(table.userId),
    index('ai_usage_log_created_at_idx').on(table.createdAt)
  ]
);

// =============================================================================
// LEGACY - Removed in migration 0014
// Old ai_user_unlock table has been migrated to userSubscription
// =============================================================================

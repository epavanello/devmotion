import { pgTable, text, timestamp, boolean, real, index, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const aiPlanEnum = pgEnum('ai_plan', ['free', 'pro']);

export const aiUserUnlock = pgTable(
  'ai_user_unlock',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').default(true).notNull(),
    maxCostPerMonth: real('max_cost_per_month').notNull(),
    plan: aiPlanEnum('plan').default('free').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [index('ai_user_unlock_user_id_idx').on(table.userId)]
);

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

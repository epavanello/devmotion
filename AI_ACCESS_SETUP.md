# AI Access Control Setup Guide

This guide explains how to manage per-user AI access and track usage costs in DevMotion.

## Overview

The AI access control system consists of:
1. **User Unlock Table** (`ai_user_unlock`) - Controls which users can access AI features
2. **Usage Tracking Table** (`ai_usage_log`) - Logs every AI request with token usage and estimated costs
3. **Service Layer** - Provides functions to check access and track usage
4. **Updated Chat Endpoint** - Enforces access control and logs usage automatically

## Database Schema

### ai_user_unlock Table
Manages which users have AI access enabled and their limits.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key |
| `user_id` | text | Foreign key to user table |
| `enabled` | boolean | Whether AI is enabled for this user |
| `max_cost_per_month` | real | Monthly cost limit in USD (null = unlimited) |
| `notes` | text | Admin notes about this user's access |
| `created_at` | timestamp | When access was granted |
| `updated_at` | timestamp | Last modification time |

### ai_usage_log Table
Tracks every AI request for billing and analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key |
| `user_id` | text | Foreign key to user table |
| `model_id` | text | AI model used (e.g., 'anthropic/claude-sonnet-4.5') |
| `prompt_tokens` | real | Number of input tokens |
| `completion_tokens` | real | Number of output tokens |
| `total_tokens` | real | Total tokens used |
| `estimated_cost` | real | Estimated cost in USD |
| `metadata` | text | JSON string with additional data |
| `created_at` | timestamp | When the request was made |

## Setup Instructions

### 1. Run Database Migration

First, apply the migration to create the new tables:

```bash
pnpm run db:migrate
```

Or in production:

```bash
PRIVATE_DATABASE_URL="your-production-url" pnpm run db:migrate
```

### 2. Enable AI Access for Users

You can use the provided service functions to manage user access. Here's how to enable AI for specific users:

#### Option A: Using the Service Layer Directly

Create a script or use a Node.js REPL:

```typescript
import { enableAIForUser } from '$lib/server/services/ai-access';

// Enable with unlimited usage
await enableAIForUser({
  userId: 'user-id-here',
  notes: 'Beta tester'
});

// Enable with monthly cost limit
await enableAIForUser({
  userId: 'user-id-here',
  maxCostPerMonth: 10.00,
  notes: 'Production user - $10/month limit'
});
```

#### Option B: Direct Database Insert

```sql
INSERT INTO ai_user_unlock (id, user_id, enabled, max_cost_per_month, notes, created_at, updated_at)
VALUES (
  'unlock_' || gen_random_uuid(),
  'user-id-here',
  true,
  10.00, -- Monthly limit in USD, or NULL for unlimited
  'Beta tester',
  NOW(),
  NOW()
);
```

### 3. Check User Access

The system automatically checks access when users make AI requests:

```typescript
import { canUserAccessAI } from '$lib/server/services/ai-access';

const result = await canUserAccessAI(userId);

if (result.allowed) {
  // User can access AI
  console.log('Current cost:', result.currentCost);
  console.log('Max cost:', result.maxCost);
} else {
  // Access denied
  console.log('Reason:', result.reason);
}
```

## Usage Tracking

### Automatic Tracking

The chat endpoint automatically tracks usage when AI requests complete. No additional code needed!

### Manual Tracking

If you need to track usage from other endpoints:

```typescript
import { logAIUsage } from '$lib/server/services/ai-access';

await logAIUsage({
  userId: 'user-id',
  modelId: 'anthropic/claude-sonnet-4.5',
  promptTokens: 1000,
  completionTokens: 500,
  metadata: {
    feature: 'animation-generation',
    projectId: 'project-123'
  }
});
```

### Cost Calculation

Costs are calculated based on current OpenRouter pricing:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Kimi K2.5 | $0.30 | $0.60 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| GPT-5.1 | $2.50 | $10.00 |
| Gemini 3 Pro | $1.25 | $5.00 |

**Note:** Update pricing in `src/lib/server/services/ai-access.ts` if OpenRouter changes their rates.

## Querying Usage Data

### Get Monthly Usage for a User

```typescript
import { getMonthlyUsageCost } from '$lib/server/services/ai-access';

const cost = await getMonthlyUsageCost(userId);
console.log(`User has spent $${cost.toFixed(4)} this month`);
```

### Get Detailed Usage Statistics

```typescript
import { getUserUsageStats } from '$lib/server/services/ai-access';

const stats = await getUserUsageStats(
  userId,
  new Date('2026-02-01'), // Start date
  new Date('2026-02-28')  // End date
);

console.log('Total requests:', stats.totalRequests);
console.log('Total cost:', stats.totalCost);
console.log('Total tokens:', stats.totalTokens);
console.log('Individual logs:', stats.logs);
```

### SQL Queries for Analytics

```sql
-- Top users by cost this month
SELECT
  u.email,
  u.name,
  SUM(al.estimated_cost) as total_cost,
  COUNT(*) as request_count
FROM ai_usage_log al
JOIN user u ON al.user_id = u.id
WHERE al.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.email, u.name
ORDER BY total_cost DESC
LIMIT 10;

-- Usage by model
SELECT
  model_id,
  COUNT(*) as requests,
  SUM(total_tokens) as total_tokens,
  SUM(estimated_cost) as total_cost
FROM ai_usage_log
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY model_id
ORDER BY total_cost DESC;

-- Users approaching their limits
SELECT
  u.email,
  auu.max_cost_per_month as limit_usd,
  SUM(al.estimated_cost) as current_cost,
  (SUM(al.estimated_cost) / auu.max_cost_per_month * 100) as percent_used
FROM ai_user_unlock auu
JOIN user u ON auu.user_id = u.id
LEFT JOIN ai_usage_log al ON al.user_id = u.id
  AND al.created_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE auu.enabled = true
  AND auu.max_cost_per_month IS NOT NULL
GROUP BY u.id, u.email, auu.max_cost_per_month
HAVING (SUM(al.estimated_cost) / auu.max_cost_per_month * 100) > 80
ORDER BY percent_used DESC;
```

## Managing Access

### Disable AI for a User

```typescript
import { disableAIForUser } from '$lib/server/services/ai-access';

await disableAIForUser(userId);
```

Or via SQL:

```sql
UPDATE ai_user_unlock
SET enabled = false, updated_at = NOW()
WHERE user_id = 'user-id-here';
```

### Update Monthly Limit

```typescript
import { enableAIForUser } from '$lib/server/services/ai-access';

// Update limit (will update existing record if it exists)
await enableAIForUser({
  userId: 'user-id',
  maxCostPerMonth: 25.00
});
```

## API Responses

When a user is blocked from using AI, they'll receive a 403 error:

```json
{
  "error": "AI access not enabled for this user"
}
```

Or if they've exceeded their limit:

```json
{
  "error": "Monthly cost limit exceeded"
}
```

## Best Practices

1. **Set Reasonable Limits**: Start with lower limits ($5-10/month) for new users
2. **Monitor Usage**: Set up alerts for users approaching 80% of their limit
3. **Review Regularly**: Check usage patterns monthly to adjust limits
4. **Archive Old Data**: Consider archiving usage logs older than 12 months
5. **Update Pricing**: Keep the pricing table in sync with OpenRouter's actual rates

## Production Checklist

- [ ] Run database migration
- [ ] Enable AI for initial beta users
- [ ] Set up monitoring/alerts for high usage
- [ ] Document support process for users hitting limits
- [ ] Schedule monthly usage reviews
- [ ] Plan for scaling (consider partitioning usage_log by month)

## Troubleshooting

### User can't access AI
1. Check if they have an unlock record: `SELECT * FROM ai_user_unlock WHERE user_id = 'xxx'`
2. Verify `enabled = true`
3. Check monthly usage: `SELECT SUM(estimated_cost) FROM ai_usage_log WHERE user_id = 'xxx' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`
4. Compare with `max_cost_per_month`

### Costs seem wrong
1. Verify token counts are accurate
2. Check pricing in `ai-access.ts` matches OpenRouter's current rates
3. Review `metadata` field in usage logs for debugging info

### Performance issues
1. Ensure indexes exist on `user_id` and `created_at` in `ai_usage_log`
2. Consider partitioning `ai_usage_log` by month
3. Archive historical data older than 12 months

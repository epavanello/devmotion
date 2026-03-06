-- ============================================================================
-- MIGRATION: ai_user_unlock -> user_subscription
-- This migration moves data from the legacy ai_user_unlock table to the new
-- unified user_subscription table, then drops the old table.
-- ============================================================================

-- Step 1: Migrate existing data from ai_user_unlock to user_subscription
-- Only migrate users who don't already have a subscription record
INSERT INTO user_subscription (
  id,
  user_id,
  tier,
  enabled,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  storage_used_bytes,
  notes,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid()::text as id,
  u.user_id,
  -- Map old plan enum to new tier enum
  CASE
    WHEN u.plan = 'pro' THEN 'pro'::plan_tier
    ELSE 'free'::plan_tier
  END as tier,
  u.enabled,
  COALESCE(u.created_at, NOW()) as current_period_start,
  COALESCE(u.created_at, NOW()) + INTERVAL '1 month' as current_period_end,
  false as cancel_at_period_end,
  0 as storage_used_bytes,
  CONCAT('Migrated from ai_user_unlock. Original note: ', COALESCE(u.notes, 'none')) as notes,
  COALESCE(u.created_at, NOW()) as created_at,
  COALESCE(u.updated_at, NOW()) as updated_at
FROM ai_user_unlock u
WHERE NOT EXISTS (
  -- Don't insert if user already has a subscription
  SELECT 1 FROM user_subscription s WHERE s.user_id = u.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Drop the old table and enum
DROP TABLE "ai_user_unlock" CASCADE;--> statement-breakpoint
DROP TYPE "public"."ai_plan";

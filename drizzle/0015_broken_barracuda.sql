ALTER TYPE "public"."plan_tier" ADD VALUE 'lifetime';--> statement-breakpoint
ALTER TABLE "user_subscription" ADD COLUMN "credit_balance" real DEFAULT 0 NOT NULL;
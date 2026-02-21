CREATE TYPE "public"."ai_plan" AS ENUM('free', 'pro');--> statement-breakpoint
ALTER TABLE "ai_user_unlock" ALTER COLUMN "max_cost_per_month" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_user_unlock" ADD COLUMN "plan" "ai_plan" DEFAULT 'free' NOT NULL;
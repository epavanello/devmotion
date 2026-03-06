CREATE TYPE "public"."plan_tier" AS ENUM('free', 'creator', 'pro');--> statement-breakpoint
CREATE TABLE "user_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tier" "plan_tier" DEFAULT 'free' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"polar_subscription_id" text,
	"current_period_start" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp DEFAULT now() NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"storage_used_bytes" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscription_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_subscription_user_id_idx" ON "user_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscription_tier_idx" ON "user_subscription" USING btree ("tier");
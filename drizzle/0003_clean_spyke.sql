CREATE TABLE "ai_usage_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"model_id" text NOT NULL,
	"prompt_tokens" real NOT NULL,
	"completion_tokens" real NOT NULL,
	"total_tokens" real NOT NULL,
	"estimated_cost" real NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_user_unlock" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"max_cost_per_month" real,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_unlock" ADD CONSTRAINT "ai_user_unlock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_log_user_id_idx" ON "ai_usage_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_log_created_at_idx" ON "ai_usage_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_user_unlock_user_id_idx" ON "ai_user_unlock" USING btree ("user_id");
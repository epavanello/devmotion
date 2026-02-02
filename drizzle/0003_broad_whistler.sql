ALTER TABLE "project" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "project_views_idx" ON "project" USING btree ("views");
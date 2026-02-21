ALTER TABLE "asset" DROP CONSTRAINT "asset_project_id_project_id_fk";
--> statement-breakpoint
DROP INDEX "asset_project_id_idx";--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "project_id";
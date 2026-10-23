CREATE INDEX IF NOT EXISTS "jersey_images_jersey_id_idx" ON "jersey_images" USING btree ("jersey_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jerseys_created_at_idx" ON "jerseys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jerseys_is_best_seller_idx" ON "jerseys" USING btree ("is_best_seller");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jerseys_is_new_idx" ON "jerseys" USING btree ("is_new");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jerseys_category_idx" ON "jerseys" USING btree ("category");

ALTER TABLE "jerseys" ADD COLUMN IF NOT EXISTS "product_line" text DEFAULT 'Jersey' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jerseys_product_line_idx" ON "jerseys" USING btree ("product_line");


ALTER TABLE "jerseys" ALTER COLUMN "category" SET DEFAULT 'Klub';--> statement-breakpoint
ALTER TABLE "jerseys" ADD COLUMN "country" text DEFAULT 'England' NOT NULL;--> statement-breakpoint
ALTER TABLE "jerseys" ADD COLUMN "edition" text DEFAULT 'Current' NOT NULL;--> statement-breakpoint
ALTER TABLE "jerseys" ADD COLUMN "kit_type" text DEFAULT 'Home' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key");
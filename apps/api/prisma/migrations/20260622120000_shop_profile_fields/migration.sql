-- Per-day hours + payout bank metadata on shops
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "opening_hours" JSONB;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "bank_account_name" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "bank_account_last4" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "bank_ifsc" TEXT;

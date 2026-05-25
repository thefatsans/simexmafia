-- Add redemption tracking columns to InventoryItem
-- Idempotent migration: safe to run multiple times

ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "isRedeemed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "redeemedAt" TIMESTAMP(3);
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "redemptionCode" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "redemptionStatus" TEXT;

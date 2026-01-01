-- Add sourceId column to InventoryItem table
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;




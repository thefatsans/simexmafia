-- Add statusReason column to Order table
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "statusReason" TEXT;





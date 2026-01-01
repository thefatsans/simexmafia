-- Migration: Add key field to OrderItem table
-- Run this in Supabase SQL Editor

ALTER TABLE "OrderItem" 
ADD COLUMN IF NOT EXISTS "key" TEXT;





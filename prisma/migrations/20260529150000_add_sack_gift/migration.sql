-- Sack gifts between customers
CREATE TABLE IF NOT EXISTS "SackGift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "sackType" TEXT NOT NULL,
    "sackName" TEXT NOT NULL,
    "purchaseMethod" TEXT NOT NULL DEFAULT 'coins',
    "pricePaid" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SackGift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SackGift_recipientId_status_idx" ON "SackGift"("recipientId", "status");
CREATE INDEX IF NOT EXISTS "SackGift_senderId_idx" ON "SackGift"("senderId");

DO $$ BEGIN
  ALTER TABLE "SackGift" ADD CONSTRAINT "SackGift_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SackGift" ADD CONSTRAINT "SackGift_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

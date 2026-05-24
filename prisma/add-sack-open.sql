-- Leaderboard: Sack-Öffnungen serverseitig speichern
CREATE TABLE IF NOT EXISTS "SackOpen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sackType" TEXT NOT NULL,
    "sackName" TEXT NOT NULL,
    "sackIcon" TEXT,
    "sackColor" TEXT,
    "purchaseMethod" TEXT NOT NULL,
    "pricePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rewardType" TEXT NOT NULL,
    "rewardCoins" INTEGER,
    "rewardProductName" TEXT,
    "rewardProductPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SackOpen_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SackOpen_userId_idx" ON "SackOpen"("userId");
CREATE INDEX IF NOT EXISTS "SackOpen_createdAt_idx" ON "SackOpen"("createdAt");

DO $$ BEGIN
  ALTER TABLE "SackOpen" ADD CONSTRAINT "SackOpen_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

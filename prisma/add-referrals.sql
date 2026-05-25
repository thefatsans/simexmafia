-- Referral system fields
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredById" TEXT,
  ADD COLUMN IF NOT EXISTS "referredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "referralRewardGiven" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

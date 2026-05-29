-- CreateTable
CREATE TABLE IF NOT EXISTS "GoofyCoinCashout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "coinsAmount" INTEGER NOT NULL,
    "euroAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "iban" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoofyCoinCashout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GoofyCoinCashout_userId_idx" ON "GoofyCoinCashout"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GoofyCoinCashout_status_idx" ON "GoofyCoinCashout"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GoofyCoinCashout" ADD CONSTRAINT "GoofyCoinCashout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

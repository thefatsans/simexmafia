-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductStockKey" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "orderItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStockKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductStockKey_orderItemId_idx" ON "ProductStockKey"("orderItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductStockKey_productId_usedAt_idx" ON "ProductStockKey"("productId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProductStockKey_productId_code_key" ON "ProductStockKey"("productId", "code");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ProductStockKey" ADD CONSTRAINT "ProductStockKey_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

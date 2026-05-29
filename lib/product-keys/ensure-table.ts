import { prisma } from '@/lib/prisma'

let tableReady: Promise<void> | null = null

/** Idempotent — legt ProductStockKey an, falls die Migration noch fehlt. */
export function ensureProductStockKeyTable(): Promise<void> {
  if (!prisma) {
    return Promise.resolve()
  }

  if (!tableReady) {
    tableReady = prisma
      .$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProductStockKey" (
          "id" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "usedAt" TIMESTAMP(3),
          "orderItemId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProductStockKey_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX IF NOT EXISTS "ProductStockKey_orderItemId_idx" ON "ProductStockKey"("orderItemId");
        CREATE INDEX IF NOT EXISTS "ProductStockKey_productId_usedAt_idx" ON "ProductStockKey"("productId", "usedAt");
        CREATE UNIQUE INDEX IF NOT EXISTS "ProductStockKey_productId_code_key" ON "ProductStockKey"("productId", "code");
      `)
      .then(() => undefined)
      .catch((error) => {
        tableReady = null
        throw error
      })
  }

  return tableReady
}

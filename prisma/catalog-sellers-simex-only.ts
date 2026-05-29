/**
 * Behält nur SimexMafia als Verkäufer, verknüpft alle Produkte damit
 * und synchronisiert Rating/Review-Count aus echten Reviews.
 * Run: npm run db:sellers-simex-only
 */
import { readFileSync } from 'fs'
import path from 'path'

if (!process.env.DATABASE_URL) {
  try {
    const envFile = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/)
    if (match) {
      process.env.DATABASE_URL = match[1]
    }
    if (envFile.includes('NODE_TLS_REJECT_UNAUTHORIZED=0')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }
  } catch {
    // optional
  }
}

if (process.env.DATABASE_URL?.includes('supabase') && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { SIMEXMAFIA_SELLER_ID } from '../lib/sellers'
import { syncSellerRatingFromReviews } from '../lib/sellers/sync-seller-rating'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    await prisma.seller.upsert({
      where: { id: SIMEXMAFIA_SELLER_ID },
      update: { name: 'SimexMafia', verified: true },
      create: {
        id: SIMEXMAFIA_SELLER_ID,
        name: 'SimexMafia',
        rating: 0,
        reviewCount: 0,
        verified: true,
      },
    })

    const relinked = await prisma.product.updateMany({
      where: { sellerId: { not: SIMEXMAFIA_SELLER_ID } },
      data: { sellerId: SIMEXMAFIA_SELLER_ID },
    })

    const removed = await prisma.seller.deleteMany({
      where: { id: { not: SIMEXMAFIA_SELLER_ID } },
    })

    await syncSellerRatingFromReviews(SIMEXMAFIA_SELLER_ID)

    const seller = await prisma.seller.findUnique({
      where: { id: SIMEXMAFIA_SELLER_ID },
    })

    console.log(`Relinked ${relinked.count} products to SimexMafia.`)
    console.log(`Removed ${removed.count} other sellers.`)
    console.log(
      `SimexMafia: rating=${seller?.rating ?? 0}, reviews=${seller?.reviewCount ?? 0}`
    )
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

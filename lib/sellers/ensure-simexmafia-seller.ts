import { prisma } from '@/lib/prisma'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'
import { syncSellerRatingFromReviews } from '@/lib/sellers/sync-seller-rating'

const SELLER_SETUP_CACHE_MS = 5 * 60 * 1000
let sellerSetupReadyAt = 0
let sellerSetupInFlight: Promise<void> | null = null

/** Seller + Discord-Verknüpfung — maximal einmal alle 5 Minuten pro Instanz. */
export async function ensureStorefrontSellerReady(): Promise<void> {
  if (Date.now() - sellerSetupReadyAt < SELLER_SETUP_CACHE_MS) {
    return
  }

  if (sellerSetupInFlight) {
    await sellerSetupInFlight
    return
  }

  sellerSetupInFlight = (async () => {
    await ensureSimexMafiaSellerInDatabase()
    await linkAllProductsToSimexMafia()
    await linkDiscordServerProductToSimexMafia()
    await removeNonSimexMafiaSellers()
    await syncSellerRatingFromReviews(SIMEXMAFIA_SELLER_ID)
    sellerSetupReadyAt = Date.now()
  })()

  try {
    await sellerSetupInFlight
  } finally {
    sellerSetupInFlight = null
  }
}

export async function ensureSimexMafiaSellerInDatabase() {
  if (!process.env.DATABASE_URL || !prisma) {
    return null
  }

  try {
    return await prisma.seller.upsert({
      where: { id: SIMEXMAFIA_SELLER_ID },
      update: {
        name: 'SimexMafia',
        verified: true,
      },
      create: {
        id: SIMEXMAFIA_SELLER_ID,
        name: 'SimexMafia',
        rating: 0,
        reviewCount: 0,
        verified: true,
      },
    })
  } catch (error) {
    console.warn('[Sellers] Could not upsert SimexMafia seller:', error)
    return null
  }
}

/** Alle Produkte dem Verkäufer SimexMafia zuordnen. */
export async function linkAllProductsToSimexMafia() {
  if (!process.env.DATABASE_URL || !prisma) {
    return
  }

  try {
    await ensureSimexMafiaSellerInDatabase()
    await prisma.product.updateMany({
      where: { sellerId: { not: SIMEXMAFIA_SELLER_ID } },
      data: { sellerId: SIMEXMAFIA_SELLER_ID },
    })
  } catch (error) {
    console.warn('[Sellers] Could not link products to SimexMafia:', error)
  }
}

/** Discord-Server-Produkt dem Verkäufer SimexMafia zuordnen */
export async function linkDiscordServerProductToSimexMafia() {
  if (!process.env.DATABASE_URL || !prisma) {
    return
  }

  try {
    await ensureSimexMafiaSellerInDatabase()

    await prisma.product.updateMany({
      where: {
        OR: [
          { name: { contains: 'Simex Geheimer Discord', mode: 'insensitive' } },
          { name: { contains: 'Geheimer Discord-Server', mode: 'insensitive' } },
        ],
      },
      data: {
        sellerId: SIMEXMAFIA_SELLER_ID,
      },
    })
  } catch (error) {
    console.warn('[Sellers] Could not link Discord product:', error)
  }
}

/** Entfernt alle Verkäufer außer SimexMafia (nach Produkt-Umverknüpfung). */
export async function removeNonSimexMafiaSellers() {
  if (!process.env.DATABASE_URL || !prisma) {
    return 0
  }

  await linkAllProductsToSimexMafia()

  const result = await prisma.seller.deleteMany({
    where: { id: { not: SIMEXMAFIA_SELLER_ID } },
  })

  return result.count
}

import { prisma } from '@/lib/prisma'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'

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
    await linkDiscordServerProductToSimexMafia()
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
        rating: 5.0,
        reviewCount: 847,
      },
      create: {
        id: SIMEXMAFIA_SELLER_ID,
        name: 'SimexMafia',
        rating: 5.0,
        reviewCount: 847,
        verified: true,
      },
    })
  } catch (error) {
    console.warn('[Sellers] Could not upsert SimexMafia seller:', error)
    return null
  }
}

/** Discord-Server-Produkt in der DB dem Verkäufer SimexMafia zuordnen */
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

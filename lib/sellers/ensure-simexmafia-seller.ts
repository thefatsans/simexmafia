import { prisma } from '@/lib/prisma'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'

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

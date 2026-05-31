import { prisma } from '@/lib/prisma'
import { ensureSimexMafiaSellerInDatabase } from '@/lib/sellers/ensure-simexmafia-seller'

export const VIRTUAL_SACK_PRODUCT_ID = 'virtual-sack-order'
export const VIRTUAL_GOOFYCOINS_PRODUCT_ID = 'virtual-goofycoins-order'

async function ensureVirtualProduct(
  id: string,
  name: string,
  category: string
): Promise<string> {
  if (!prisma) throw new Error('Database not available')

  const seller = await ensureSimexMafiaSellerInDatabase()
  if (!seller) throw new Error('Seller not available')

  await prisma.product.upsert({
    where: { id },
    create: {
      id,
      name,
      description: 'Interner Platzhalter für Bestellpositionen',
      price: 0,
      image: '/logo.png',
      category,
      platform: 'SimexMafia',
      sellerId: seller.id,
      inStock: true,
      tags: ['virtual', 'internal'],
    },
    update: {},
  })

  return id
}

export async function ensureVirtualSackProductId(): Promise<string> {
  return ensureVirtualProduct(VIRTUAL_SACK_PRODUCT_ID, 'Sack (virtuell)', 'sacks')
}

export async function ensureVirtualGoofyCoinsProductId(): Promise<string> {
  return ensureVirtualProduct(
    VIRTUAL_GOOFYCOINS_PRODUCT_ID,
    'GoofyCoins Paket (virtuell)',
    'in-game-currency'
  )
}

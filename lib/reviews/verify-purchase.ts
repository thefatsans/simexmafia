import { prisma } from '@/lib/prisma'

/** True wenn der Nutzer das Produkt in einer abgeschlossenen Bestellung gekauft hat. */
export async function userHasPurchasedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  if (!prisma) return false

  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: 'completed',
      items: {
        some: {
          productId,
          type: 'product',
        },
      },
    },
    select: { id: true },
  })

  return !!order
}

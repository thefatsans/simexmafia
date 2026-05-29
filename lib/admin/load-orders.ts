import { prisma } from '@/lib/prisma'

const ADMIN_ORDER_ITEM_SELECT = {
  id: true,
  productId: true,
  type: true,
  name: true,
  price: true,
  quantity: true,
  key: true,
} as const

export async function loadAdminOrders(limit = 100) {
  if (!prisma) {
    return []
  }

  const take = Math.min(Math.max(limit, 1), 100)

  return prisma.order.findMany({
    include: {
      items: {
        select: ADMIN_ORDER_ITEM_SELECT,
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export { ADMIN_ORDER_ITEM_SELECT }

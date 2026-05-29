import AdminOrdersClient from '@/components/admin/AdminOrdersClient'
import { getServerAdminSession } from '@/lib/admin/server-auth'
import { loadAdminOrders } from '@/lib/admin/load-orders'

export const revalidate = 15

function serializeOrders(orders: Awaited<ReturnType<typeof loadAdminOrders>>) {
  return orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    updatedAt: order.updatedAt.toISOString(),
  }))
}

export default async function AdminOrdersPage() {
  let initialOrders: Record<string, unknown>[] | null = null

  if (getServerAdminSession()) {
    try {
      initialOrders = serializeOrders(await loadAdminOrders(100)) as Record<string, unknown>[]
    } catch (error) {
      console.error('[Admin Orders] SSR load failed:', error)
    }
  }

  return <AdminOrdersClient initialOrders={initialOrders} />
}

import AdminProductsClient from '@/components/admin/AdminProductsClient'
import { getServerAdminSession } from '@/lib/admin/server-auth'
import { loadAdminProducts } from '@/lib/admin/load-products'

export const revalidate = 15

export default async function AdminProductsPage() {
  let initialProducts: Record<string, unknown>[] | null = null

  if (getServerAdminSession()) {
    try {
      initialProducts = (await loadAdminProducts(false)) as Record<string, unknown>[]
    } catch (error) {
      console.error('[Admin Products] SSR load failed:', error)
    }
  }

  return <AdminProductsClient initialProducts={initialProducts} />
}

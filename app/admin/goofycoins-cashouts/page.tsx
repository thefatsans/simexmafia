import AdminCashoutsClient from '@/components/admin/AdminCashoutsClient'
import { getServerAdminSession } from '@/lib/admin/server-auth'
import { loadAdminCashouts } from '@/lib/admin/load-cashouts'

export const revalidate = 15

export default async function AdminGoofyCoinCashoutsPage() {
  let initialItems = null

  if (getServerAdminSession()) {
    try {
      initialItems = await loadAdminCashouts('pending')
    } catch (error) {
      console.error('[Admin Cashouts] SSR load failed:', error)
    }
  }

  return <AdminCashoutsClient initialItems={initialItems} initialStatus="pending" />
}

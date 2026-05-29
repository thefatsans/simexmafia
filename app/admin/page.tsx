import AdminDashboardClient from '@/components/admin/AdminDashboardClient'
import { getServerAdminSession } from '@/lib/admin/server-auth'
import { loadAdminDashboardData } from '@/lib/admin/load-dashboard'

export const revalidate = 30

export default async function AdminPage() {
  let initialData = null

  if (getServerAdminSession()) {
    try {
      initialData = await loadAdminDashboardData()
    } catch (error) {
      console.error('[Admin Page] SSR dashboard load failed:', error)
    }
  }

  return <AdminDashboardClient initialData={initialData} />
}

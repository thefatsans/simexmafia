import AdminUsersClient from '@/components/admin/AdminUsersClient'
import { getServerAdminSession } from '@/lib/admin/server-auth'
import { loadAdminUsers } from '@/lib/admin/load-users'

export const revalidate = 15

export default async function AdminUsersPage() {
  let initialUsers = null
  let initialTotal = 0

  if (getServerAdminSession()) {
    try {
      const data = await loadAdminUsers({ limit: 100 })
      initialUsers = data.users
      initialTotal = data.total
    } catch (error) {
      console.error('[Admin Users] SSR load failed:', error)
    }
  }

  return <AdminUsersClient initialUsers={initialUsers} initialTotal={initialTotal} />
}

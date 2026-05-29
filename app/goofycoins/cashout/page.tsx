import GoofyCoinsCashoutClient from '@/components/goofycoins/GoofyCoinsCashoutClient'
import { getServerUserSession } from '@/lib/admin/server-auth'
import { loadUserCashouts } from '@/lib/goofycoins/load-user-cashouts'

export const revalidate = 15

export default async function GoofyCoinsCashoutPage() {
  const session = getServerUserSession()
  let initialRequests = null

  if (session?.userId) {
    try {
      initialRequests = await loadUserCashouts(session.userId)
    } catch (error) {
      console.error('[Cashout] SSR load failed:', error)
    }
  }

  return <GoofyCoinsCashoutClient initialRequests={initialRequests} />
}

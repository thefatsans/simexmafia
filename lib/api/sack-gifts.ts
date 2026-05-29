export type SackGiftItem = {
  id: string
  sackType: string
  sackName: string
  status: string
  message: string | null
  createdAt: string
  openedAt?: string | null
  sender?: { email: string; name: string } | null
  recipient?: { email: string; name: string } | null
}

export async function fetchPendingSackGifts(): Promise<SackGiftItem[]> {
  try {
    const res = await fetch('/api/sacks/gifts?type=received', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.gifts) ? data.gifts : []
  } catch {
    return []
  }
}

export async function sendSackGift(payload: {
  sackType: string
  recipientEmail: string
  message?: string
}): Promise<{ success: boolean; error?: string; newBalance?: number; code?: string }> {
  const res = await fetch('/api/sacks/gift', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, purchaseMethod: 'coins' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || 'Geschenk fehlgeschlagen', code: data.code }
  }
  return { success: true, newBalance: data.newBalance }
}

export async function openSackGift(
  giftId: string
): Promise<{ success: boolean; error?: string; reward?: unknown; newBalance?: number; sackType?: string; code?: string }> {
  const res = await fetch(`/api/sacks/gifts/${giftId}/open`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || 'Öffnen fehlgeschlagen', code: data.code }
  }
  return {
    success: true,
    reward: data.reward,
    newBalance: data.newBalance,
    sackType: data.sackType,
  }
}

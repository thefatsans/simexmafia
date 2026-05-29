'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { User } from '@/types/user'

type AdminGateState = 'loading' | 'no-user' | 'not-admin' | 'ready'

function readLocalUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const storedUser = localStorage.getItem('simexmafia-user')
    if (!storedUser) return null
    const parsed = JSON.parse(storedUser) as User & { password?: string }
    const { password: _, ...userData } = parsed
    return userData
  } catch {
    return null
  }
}

export function useAdminGate(): {
  user: User | null
  isLoading: boolean
  isReady: boolean
} {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading } = useAuth()
  const localUser = useMemo(() => readLocalUser(), [])
  const user = authUser ?? localUser

  const state: AdminGateState = useMemo(() => {
    if (!user && authLoading) return 'loading'
    if (!user) return 'no-user'
    if (!isAdmin(user.email)) return 'not-admin'
    return 'ready'
  }, [authLoading, user])

  useEffect(() => {
    if (state === 'no-user') {
      router.replace('/auth/login')
    } else if (state === 'not-admin') {
      router.replace('/account')
    }
  }, [state, router])

  return {
    user: state === 'ready' ? user : null,
    isLoading: state === 'loading',
    isReady: state === 'ready',
  }
}

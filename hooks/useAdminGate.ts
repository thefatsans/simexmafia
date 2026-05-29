'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { User } from '@/types/user'

type AdminGateState = 'loading' | 'no-user' | 'not-admin' | 'ready'

export function useAdminGate(): {
  user: User | null
  isLoading: boolean
  isReady: boolean
} {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const state: AdminGateState = useMemo(() => {
    if (authLoading) return 'loading'
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

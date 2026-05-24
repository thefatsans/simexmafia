'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User, calculateTier } from '@/types/user'
import {
  persistUserSession,
  hashPasswordClient,
  tryLocalLogin,
  registerLocal,
  syncLocalUserToDatabase,
} from '@/lib/auth-session'
import {
  loginAPI,
  registerAPI,
  googleLoginAPI,
  migratePasswordAPI,
  isDbUnavailableResponse,
} from '@/lib/api/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: (googleData: { email: string; name: string; picture?: string }) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  addCoins: (amount: number) => void
  subtractCoins: (amount: number) => boolean
  syncUserFromDatabase: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const storedUser = localStorage.getItem('simexmafia-user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        const { password: _, ...userData } = parsed
        setUser(userData as User)
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const applyLoggedInUser = useCallback((userData: User, passwordHash?: string, passwordPlain?: string) => {
    setUser(userData)
    persistUserSession(userData, passwordHash)
    if (passwordPlain) {
      syncLocalUserToDatabase(userData, passwordPlain).catch(() => {})
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const passwordHash = hashPasswordClient(password)

      const apiResult = await loginAPI(normalizedEmail, password)

      if (apiResult.success && apiResult.user) {
        applyLoggedInUser(apiResult.user, passwordHash, password)
        return { success: true }
      }

      // Konto in DB ohne Passwort → aus localStorage migrieren
      if (apiResult.code === 'NO_PASSWORD') {
        const localResult = tryLocalLogin(normalizedEmail, password)
        if (localResult.success && localResult.user) {
          await migratePasswordAPI(normalizedEmail, password)
          const retry = await loginAPI(normalizedEmail, password)
          if (retry.success && retry.user) {
            applyLoggedInUser(retry.user, passwordHash, password)
            return { success: true }
          }
          applyLoggedInUser(localResult.user, passwordHash, password)
          return { success: true }
        }
      }

      // Fallback: localStorage (DB down, User nur lokal, oder noch nicht in DB)
      const localResult = tryLocalLogin(normalizedEmail, password)
      if (localResult.success && localResult.user) {
        applyLoggedInUser(localResult.user, passwordHash, password)
        return { success: true }
      }

      if (isDbUnavailableResponse(apiResult)) {
        return {
          success: false,
          error: localResult.error || 'Anmeldung offline nicht möglich. Kein lokales Konto gefunden.',
        }
      }

      return {
        success: false,
        error: apiResult.error || localResult.error || 'Ungültige E-Mail oder Passwort',
      }
    } catch (error) {
      console.error('Login error:', error)
      const localResult = tryLocalLogin(email, password)
      if (localResult.success && localResult.user) {
        const passwordHash = hashPasswordClient(password)
        applyLoggedInUser(localResult.user, passwordHash, password)
        return { success: true }
      }
      return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
  }, [applyLoggedInUser])

  const loginWithGoogle = useCallback(async (
    googleData: { email: string; name: string; picture?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiResult = await googleLoginAPI({
        email: googleData.email,
        name: googleData.name,
        picture: googleData.picture,
      })

      if (apiResult.success && apiResult.user) {
        applyLoggedInUser(apiResult.user)
        return { success: true }
      }

      if (isDbUnavailableResponse(apiResult)) {
        return {
          success: false,
          error: 'Google-Anmeldung erfordert eine Datenbankverbindung.',
        }
      }

      return {
        success: false,
        error: apiResult.error || 'Google-Anmeldung fehlgeschlagen',
      }
    } catch (error) {
      console.error('Google login error:', error)
      return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
  }, [applyLoggedInUser])

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { sendWelcomeEmail } = await import('@/lib/email')

    try {
      if (!email || !password || !firstName || !lastName) {
        return { success: false, error: 'Bitte füllen Sie alle Felder aus' }
      }

      if (password.length < 6) {
        return { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein' }
      }

      const normalizedEmail = email.trim().toLowerCase()
      const passwordHash = hashPasswordClient(password)

      const apiResult = await registerAPI(
        normalizedEmail,
        password,
        firstName.trim(),
        lastName.trim()
      )

      if (apiResult.success && apiResult.user) {
        applyLoggedInUser(apiResult.user, passwordHash, password)
        sendWelcomeEmail(normalizedEmail, firstName).catch(() => {})
        return { success: true }
      }

      // E-Mail schon in DB → mit Passwort anmelden (z.B. nach Sync ohne Passwort)
      if (apiResult.error?.includes('bereits registriert')) {
        const loginResult = await loginAPI(normalizedEmail, password)
        if (loginResult.success && loginResult.user) {
          applyLoggedInUser(loginResult.user, passwordHash, password)
          return { success: true }
        }
      }

      // Fallback: localStorage wenn DB nicht erreichbar
      if (isDbUnavailableResponse(apiResult)) {
        const localRegister = registerLocal(
          normalizedEmail,
          password,
          firstName,
          lastName
        )

        if (localRegister.success && localRegister.user) {
          applyLoggedInUser(localRegister.user, passwordHash, password)
          sendWelcomeEmail(normalizedEmail, firstName).catch(() => {})
          return { success: true }
        }

        if (localRegister.error?.includes('bereits registriert')) {
          const localLogin = tryLocalLogin(normalizedEmail, password)
          if (localLogin.success && localLogin.user) {
            applyLoggedInUser(localLogin.user, passwordHash, password)
            return { success: true }
          }
          return {
            success: false,
            error: 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.',
          }
        }

        if (localRegister.error) {
          return { success: false, error: localRegister.error }
        }
      }

      return {
        success: false,
        error: apiResult.error || 'Registrierung fehlgeschlagen',
      }
    } catch (error) {
      console.error('Registration error:', error)

      const localRegister = registerLocal(email, password, firstName, lastName)
      if (localRegister.success && localRegister.user) {
        const passwordHash = hashPasswordClient(password)
        applyLoggedInUser(localRegister.user, passwordHash, password)
        return { success: true }
      }

      return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
  }, [applyLoggedInUser])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('simexmafia-user')
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    if (updates.goofyCoins !== undefined) {
      updatedUser.tier = calculateTier(updatedUser.goofyCoins)
    }
    setUser(updatedUser)
    persistUserSession(updatedUser)
  }, [user])

  const addCoins = useCallback((amount: number) => {
    if (!user || amount <= 0) return
    updateUser({ goofyCoins: user.goofyCoins + amount })
  }, [user, updateUser])

  const subtractCoins = useCallback((amount: number): boolean => {
    if (!user || amount <= 0) return false
    if (user.goofyCoins < amount) return false
    updateUser({ goofyCoins: user.goofyCoins - amount })
    return true
  }, [user, updateUser])

  const syncUserFromDatabase = useCallback(async () => {
    if (!user?.id) return

    try {
      const { getUserFromAPI } = await import('@/lib/api/users')
      const dbUser = await getUserFromAPI(user.id, {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      })

      if (dbUser && !dbUser.error) {
        const updatedUser: User = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          goofyCoins: dbUser.goofyCoins || 0,
          totalSpent: dbUser.totalSpent || 0,
          tier: dbUser.tier || 'Bronze',
          joinDate: dbUser.joinDate
            ? new Date(dbUser.joinDate).toISOString().split('T')[0]
            : user.joinDate,
          avatar: dbUser.avatar,
        }

        setUser(updatedUser)
        persistUserSession(updatedUser)
      }
    } catch (error) {
      console.error('[AuthContext] Error syncing user from database:', error)
    }
  }, [user?.id, user?.email, user?.firstName, user?.lastName, user?.joinDate])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
        addCoins,
        subtractCoins,
        syncUserFromDatabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

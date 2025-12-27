'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User, calculateTier } from '@/types/user'
import CryptoJS from 'crypto-js'

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
  subtractCoins: (amount: number) => boolean // Returns true if successful, false if insufficient coins
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface StoredUser extends User {
  password: string // In production, this would be hashed
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      // Initialize default test user if no users exist
      let usersJson = localStorage.getItem('simexmafia-users')
      if (!usersJson) {
        const defaultTestUser: StoredUser = {
          id: 'test-user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'password',
          goofyCoins: 500,
          totalSpent: 120.50,
          tier: calculateTier(500),
          joinDate: new Date().toISOString().split('T')[0],
          avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Test',
        }
        localStorage.setItem('simexmafia-users', JSON.stringify([defaultTestUser]))
      }

      const storedUser = localStorage.getItem('simexmafia-user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        // Remove password from user object
        const { password, ...userData } = parsed
        setUser(userData as User)
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Login attempt:', email)
      
      // Initialize default test user if no users exist
      let usersJson = localStorage.getItem('simexmafia-users')
      if (!usersJson) {
        console.log('No users found, creating default test user')
        const defaultTestUser: StoredUser = {
          id: 'test-user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'password',
          goofyCoins: 500,
          totalSpent: 120.50,
          tier: calculateTier(500),
          joinDate: new Date().toISOString().split('T')[0],
          avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Test',
        }
        localStorage.setItem('simexmafia-users', JSON.stringify([defaultTestUser]))
        usersJson = JSON.stringify([defaultTestUser])
        console.log('Default test user created')
      }

      const users: StoredUser[] = JSON.parse(usersJson)
      console.log('Users in storage:', users.length)
      
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
      console.log('Found user:', foundUser ? 'Yes' : 'No')

      if (!foundUser) {
        console.log('User not found')
        return { success: false, error: 'Ungültige E-Mail oder Passwort' }
      }

      // Hash the provided password and compare with stored hash
      const passwordHash = CryptoJS.SHA256(password).toString()
      if (foundUser.password !== passwordHash && foundUser.password !== password) {
        // Support both hashed and plain text passwords for migration
        console.log('Password mismatch')
        return { success: false, error: 'Ungültige E-Mail oder Passwort' }
      }
      
      // If password is plain text, hash it and update
      if (foundUser.password === password && password.length < 64) {
        foundUser.password = passwordHash
        const usersJson = localStorage.getItem('simexmafia-users')
        if (usersJson) {
          const users: StoredUser[] = JSON.parse(usersJson)
          const userIndex = users.findIndex(u => u.id === foundUser.id)
          if (userIndex !== -1) {
            users[userIndex] = foundUser
            localStorage.setItem('simexmafia-users', JSON.stringify(users))
          }
        }
      }

      // Remove password and set user
      const { password: _, ...userData } = foundUser
      console.log('Setting user:', userData.email)
      setUser(userData as User)
      localStorage.setItem('simexmafia-user', JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
  }, [])

  const loginWithGoogle = useCallback(async (
    googleData: { email: string; name: string; picture?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const usersJson = localStorage.getItem('simexmafia-users')
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : []

      // Split name into first and last name
      const nameParts = googleData.name.split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || ''

      // Check if user already exists
      let foundUser = users.find(u => u.email.toLowerCase() === googleData.email.toLowerCase())

      if (!foundUser) {
        // Create new user from Google account
        const newUser: StoredUser = {
          id: `user-${Date.now()}`,
          email: googleData.email.toLowerCase(),
          password: '', // No password for Google users
          firstName,
          lastName,
          goofyCoins: 100, // Welcome bonus
          totalSpent: 0,
          tier: 'Bronze',
          joinDate: new Date().toISOString().split('T')[0],
          avatar: googleData.picture,
        }

        users.push(newUser)
        localStorage.setItem('simexmafia-users', JSON.stringify(users))
        foundUser = newUser
      }

      // Remove password and set user
      const { password: _, ...userData } = foundUser
      // Update avatar if provided
      if (googleData.picture) {
        userData.avatar = googleData.picture
      }
      setUser(userData as User)
      localStorage.setItem('simexmafia-user', JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      console.error('Google login error:', error)
      return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
  }, [])

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Import email function dynamically to avoid SSR issues
    const { sendWelcomeEmail } = await import('@/lib/email')
    try {
      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return { success: false, error: 'Bitte füllen Sie alle Felder aus' }
      }

      if (password.length < 6) {
        return { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein' }
      }

      // Check if user already exists
      const usersJson = localStorage.getItem('simexmafia-users')
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : []

      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'Diese E-Mail ist bereits registriert' }
      }

      // Hash password before storing
      const passwordHash = CryptoJS.SHA256(password).toString()
      
      // Create new user
      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        password: passwordHash, // Store hashed password
        firstName,
        lastName,
        goofyCoins: 100, // Welcome bonus
        totalSpent: 0,
        tier: 'Bronze',
        joinDate: new Date().toISOString().split('T')[0],
      }

      // Save user to users list
      users.push(newUser)
      localStorage.setItem('simexmafia-users', JSON.stringify(users))

      // Remove password and set user
      const { password: _, ...userData } = newUser
      setUser(userData as User)
      localStorage.setItem('simexmafia-user', JSON.stringify(userData))

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, firstName).catch((error) => {
        console.error('Error sending welcome email:', error)
        // Don't fail registration if email fails
      })

      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Ein Fehler ist aufgetreten' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('simexmafia-user')
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    // Recalculate tier if coins changed
    if (updates.goofyCoins !== undefined) {
      updatedUser.tier = calculateTier(updatedUser.goofyCoins)
    }
    setUser(updatedUser)
    localStorage.setItem('simexmafia-user', JSON.stringify(updatedUser))

    // Also update in users list
    const usersJson = localStorage.getItem('simexmafia-users')
    if (usersJson) {
      const users: StoredUser[] = JSON.parse(usersJson)
      const userIndex = users.findIndex(u => u.id === user.id)
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates }
        if (updates.goofyCoins !== undefined) {
          users[userIndex].tier = calculateTier(updatedUser.goofyCoins)
        }
        localStorage.setItem('simexmafia-users', JSON.stringify(users))
      }
    }
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


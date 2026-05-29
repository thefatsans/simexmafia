'use client'

import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef, ReactNode } from 'react'
import { Product, CartItem } from '@/types'
import type { User } from '@/types/user'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCartFromAPI,
  addToCartAPI,
  updateCartItemAPI,
  removeFromCartAPI,
  clearCartAPI,
} from '@/lib/api/cart'

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function getCartProfile(user: User) {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [useAPI, setUseAPI] = useState(false)
  const loadedForUserRef = useRef<string | null>(null)
  const profile = useMemo(
    () => (user ? getCartProfile(user) : undefined),
    [user?.id, user?.email, user?.firstName, user?.lastName]
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true)
      return
    }

    const userKey = user?.id ?? 'guest'
    if (loadedForUserRef.current === userKey) return

    let cancelled = false

    const loadCart = async () => {
      try {
        if (user?.id) {
          try {
            const apiCart = await getCartFromAPI(user.id, profile)
            if (cancelled) return

            let mergedCart = apiCart
            const localCart = localStorage.getItem('simexmafia-cart')
            if (localCart) {
              try {
                const parsed = JSON.parse(localCart)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  for (const item of parsed) {
                    try {
                      await addToCartAPI(user.id, item.product, item.quantity, profile)
                    } catch {
                      // Ignore if already exists
                    }
                  }
                  mergedCart = await getCartFromAPI(user.id, profile)
                  localStorage.removeItem('simexmafia-cart')
                }
              } catch {
                // Ignore invalid local cart
              }
            }

            if (cancelled) return
            setCartItems(mergedCart)
            setUseAPI(true)
            loadedForUserRef.current = userKey
            return
          } catch (error) {
            console.warn('API not available, using localStorage:', error)
            setUseAPI(false)
          }
        }

        const savedCart = localStorage.getItem('simexmafia-cart')
        if (savedCart) {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed)) {
            setCartItems(parsed)
          }
        }
        loadedForUserRef.current = userKey
      } catch (error) {
        console.error('Error loading cart:', error)
        try {
          localStorage.removeItem('simexmafia-cart')
        } catch {
          // Ignore
        }
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    loadCart()

    return () => {
      cancelled = true
    }
  }, [user?.id, profile])

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || useAPI) return

    try {
      localStorage.setItem('simexmafia-cart', JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [cartItems, isLoaded, useAPI])

  const addToCart = useCallback(
    async (product: Product, quantity: number = 1) => {
      if (useAPI && user?.id) {
        try {
          const newItem = await addToCartAPI(user.id, product, quantity, profile)
          setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.product.id === product.id)
            if (existingItem) {
              return prevItems.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            }
            return [...prevItems, newItem]
          })
          return
        } catch (error) {
          console.warn('Failed to add to cart via API, using localStorage:', error)
          setUseAPI(false)
        }
      }

      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.product.id === product.id)
        if (existingItem) {
          return prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
        return [...prevItems, { product, quantity }]
      })
    },
    [useAPI, user?.id, profile]
  )

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (useAPI && user?.id) {
        const itemToRemove = cartItems.find((item) => item.product.id === productId)
        if (
          itemToRemove &&
          typeof itemToRemove === 'object' &&
          'id' in itemToRemove &&
          typeof itemToRemove.id === 'string'
        ) {
          try {
            await removeFromCartAPI(itemToRemove.id, user.id, profile)
            setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
            return
          } catch (error) {
            console.warn('Failed to remove from cart via API, using localStorage:', error)
            setUseAPI(false)
          }
        }
      }

      setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
    },
    [useAPI, user?.id, cartItems, profile]
  )

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId)
        return
      }

      if (useAPI && user?.id) {
        const itemToUpdate = cartItems.find((item) => item.product.id === productId)
        if (
          itemToUpdate &&
          typeof itemToUpdate === 'object' &&
          'id' in itemToUpdate &&
          typeof itemToUpdate.id === 'string'
        ) {
          try {
            const updatedItem = await updateCartItemAPI(
              itemToUpdate.id,
              quantity,
              user.id,
              profile
            )
            setCartItems((prevItems) =>
              prevItems.map((item) => (item.product.id === productId ? updatedItem : item))
            )
            return
          } catch (error) {
            console.warn('Failed to update cart via API, using localStorage:', error)
            setUseAPI(false)
          }
        }
      }

      setCartItems((prevItems) =>
        prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      )
    },
    [useAPI, user?.id, cartItems, removeFromCart, profile]
  )

  const clearCart = useCallback(async () => {
    if (useAPI && user?.id) {
      try {
        await clearCartAPI(user.id, profile)
        setCartItems([])
        return
      } catch (error) {
        console.warn('Failed to clear cart via API, using localStorage:', error)
        setUseAPI(false)
      }
    }

    setCartItems([])
  }, [useAPI, user?.id, profile])

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.product.price
      return total + itemPrice * item.quantity
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

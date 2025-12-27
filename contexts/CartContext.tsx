'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Product, CartItem } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getCartFromAPI, 
  addToCartAPI, 
  updateCartItemAPI, 
  removeFromCartAPI, 
  clearCartAPI 
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

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [useAPI, setUseAPI] = useState(false)

  // Load cart on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true)
      return
    }

    const loadCart = async () => {
      try {
        // Wenn User eingeloggt ist, versuche API zu verwenden
        if (user?.id) {
          try {
            const apiCart = await getCartFromAPI(user.id)
            setCartItems(apiCart)
            setUseAPI(true)
            setIsLoaded(true)
            return
          } catch (error) {
            console.warn('API not available, using localStorage:', error)
            setUseAPI(false)
          }
        }

        // Fallback: localStorage
        const savedCart = localStorage.getItem('simexmafia-cart')
        if (savedCart) {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed)) {
            setCartItems(parsed)
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        try {
          localStorage.removeItem('simexmafia-cart')
        } catch (e) {
          // Ignore
        }
      } finally {
        setIsLoaded(true)
      }
    }

    loadCart()
  }, [user?.id])

  // Wenn User sich einloggt, lade Cart von API
  useEffect(() => {
    if (user?.id && isLoaded) {
      const loadCartFromAPI = async () => {
        try {
          const apiCart = await getCartFromAPI(user.id)
          setCartItems(apiCart)
          setUseAPI(true)
          // Merge mit localStorage Cart falls vorhanden
          const localCart = localStorage.getItem('simexmafia-cart')
          if (localCart) {
            try {
              const parsed = JSON.parse(localCart)
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Füge localStorage Items zur API hinzu
                for (const item of parsed) {
                  try {
                    await addToCartAPI(user.id, item.product, item.quantity)
                  } catch (e) {
                    // Ignore if already exists
                  }
                }
                // Lade erneut von API
                const updatedCart = await getCartFromAPI(user.id)
                setCartItems(updatedCart)
                // Lösche localStorage
                localStorage.removeItem('simexmafia-cart')
              }
            } catch (e) {
              // Ignore
            }
          }
        } catch (error) {
          console.warn('API not available, using localStorage:', error)
          setUseAPI(false)
        }
      }
      loadCartFromAPI()
    } else if (!user && isLoaded) {
      setUseAPI(false)
    }
  }, [user?.id, isLoaded])

  // Save cart to localStorage wenn nicht API (Fallback)
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || useAPI) return
    
    try {
      localStorage.setItem('simexmafia-cart', JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [cartItems, isLoaded, useAPI])

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    // Wenn API verfügbar und User eingeloggt
    if (useAPI && user?.id) {
      try {
        const newItem = await addToCartAPI(user.id, product, quantity)
        setCartItems((prevItems) => {
          const existingItem = prevItems.find((item) => item.product.id === product.id)
          if (existingItem) {
            return prevItems.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          } else {
            return [...prevItems, newItem]
          }
        })
        return
      } catch (error) {
        console.warn('Failed to add to cart via API, using localStorage:', error)
        setUseAPI(false)
      }
    }

    // Fallback: localStorage
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prevItems, { product, quantity }]
      }
    })
  }, [useAPI, user?.id])

  const removeFromCart = useCallback(async (productId: string) => {
    // Wenn API verfügbar und User eingeloggt
    if (useAPI && user?.id) {
      const itemToRemove = cartItems.find((item) => item.product.id === productId)
      if (itemToRemove && typeof itemToRemove === 'object' && 'id' in itemToRemove && typeof itemToRemove.id === 'string') {
        try {
          await removeFromCartAPI(itemToRemove.id)
          setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
          return
        } catch (error) {
          console.warn('Failed to remove from cart via API, using localStorage:', error)
          setUseAPI(false)
        }
      }
    }

    // Fallback: localStorage
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }, [useAPI, user?.id, cartItems])

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    // Wenn API verfügbar und User eingeloggt
    if (useAPI && user?.id) {
      const itemToUpdate = cartItems.find((item) => item.product.id === productId)
      if (itemToUpdate && typeof itemToUpdate === 'object' && 'id' in itemToUpdate && typeof itemToUpdate.id === 'string') {
        try {
          const updatedItem = await updateCartItemAPI(itemToUpdate.id, quantity)
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.product.id === productId ? updatedItem : item
            )
          )
          return
        } catch (error) {
          console.warn('Failed to update cart via API, using localStorage:', error)
          setUseAPI(false)
        }
      }
    }

    // Fallback: localStorage
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }, [useAPI, user?.id, cartItems, removeFromCart])

  const clearCart = useCallback(async () => {
    // Wenn API verfügbar und User eingeloggt
    if (useAPI && user?.id) {
      try {
        await clearCartAPI(user.id)
        setCartItems([])
        return
      } catch (error) {
        console.warn('Failed to clear cart via API, using localStorage:', error)
        setUseAPI(false)
      }
    }

    // Fallback: localStorage
    setCartItems([])
  }, [useAPI, user?.id])

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Verwende originalPrice falls vorhanden, sonst price
      const itemPrice = item.product.originalPrice || item.product.price
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


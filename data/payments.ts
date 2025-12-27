export type PaymentMethod = 'credit-card' | 'paypal' | 'apple-pay' | 'google-pay' | 'cash' | 'goofycoins'

export interface PaymentDetails {
  method: PaymentMethod
  cardNumber?: string
  cardName?: string
  expiryDate?: string
  cvv?: string
  paypalEmail?: string
}

export interface OrderItem {
  id: string
  type: 'product' | 'sack' | 'goofycoins'
  name: string
  price: number
  quantity: number
  metadata?: Record<string, any> // Zusätzliche Daten (z.B. Sack-Typ, Produkt-ID)
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  subtotal: number
  serviceFee: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  completedAt?: string
  coinsEarned?: number
  discountCode?: string
}

const STORAGE_KEY = 'simexmafia-orders'

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
  // Versuche API zu verwenden
  try {
    const { createOrderAPI } = await import('@/lib/api/orders')
    const apiOrder = await createOrderAPI({
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      serviceFee: order.serviceFee,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      coinsEarned: order.coinsEarned || 0,
      discountCode: order.discountCode,
    })
    return {
      id: apiOrder.id,
      userId: apiOrder.userId,
      items: apiOrder.items,
      subtotal: apiOrder.subtotal,
      serviceFee: apiOrder.serviceFee,
      discount: apiOrder.discount,
      total: apiOrder.total,
      paymentMethod: apiOrder.paymentMethod as PaymentMethod,
      status: apiOrder.status as Order['status'],
      createdAt: apiOrder.createdAt,
      completedAt: apiOrder.completedAt,
      coinsEarned: apiOrder.coinsEarned,
      discountCode: apiOrder.discountCode,
    }
  } catch (error) {
    console.warn('API not available, using localStorage:', error)
  }

  // Fallback: localStorage
  const newOrder: Order = {
    ...order,
    id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
  
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      const orders = stored ? JSON.parse(stored) : []
      orders.push(newOrder)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    }
  } catch (error) {
    console.error('Error saving order:', error)
  }
  
  return newOrder
}

export const getOrders = (): Order[] => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading orders:', error)
    return []
  }
}

export const getOrderById = (orderId: string): Order | undefined => {
  const orders = getOrders()
  return orders.find(o => o.id === orderId)
}

export const getUserOrders = (userId: string): Order[] => {
  const orders = getOrders()
  return orders.filter(o => o.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  // Versuche API zu verwenden
  try {
    const { updateOrderStatusAPI } = await import('@/lib/api/orders')
    await updateOrderStatusAPI(orderId, status)
    return true
  } catch (error) {
    console.warn('API not available, using localStorage:', error)
  }

  // Fallback: localStorage
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      const orders = JSON.parse(stored)
      const order = orders.find((o: Order) => o.id === orderId)
      if (!order) return false
      
      order.status = status
      if (status === 'completed') {
        order.completedAt = new Date().toISOString()
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
      return true
    }
    return false
  } catch (error) {
    console.error('Error updating order:', error)
    return false
  }
}

export const processPayment = async (
  order: Order,
  paymentDetails: PaymentDetails
): Promise<{ success: boolean; orderId: string; error?: string; paymentIntentId?: string }> => {
  // Barzahlung wird direkt in handleSubmit behandelt
  if (paymentDetails.method === 'cash') {
    return {
      success: true,
      orderId: order.id,
    }
  }

  // Für Kreditkartenzahlung: Stripe ist erforderlich
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return {
      success: false,
      orderId: order.id,
      error: 'Kreditkartenzahlung ist derzeit nicht verfügbar. Bitte wählen Sie Barzahlung oder kontaktieren Sie uns.',
    }
  }

  try {
    // Erstelle Payment Intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: order.total,
        currency: 'eur',
        metadata: {
          orderId: order.id,
          userId: order.userId,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      updateOrderStatus(order.id, 'failed')
      return {
        success: false,
        orderId: order.id,
        error: error.error || 'Zahlung konnte nicht initiiert werden',
      }
    }

    const { clientSecret, paymentIntentId } = await response.json()

    // Für PayPal: Hier würde man zu PayPal weiterleiten
    if (paymentDetails.method === 'paypal') {
      return {
        success: false,
        orderId: order.id,
        error: 'PayPal-Zahlung ist derzeit nicht verfügbar.',
      }
    }

    return {
      success: true,
      orderId: order.id,
      paymentIntentId,
    }
  } catch (error: any) {
    console.error('Payment processing error:', error)
    updateOrderStatus(order.id, 'failed')
    return {
      success: false,
      orderId: order.id,
      error: error.message || 'Zahlung fehlgeschlagen',
    }
  }
}

export const confirmStripePayment = async (
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || 'Zahlung konnte nicht bestätigt werden',
      }
    }

    const data = await response.json()
    return {
      success: data.success,
      error: data.error,
    }
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return {
      success: false,
      error: error.message || 'Zahlungsbestätigung fehlgeschlagen',
    }
  }
}

export const validatePaymentDetails = (details: PaymentDetails): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  
  if (details.method === 'credit-card') {
    if (!details.cardNumber) {
      errors.cardNumber = 'Kartennummer ist erforderlich'
    } else if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(details.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Kartennummer ist ungültig'
    }
    
    if (!details.cardName) {
      errors.cardName = 'Karteninhaber-Name ist erforderlich'
    }
    
    if (!details.expiryDate) {
      errors.expiryDate = 'Ablaufdatum ist erforderlich'
    } else if (!/^\d{2}\/\d{2}$/.test(details.expiryDate)) {
      errors.expiryDate = 'Ablaufdatum muss im Format MM/YY sein'
    }
    
    if (!details.cvv) {
      errors.cvv = 'CVV ist erforderlich'
    } else if (!/^\d{3,4}$/.test(details.cvv)) {
      errors.cvv = 'CVV ist ungültig'
    }
  } else if (details.method === 'paypal') {
    if (!details.paypalEmail) {
      errors.paypalEmail = 'PayPal-E-Mail ist erforderlich'
    } else if (!/\S+@\S+\.\S+/.test(details.paypalEmail)) {
      errors.paypalEmail = 'E-Mail-Adresse ist ungültig'
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}



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
  key?: string // Digital key/code for the product
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
  statusReason?: string // Grund für fehlgeschlagen/storniert
  createdAt: string
  completedAt?: string
  coinsEarned?: number
  discountCode?: string
}

const STORAGE_KEY = 'simexmafia-orders'

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
  let createdOrder: Order
  
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
    createdOrder = {
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
    console.log('[createOrder] Order created via API:', {
      orderId: createdOrder.id,
      userId: createdOrder.userId
    })
  } catch (error) {
    console.warn('[createOrder] API not available, using localStorage:', error)
    // Fallback: localStorage
    createdOrder = {
      ...order,
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }
  }

  // WICHTIG: Speichere IMMER im localStorage, auch wenn die API erfolgreich war
  // Das stellt sicher, dass die Bestellungen im Admin-Panel angezeigt werden
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      const orders = stored ? JSON.parse(stored) : []
      
      // Prüfe, ob die Bestellung bereits existiert (z.B. von der API)
      const existingIndex = orders.findIndex((o: Order) => o.id === createdOrder.id)
      if (existingIndex >= 0) {
        // Aktualisiere bestehende Bestellung
        orders[existingIndex] = createdOrder
      } else {
        // Füge neue Bestellung hinzu
        orders.push(createdOrder)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
      console.log('[createOrder] Order saved to localStorage:', {
        orderId: createdOrder.id,
        userId: createdOrder.userId,
        totalOrders: orders.length,
        allOrderIds: orders.map((o: Order) => o.id)
      })
    }
  } catch (error) {
    console.error('[createOrder] Error saving order to localStorage:', error)
  }
  
  return createdOrder
}

export const getOrders = (): Order[] => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      console.log('[getOrders] No orders in localStorage')
      return []
    }
    const orders = JSON.parse(stored)
    console.log('[getOrders] Loaded orders from localStorage:', {
      count: orders.length,
      orderIds: orders.map((o: Order) => o.id),
      userIds: [...new Set(orders.map((o: Order) => o.userId))]
    })
    return orders
  } catch (error) {
    console.error('[getOrders] Error loading orders:', error)
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
  // WICHTIG: Testzahlungen für Säcke und GoofyCoins deaktivieren
  const isSackPurchase = order.items.some(item => item.type === 'sack')
  const isGoofyCoinsPurchase = order.items.some(item => item.type === 'goofycoins')
  
  if (isSackPurchase || isGoofyCoinsPurchase) {
    // Für Säcke und GoofyCoins: Nur echte Zahlungen erlauben
    if (paymentDetails.method === 'cash') {
      return {
        success: false,
        orderId: order.id,
        error: 'Barzahlung ist für Säcke und GoofyCoins nicht verfügbar. Bitte verwenden Sie PayPal oder eine Kreditkarte.',
      }
    }
    
    // Für Kreditkartenzahlung: Stripe ist erforderlich
    if (paymentDetails.method === 'credit-card') {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        return {
          success: false,
          orderId: order.id,
          error: 'Kreditkartenzahlung ist derzeit nicht verfügbar. Bitte verwenden Sie PayPal.',
        }
      }
    }
    
    // Für PayPal: Weiterleitung zu PayPal erforderlich
    if (paymentDetails.method === 'paypal') {
      const paypalLink = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK || 'https://paypal.me/SimexMafia'
      // PayPal-Link wird in PaymentCheckout verwendet
    }
  }
  
  // Barzahlung wird direkt in handleSubmit behandelt (nur für normale Produkte)
  if (paymentDetails.method === 'cash') {
    return {
      success: true,
      orderId: order.id,
    }
  }

  // Kreditkartenzahlung ist nicht mehr verfügbar
  if (paymentDetails.method === 'credit-card') {
    return {
      success: false,
      orderId: order.id,
      error: 'Kreditkartenzahlung ist nicht mehr verfügbar. Bitte verwenden Sie PayPal oder Barzahlung.',
    }
  }

  // Für PayPal: Weiterleitung zu PayPal (wird in PaymentCheckout behandelt)
  if (paymentDetails.method === 'paypal') {
    // PayPal-Weiterleitung wird in PaymentCheckout.tsx behandelt
    // Hier geben wir success: true zurück, damit die Weiterleitung stattfinden kann
    return {
      success: true,
      orderId: order.id,
    }
  }

  // Fallback für unbekannte Zahlungsmethoden
  return {
    success: false,
    orderId: order.id,
    error: 'Unbekannte Zahlungsmethode',
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
  
  // Kreditkartenzahlung ist nicht mehr verfügbar
  if (details.method === 'credit-card') {
    errors.method = 'Kreditkartenzahlung ist nicht mehr verfügbar. Bitte verwenden Sie PayPal oder Barzahlung.'
  }
  
  if (details.method === 'paypal') {
    // PayPal-E-Mail ist optional, da wir zu PayPal weiterleiten
    // Keine Validierung erforderlich
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}



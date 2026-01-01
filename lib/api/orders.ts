import { OrderItem } from '@/data/payments'

interface Order {
  id: string
  userId: string
  items: OrderItem[]
  subtotal: number
  serviceFee: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  coinsEarned: number
  discountCode?: string
  createdAt: string
  completedAt?: string
}

// Verwende relative URLs für lokale API-Routen
// In Production kann NEXT_PUBLIC_API_URL gesetzt werden für externe API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Ruft Bestellungen von der API ab
 * Fallback: Verwendet localStorage wenn API nicht verfügbar
 */
export async function getOrdersFromAPI(userId: string): Promise<Order[]> {
  try {
    if (!userId) {
      throw new Error('userId is required')
    }
    
    const params = `?userId=${userId}`
    const response = await fetch(`${API_BASE_URL}/api/orders${params}`, {
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders')
    }

    const data = await response.json()
    
    return data.map((order: any) => ({
      id: order.id,
      userId: order.userId,
      items: order.items.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        metadata: item.metadata,
        productId: item.productId,
        key: item.key,
      })),
      subtotal: order.subtotal,
      serviceFee: order.serviceFee,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      statusReason: order.statusReason,
      coinsEarned: order.coinsEarned,
      discountCode: order.discountCode,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      updatedAt: order.updatedAt,
    }))
  } catch (error) {
    console.warn('API not available, using localStorage fallback:', error)
    // Fallback zu localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('simexmafia-orders')
      if (stored) {
        try {
          const orders = JSON.parse(stored)
          return userId ? orders.filter((o: Order) => o.userId === userId) : orders
        } catch (e) {
          return []
        }
      }
    }
    return []
  }
}

/**
 * Erstellt eine neue Bestellung (API)
 */
export async function createOrderAPI(orderData: {
  userId: string
  items: OrderItem[]
  subtotal: number
  serviceFee: number
  discount: number
  total: number
  paymentMethod: string
  coinsEarned: number
  discountCode?: string
}): Promise<Order> {
  try {
    const url = API_BASE_URL ? `${API_BASE_URL}/api/orders` : `/api/orders`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    return {
      id: data.id,
      userId: data.userId,
      items: data.items.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        metadata: item.metadata,
        productId: item.productId,
        key: item.key,
      })),
      subtotal: data.subtotal,
      serviceFee: data.serviceFee,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.paymentMethod,
      status: data.status,
      coinsEarned: data.coinsEarned,
      discountCode: data.discountCode,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
    }
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}

/**
 * Aktualisiert Bestellstatus (API)
 * WICHTIG: Nur Admins können den Status ändern
 */
export async function updateOrderStatusAPI(
  orderId: string, 
  status: string, 
  statusReason?: string,
  userId?: string
): Promise<Order> {
  try {
    const url = API_BASE_URL ? `${API_BASE_URL}/api/orders/${orderId}` : `/api/orders/${orderId}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status, statusReason, userId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update order status: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    return {
      id: data.id,
      userId: data.userId,
      items: data.items,
      subtotal: data.subtotal,
      serviceFee: data.serviceFee,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.paymentMethod,
      status: data.status,
      statusReason: (data as any).statusReason,
      coinsEarned: data.coinsEarned,
      discountCode: data.discountCode,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
      updatedAt: data.updatedAt,
    } as any
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}









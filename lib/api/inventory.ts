import { InventoryItem } from '@/data/inventory'

// Hole alle Inventar-Items für einen User
export async function getInventoryFromAPI(userId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/inventory?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch inventory')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching inventory from API:', error)
    throw error
  }
}

// Füge ein neues Inventar-Item hinzu
export async function addInventoryItemToAPI(data: {
  productId: string
  source: string
  orderId?: string
  sourceId?: string
  notes?: string
  userId: string
}): Promise<any> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to add inventory item')
    }

    return await response.json()
  } catch (error) {
    console.error('Error adding inventory item to API:', error)
    throw error
  }
}

// Aktualisiere ein Inventar-Item
export async function updateInventoryItemAPI(
  itemId: string,
  userId: string,
  data: {
    sourceId?: string
    orderId?: string
    notes?: string
  }
): Promise<any> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        itemId,
        userId,
        ...data,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update inventory item')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating inventory item in API:', error)
    throw error
  }
}

// Aktualisiere mehrere Inventar-Items auf einmal
export async function bulkUpdateInventoryItemsAPI(
  userId: string,
  updates: Array<{ itemId: string; sourceId?: string; orderId?: string }>
): Promise<{ success: boolean; updated: number }> {
  try {
    const response = await fetch('/api/inventory/bulk-update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, updates }),
    })

    if (!response.ok) {
      throw new Error('Failed to bulk update inventory items')
    }

    return await response.json()
  } catch (error) {
    console.error('Error bulk updating inventory items in API:', error)
    throw error
  }
}


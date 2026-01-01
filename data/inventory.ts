import { Product } from '@/types'
import { getCompleteProductImage } from '@/prisma/complete-product-images'

// Hilfsfunktion: Prüft ob eine sourceId eine gültige Order-ID ist (ORD- oder CUID)
const isOrderId = (sourceId: string | undefined | null): boolean => {
  if (!sourceId) return false
  return sourceId.startsWith('ORD-') || sourceId.length > 10
}

export interface InventoryItem {
  id: string
  product: Product
  obtainedAt: string
  obtainedFrom: 'sack' | 'purchase' | 'gift' | 'other'
  sourceId?: string // z.B. Sack-ID oder Bestell-ID
  sourceName?: string // z.B. "Gold Sack" oder "Kauf"
  isRedeemed: boolean
  redeemedAt?: string
  redemptionCode?: string // Der generierte Code/Key
  isPending?: boolean // true wenn Bestellung noch nicht bestätigt wurde
}

const STORAGE_KEY = 'simexmafia-inventory'
const DELETED_ITEMS_KEY = 'simexmafia-inventory-deleted'

// Synchron version (für Rückwärtskompatibilität)
export const addToInventory = (
  product: Product,
  source: InventoryItem['obtainedFrom'],
  sourceId?: string,
  sourceName?: string
): InventoryItem => {
  try {
    const inventory = getInventory()
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product,
      obtainedAt: new Date().toISOString(),
      obtainedFrom: source,
      sourceId,
      sourceName,
      isRedeemed: false,
    }
    
    const updated = [newItem, ...inventory]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newItem
  } catch (error) {
    console.error('Error adding to inventory:', error)
    throw error
  }
}

// Async version mit Datenbank-Speicherung
export const addToInventoryAsync = async (
  product: Product,
  source: InventoryItem['obtainedFrom'],
  sourceId?: string,
  sourceName?: string,
  userId?: string
): Promise<InventoryItem> => {
  try {
    // Speichere zuerst in localStorage (synchron)
    const newItem = addToInventory(product, source, sourceId, sourceName)
    
    // Speichere auch in der Datenbank, wenn userId vorhanden ist
    if (userId) {
      try {
        const { addInventoryItemToAPI } = await import('@/lib/api/inventory')
        const dbItem = await addInventoryItemToAPI({
          productId: product.id,
          source: source === 'purchase' ? 'purchase' : source === 'sack' ? 'sack' : 'reward',
          orderId: sourceId && sourceId.startsWith('ORD-') ? sourceId : undefined,
          sourceId: sourceId || undefined,
          notes: sourceName || undefined,
          userId,
        })
        // Aktualisiere die ID im localStorage Item
        newItem.id = dbItem.id
        const inventory = getInventory()
        const updated = inventory.map(item => item.id === newItem.id ? { ...item, id: dbItem.id } : item)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        console.log('[Inventory] Added item to database:', dbItem.id)
      } catch (dbError) {
        console.error('[Inventory] Error adding item to database:', dbError)
        // Fallback: localStorage wurde bereits gespeichert
      }
    }
    
    return newItem
  } catch (error) {
    console.error('Error adding to inventory:', error)
    throw error
  }
}

export const getInventory = (): InventoryItem[] => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const inventory = JSON.parse(stored)
    if (!Array.isArray(inventory)) return []
    
    // Aktualisiere Produktbilder mit den neuesten URLs
    let hasUpdates = false
    const updatedInventory = inventory.map((item: InventoryItem) => {
      if (item.product && item.product.name) {
        const latestImage = getCompleteProductImage(item.product.name)
        if (latestImage && item.product.image !== latestImage) {
          hasUpdates = true
          return {
            ...item,
            product: {
              ...item.product,
              image: latestImage,
            },
          }
        }
      }
      return item
    })
    
    // Speichere aktualisierte Bilder zurück in localStorage
    if (hasUpdates) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInventory))
    }
    
    return updatedInventory
  } catch (error) {
    console.error('Error loading inventory:', error)
    return []
  }
}

export const getUnredeemedInventory = (): InventoryItem[] => {
  return getInventory().filter(item => !item.isRedeemed)
}

export const getRedeemedInventory = (): InventoryItem[] => {
  return getInventory().filter(item => item.isRedeemed)
}

// Prüfe ob ein Item "pending" ist (Bestellung noch nicht completed)
export const isItemPending = (item: InventoryItem): boolean => {
  if (!item.sourceId || !item.sourceId.startsWith('ORD-')) {
    return false // Keine Bestell-ID = nicht pending
  }
  
  try {
    const { getOrderById } = require('@/data/payments')
    const order = getOrderById(item.sourceId)
    
    if (!order) {
      return false // Bestellung nicht gefunden = nicht pending
    }
    
    return order.status !== 'completed'
  } catch (error) {
    console.error('Error checking if item is pending:', error)
    return false
  }
}

// Generiere einen Produktcode/Key
const generateRedemptionCode = (): string => {
  // Format: XXXX-XXXX-XXXX-XXXX
  const segments = 4
  const charsPerSegment = 4
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Ohne I, O, 0, 1 für bessere Lesbarkeit
  
  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: charsPerSegment }, () => {
      return chars[Math.floor(Math.random() * chars.length)]
    }).join('')
  }).join('-')
  
  return code
}

// ASYNC VERSION: Verwendet API und echten Key aus Bestellung
export const redeemItemAsync = async (itemId: string, userId?: string): Promise<string | null> => {
  try {
    const inventory = getInventory()
    const item = inventory.find(i => i.id === itemId)
    
    if (!item || item.isRedeemed) {
      return null
    }
    
    // WICHTIG: Für Produkte mit Bestell-ID: Hole echten Key aus Bestellung
    if (item.sourceId && item.sourceId.startsWith('ORD-')) {
      try {
        // Versuche API zu verwenden
        if (!userId) {
          // Fallback zu localStorage wenn kein userId verfügbar
          const { getOrderById } = await import('@/data/payments')
          const order = getOrderById(item.sourceId)
          if (!order) {
            throw new Error('Bestellung nicht gefunden.')
          }
          if (order.status !== 'completed') {
            throw new Error('Die Bestellung ist noch nicht abgeschlossen. Bitte warten Sie, bis die Bestellung bestätigt wurde und der Key eingefügt wurde.')
          }
          const orderItem = order.items?.find((oi: any) => 
            oi.productId === item.product.id || oi.name === item.product.name
          )
          if (!orderItem || !orderItem.key) {
            throw new Error('Key noch nicht verfügbar. Bitte warten Sie, bis der Admin den Key eingefügt hat.')
          }
          const key = orderItem.key
          item.isRedeemed = true
          item.redeemedAt = new Date().toISOString()
          item.redemptionCode = key
          localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
          return key
        }
        const { getOrdersFromAPI } = await import('@/lib/api/orders')
        const orders = await getOrdersFromAPI(userId)
        const order = orders.find((o: any) => o.id === item.sourceId)
        
        if (!order) {
          console.error('Order not found for item:', itemId)
          throw new Error('Bestellung nicht gefunden.')
        }
        
        if (order.status !== 'completed') {
          throw new Error('Die Bestellung ist noch nicht abgeschlossen. Bitte warten Sie, bis die Bestellung bestätigt wurde und der Key eingefügt wurde.')
        }
        
        // Finde das OrderItem mit dem passenden Produkt
        const orderItem = order.items?.find((oi: any) => 
          oi.productId === item.product.id || oi.name === item.product.name
        )
        
        if (!orderItem || !orderItem.key) {
          throw new Error('Key noch nicht verfügbar. Bitte warten Sie, bis der Admin den Key eingefügt hat.')
        }
        
        // Verwende den echten Key aus der Bestellung
        const key = orderItem.key
        
        item.isRedeemed = true
        item.redeemedAt = new Date().toISOString()
        item.redemptionCode = key // Verwende echten Key, nicht generierten Code
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
        return key
      } catch (apiError: any) {
        // Fallback: localStorage
        const { getOrderById } = await import('@/data/payments')
        const order = getOrderById(item.sourceId)
        
        if (!order) {
          console.error('Order not found for item:', itemId)
          throw new Error('Bestellung nicht gefunden.')
        }
        
        if (order.status !== 'completed') {
          throw new Error('Die Bestellung ist noch nicht abgeschlossen. Bitte warten Sie, bis die Bestellung bestätigt wurde und der Key eingefügt wurde.')
        }
        
        // Finde das OrderItem mit dem passenden Produkt
        const orderItem = order.items?.find((oi: any) => 
          oi.metadata?.productId === item.product.id || oi.name === item.product.name
        )
        
        if (!orderItem || !(orderItem as any).key) {
          throw new Error('Key noch nicht verfügbar. Bitte warten Sie, bis der Admin den Key eingefügt hat.')
        }
        
        // Verwende den echten Key aus der Bestellung
        const key = (orderItem as any).key
        
        item.isRedeemed = true
        item.redeemedAt = new Date().toISOString()
        item.redemptionCode = key // Verwende echten Key, nicht generierten Code
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
        return key
      }
    }
    
    // Für Items ohne Bestell-ID (z.B. aus Säcken): Generiere einen Code
    const code = generateRedemptionCode()
    
    item.isRedeemed = true
    item.redeemedAt = new Date().toISOString()
    item.redemptionCode = code
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
    return code
  } catch (error: any) {
    console.error('Error redeeming item:', error)
    throw error // Wirf den Fehler weiter, damit handleRedeem ihn behandeln kann
  }
}

// SYNCHRON VERSION (für Rückwärtskompatibilität - verwendet nur localStorage)
export const redeemItem = (itemId: string): string | null => {
  try {
    const inventory = getInventory()
    const item = inventory.find(i => i.id === itemId)
    
    if (!item || item.isRedeemed) {
      return null
    }
    
    // WICHTIG: Für Produkte mit Bestell-ID: Prüfe ob Bestellung "completed" ist
    // Dies gilt sowohl für gekaufte Produkte als auch für Produkte aus Säcken, die mit Echtgeld gekauft wurden
    if (item.sourceId && item.sourceId.startsWith('ORD-')) {
      // Synchron importieren (getOrderById ist synchron)
      const { getOrderById } = require('@/data/payments')
      const order = getOrderById(item.sourceId)
      
      if (!order) {
        console.error('Order not found for item:', itemId)
        return null
      }
      
      if (order.status !== 'completed') {
        // Bestellung ist noch nicht "completed" - Einlösung nicht erlaubt
        throw new Error('Die Bestellung ist noch nicht abgeschlossen. Bitte warten Sie, bis die Bestellung bestätigt wurde und der Key eingefügt wurde.')
      }
      
      // Finde das OrderItem mit dem passenden Produkt
      const orderItem = order.items?.find((oi: any) => 
        oi.metadata?.productId === item.product.id || oi.name === item.product.name
      )
      
      if (!orderItem || !(orderItem as any).key) {
        throw new Error('Key noch nicht verfügbar. Bitte warten Sie, bis der Admin den Key eingefügt hat.')
      }
      
      // Verwende den echten Key aus der Bestellung
      const key = (orderItem as any).key
      
      item.isRedeemed = true
      item.redeemedAt = new Date().toISOString()
      item.redemptionCode = key // Verwende echten Key, nicht generierten Code
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
      return key
    }
    
    // Für Items ohne Bestell-ID (z.B. aus Säcken): Generiere einen Code
    const code = generateRedemptionCode()
    
    item.isRedeemed = true
    item.redeemedAt = new Date().toISOString()
    item.redemptionCode = code
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
    return code
  } catch (error) {
    console.error('Error redeeming item:', error)
    return null
  }
}

export const removeFromInventory = (itemId: string): boolean => {
  try {
    const inventory = getInventory()
    const itemToRemove = inventory.find(i => i.id === itemId)
    
    if (!itemToRemove) {
      return false
    }
    
    // Entferne das Item aus dem Inventar
    const updated = inventory.filter(i => i.id !== itemId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    
    // Speichere die Kombination aus productId und sourceId als "gelöscht"
    // Damit wird verhindert, dass syncOrdersToInventory es wieder hinzufügt
    if (itemToRemove.obtainedFrom === 'purchase' && itemToRemove.sourceName === 'Kauf') {
      const deletedItems = getDeletedItems()
      // Verwende sourceId wenn vorhanden, sonst 'no-source'
      const sourceId = itemToRemove.sourceId || 'no-source'
      const deletedKey = `${itemToRemove.product.id}-${sourceId}`
      
      console.log(`[Inventory] Removing item: productId=${itemToRemove.product.id}, sourceId=${sourceId}, deletedKey=${deletedKey}`)
      
      if (!deletedItems.has(deletedKey)) {
        deletedItems.add(deletedKey)
        const deletedArray = Array.from(deletedItems)
        localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deletedArray))
        console.log(`[Inventory] Marked item as deleted: ${deletedKey}. Total deleted items: ${deletedArray.length}`)
        console.log(`[Inventory] Deleted items list:`, deletedArray)
      } else {
        console.log(`[Inventory] Item already marked as deleted: ${deletedKey}`)
      }
    } else {
      console.log(`[Inventory] Item not from purchase, not adding to deleted list (obtainedFrom: ${itemToRemove.obtainedFrom}, sourceName: ${itemToRemove.sourceName})`)
    }
    
    return true
  } catch (error) {
    console.error('Error removing from inventory:', error)
    return false
  }
}

// Hilfsfunktion: Hole die Liste der gelöschten Items
const getDeletedItems = (): Set<string> => {
  try {
    if (typeof window === 'undefined') return new Set()
    const stored = localStorage.getItem(DELETED_ITEMS_KEY)
    if (!stored) {
      console.log('[Inventory] No deleted items list found')
      return new Set()
    }
    const deleted = JSON.parse(stored)
    if (!Array.isArray(deleted)) {
      console.warn('[Inventory] Deleted items list is not an array')
      return new Set()
    }
    console.log(`[Inventory] Loaded ${deleted.length} deleted items:`, deleted)
    return new Set(deleted)
  } catch (error) {
    console.error('Error loading deleted items:', error)
    return new Set()
  }
}

export const clearInventory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    // Lösche auch die Liste der gelöschten Items
    localStorage.removeItem(DELETED_ITEMS_KEY)
    console.log('[Inventory] Cleared inventory and deleted items list')
  } catch (error) {
    console.error('Error clearing inventory:', error)
  }
}

export const getInventoryStatistics = () => {
  const inventory = getInventory()
  const unredeemed = getUnredeemedInventory()
  const redeemed = getRedeemedInventory()
  
  const totalValue = inventory.reduce((sum, item) => sum + item.product.price, 0)
  const unredeemedValue = unredeemed.reduce((sum, item) => sum + item.product.price, 0)
  const redeemedValue = redeemed.reduce((sum, item) => sum + item.product.price, 0)
  
  const sourceCounts = {
    sack: inventory.filter(i => i.obtainedFrom === 'sack').length,
    purchase: inventory.filter(i => i.obtainedFrom === 'purchase').length,
    gift: inventory.filter(i => i.obtainedFrom === 'gift').length,
    other: inventory.filter(i => i.obtainedFrom === 'other').length,
  }
  
  return {
    total: inventory.length,
    unredeemed: unredeemed.length,
    redeemed: redeemed.length,
    totalValue,
    unredeemedValue,
    redeemedValue,
    sourceCounts,
  }
}

/**
 * Synchronisiert Bestellungen aus der API mit dem Inventar
 * Fügt fehlende Produkte hinzu, die aus Bestellungen stammen
 */
export const syncOrdersToInventory = async (userId: string): Promise<number> => {
  try {
    // Hole Bestellungen aus der API
    const { getOrdersFromAPI } = await import('@/lib/api/orders')
    const orders = await getOrdersFromAPI(userId)
    
    // Hole aktuelles Inventar
    const inventory = getInventory()
    
    // Erstelle Set von bereits vorhandenen Inventar-Items (basierend auf sourceId)
    // Verwende eine eindeutige Kombination aus sourceId, productId und id, um Duplikate zu vermeiden
    const existingOrderItems = new Set(
      inventory
        .filter(item => isOrderId(item.sourceId))
        .map(item => `${item.sourceId}-${item.product.id}`)
    )
    
    // Erstelle auch ein Set von allen vorhandenen Item-IDs, um Duplikate zu vermeiden
    const existingItemIds = new Set(inventory.map(item => item.id))
    
    // Finde Items ohne sourceId, die möglicherweise von Bestellungen stammen
    const itemsWithoutSourceId = inventory.filter(item => 
      !item.sourceId && item.obtainedFrom === 'purchase' && item.sourceName === 'Kauf'
    )
    
    let addedCount = 0
    let updatedCount = 0
    
    // Versuche Items ohne sourceId zuzuordnen
    for (const item of itemsWithoutSourceId) {
      const matchingOrder = orders.find(order => 
        order.items.some((oi: any) => 
          (oi.productId === item.product.id || oi.name === item.product.name) &&
          order.status !== 'failed' && order.status !== 'cancelled'
        )
      )
      
      if (matchingOrder) {
        // Aktualisiere das Item mit der sourceId
        const itemIndex = inventory.findIndex(i => i.id === item.id)
        if (itemIndex !== -1) {
          inventory[itemIndex].sourceId = matchingOrder.id
          updatedCount++
        }
      }
    }
    
    // Speichere aktualisierte Items
    if (updatedCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
      console.log(`[Inventory Sync] Updated ${updatedCount} items with sourceId`)
    }
    
    // Gehe durch alle Bestellungen
    for (const order of orders) {
      // Nur Bestellungen mit Status "pending", "processing" oder "completed" synchronisieren
      // (nicht "failed" oder "cancelled")
      if (order.status === 'failed' || order.status === 'cancelled') {
        continue
      }
      
      // Gehe durch alle Items in der Bestellung
      for (const orderItem of order.items) {
        // Nur Produkt-Items (nicht Säcke oder GoofyCoins)
        if (orderItem.type !== 'product' || !(orderItem as any).productId) {
          continue
        }
        
        // Prüfe ob dieses Item vom Benutzer gelöscht wurde
        const deletedItems = getDeletedItems()
        const productId = (orderItem as any).productId
        const deletedKey = `${productId}-${order.id}`
        const deletedKeyNoSource = `${productId}-no-source`
        
        console.log(`[Inventory Sync] Checking if product ${productId} from order ${order.id} is deleted. Key: ${deletedKey}, Deleted: ${deletedItems.has(deletedKey)}`)
        console.log(`[Inventory Sync] Also checking no-source key: ${deletedKeyNoSource}, Deleted: ${deletedItems.has(deletedKeyNoSource)}`)
        
        // Prüfe sowohl mit sourceId als auch ohne (für Items die gelöscht wurden bevor sie eine sourceId hatten)
        if (deletedItems.has(deletedKey) || deletedItems.has(deletedKeyNoSource)) {
          console.log(`[Inventory Sync] Skipping product ${productId} from order ${order.id} - user deleted it`)
          continue // Benutzer hat dieses Item gelöscht, nicht wieder hinzufügen
        }
        
        // Prüfe ob dieses Produkt bereits im Inventar ist (für diese Bestellung)
        // Zähle wie viele Items mit diesem Produkt bereits existieren (mit dieser sourceId)
        const existingCount = inventory.filter(item => 
          item.product.id === productId && 
          item.obtainedFrom === 'purchase' && 
          item.sourceName === 'Kauf' &&
          (item.sourceId === order.id || isOrderId(item.sourceId))
        ).length
        
        // Prüfe ob bereits genug Items vorhanden sind (basierend auf quantity in der Bestellung)
        if (existingCount >= orderItem.quantity) {
          continue // Bereits genug Items vorhanden
        }
        
        // Berechne wie viele Items noch hinzugefügt werden müssen
        const itemsToAdd = orderItem.quantity - existingCount
        
        // Hole Produkt-Details
        try {
          const { getProductFromAPI } = await import('@/lib/api/products')
          const product = await getProductFromAPI(productId)
          
          if (!product) {
            console.warn(`[Inventory Sync] Product not found: ${productId}`)
            continue
          }
          
          // Füge nur die fehlenden Items hinzu
          for (let i = 0; i < itemsToAdd; i++) {
            // Prüfe nochmal, ob das Item bereits existiert (um Race Conditions zu vermeiden)
            const currentInventory = getInventory()
            const currentExistingCount = currentInventory.filter(item => 
              item.product.id === productId && 
              item.obtainedFrom === 'purchase' && 
              item.sourceName === 'Kauf' &&
              item.sourceId === order.id
            ).length
            
            // Wenn bereits genug Items vorhanden sind, überspringe
            if (currentExistingCount >= orderItem.quantity) {
              console.log(`[Inventory Sync] Already have ${currentExistingCount} items for product ${productId} from order ${order.id}, skipping`)
              break
            }
            
            const { addToInventoryAsync } = await import('@/data/inventory')
            await addToInventoryAsync(
              product,
              'purchase',
              order.id, // Bestell-ID als sourceId
              'Kauf',
              userId // userId für Datenbank-Speicherung
            )
            addedCount++
            // Aktualisiere existingOrderItems für weitere Iterationen
            existingOrderItems.add(`${order.id}-${productId}`)
          }
        } catch (error) {
          console.error(`[Inventory Sync] Error adding product ${productId} from order ${order.id}:`, error)
        }
      }
    }
    
    if (addedCount > 0) {
      console.log(`[Inventory Sync] Added ${addedCount} items to inventory from orders`)
    }
    
    return addedCount
  } catch (error) {
    console.error('[Inventory Sync] Error syncing orders to inventory:', error)
    return 0
  }
}

/**
 * Entfernt Duplikate aus dem Inventar
 * Behält das älteste Item für jede eindeutige Kombination aus productId und sourceId
 * Duplikate werden basierend auf productId, sourceId und obtainedFrom identifiziert
 */
export const removeDuplicateInventoryItems = (): number => {
  try {
    const inventory = getInventory()
    const seen = new Map<string, InventoryItem>()
    const duplicates: string[] = []
    
    // Gehe durch alle Items und behalte nur das erste (älteste) für jede Kombination
    for (const item of inventory) {
      // Erstelle einen eindeutigen Key basierend auf productId und sourceId
      const key = `${item.product.id}-${item.sourceId || 'no-source'}-${item.obtainedFrom}`
      
      if (seen.has(key)) {
        // Duplikat gefunden - behalte das ältere Item
        const existing = seen.get(key)!
        const existingDate = new Date(existing.obtainedAt)
        const currentDate = new Date(item.obtainedAt)
        
        if (currentDate < existingDate) {
          // Das aktuelle Item ist älter - behalte es und entferne das existierende
          duplicates.push(existing.id)
          seen.set(key, item)
        } else {
          // Das existierende Item ist älter - entferne das aktuelle
          duplicates.push(item.id)
        }
      } else {
        // Erstes Vorkommen - behalte es
        seen.set(key, item)
      }
    }
    
    if (duplicates.length > 0) {
      // Entferne Duplikate
      const cleanedInventory = inventory.filter(item => !duplicates.includes(item.id))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedInventory))
      console.log(`[Inventory] Removed ${duplicates.length} duplicate items`)
      return duplicates.length
    }
    
    return 0
  } catch (error) {
    console.error('[Inventory] Error removing duplicates:', error)
    return 0
  }
}

/**
 * Setzt die Liste der gelöschten Items zurück
 * Dies erlaubt es, dass syncOrdersToInventory gelöschte Items wieder hinzufügen kann
 */
export const resetDeletedItems = (): void => {
  try {
    localStorage.removeItem(DELETED_ITEMS_KEY)
    console.log('[Inventory] Reset deleted items list')
  } catch (error) {
    console.error('[Inventory] Error resetting deleted items:', error)
  }
}


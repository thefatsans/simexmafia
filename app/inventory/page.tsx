'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getInventory,
  getUnredeemedInventory,
  getRedeemedInventory,
  redeemItem,
  removeFromInventory,
  clearInventory,
  getInventoryStatistics,
  isItemPending,
  InventoryItem,
  syncOrdersToInventory,
  removeDuplicateInventoryItems,
} from '@/data/inventory'
import { Package, CheckCircle, XCircle, Trash2, Gift, ShoppingBag, Trophy, X, Key, Copy, Check, Clock, Eye } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

// Hilfsfunktion: Prüft ob eine sourceId eine gültige Order-ID ist (ORD- oder CUID)
const isOrderId = (sourceId: string | undefined | null): boolean => {
  if (!sourceId) return false
  return sourceId.startsWith('ORD-') || sourceId.length > 10
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unredeemed' | 'redeemed'>('all')
  const [statistics, setStatistics] = useState(getInventoryStatistics())
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set()) // itemId -> true wenn Key sichtbar ist
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({}) // orderId -> status
  const [orderDetails, setOrderDetails] = useState<Record<string, { status: string; updatedAt?: string; statusReason?: string }>>({}) // orderId -> details
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false) // Verhindere mehrfache Aufrufe
  const [isSyncing, setIsSyncing] = useState(false) // Verhindere mehrfache Synchronisation
  const { showSuccess, showError, showInfo } = useToast()

  const loadInventory = () => {
    const inv = getInventory()
    setInventory(inv)
    setStatistics(getInventoryStatistics())
  }

  // Entferne Duplikate aus dem Inventar
  const removeDuplicates = useCallback(() => {
    const removedCount = removeDuplicateInventoryItems()
    if (removedCount > 0) {
      loadInventory()
      showSuccess(`${removedCount} Duplikate wurden entfernt`)
    } else {
      showInfo('Keine Duplikate gefunden')
    }
  }, [showSuccess, showInfo])

  // Synchronisiere Bestellungen mit Inventar
  const syncInventory = useCallback(async () => {
    if (!user?.id || isSyncing) {
      console.log('[Inventory Page] Skipping sync - no user or already syncing')
      return
    }
    
    setIsSyncing(true)
    try {
      const addedCount = await syncOrdersToInventory(user.id)
      if (addedCount > 0) {
        loadInventory() // Lade Inventar neu nach Synchronisation
        console.log(`[Inventory Page] Synced ${addedCount} items from orders`)
      } else {
        console.log(`[Inventory Page] No new items to sync`)
      }
    } catch (error) {
      console.error('[Inventory Page] Error syncing inventory:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [user?.id, isSyncing])

  // Hole Bestellstatus aus API oder localStorage
  const getOrderStatus = async (orderId: string): Promise<string | null> => {
    if (!orderId || !orderId.startsWith('ORD-')) {
      return null
    }
    
    try {
      // Versuche API zu verwenden
      try {
        if (!user?.id) {
          return null
        }
        const { getOrdersFromAPI } = await import('@/lib/api/orders')
        const orders = await getOrdersFromAPI(user.id)
        const order = orders.find((o: any) => o.id === orderId)
        return order?.status || null
      } catch (apiError) {
        // Fallback: localStorage
        const { getOrderById } = await import('@/data/payments')
        const order = getOrderById(orderId)
        return order?.status || null
      }
    } catch (error) {
      console.error('Error getting order status:', error)
      return null
    }
  }

  // Hole Bestelldetails (Status, updatedAt, statusReason) aus API
  const getOrderDetails = async (orderId: string): Promise<{ status: string; updatedAt?: string; statusReason?: string } | null> => {
    if (!orderId || !orderId.startsWith('ORD-')) {
      return null
    }
    
    try {
      // Versuche API zu verwenden
      try {
        if (!user?.id) {
          return null
        }
        const { getOrdersFromAPI } = await import('@/lib/api/orders')
        const orders = await getOrdersFromAPI(user.id)
        const order = orders.find((o: any) => o.id === orderId)
        if (!order) return null
        return {
          status: order.status,
          updatedAt: (order as any).updatedAt,
          statusReason: (order as any).statusReason,
        }
      } catch (apiError) {
        // Fallback: localStorage
        const { getOrderById } = await import('@/data/payments')
        const order = getOrderById(orderId)
        if (!order) return null
        return {
          status: order.status,
          updatedAt: (order as any).updatedAt || order.createdAt,
          statusReason: (order as any).statusReason,
        }
      }
    } catch (error) {
      console.error('Error getting order details:', error)
      return null
    }
  }

  // Lade Bestellstatus für alle Items von Bestellungen
  const loadOrderStatuses = async () => {
    if (!user?.id) {
      console.log('[Inventory] No user ID, skipping order status load')
      return
    }
    
    // Verhindere mehrfache gleichzeitige Aufrufe
    if (isLoadingStatuses) {
      console.log('[Inventory] Already loading statuses, skipping')
      return
    }
    
    setIsLoadingStatuses(true)
    
    try {
      const inv = getInventory()
      console.log('[Inventory] Loading order statuses, inventory items:', inv.length)
    
    // Finde alle Items, die von Bestellungen stammen (entweder durch sourceId oder sourceName)
    // Order-IDs können CUIDs sein (z.B. "cmjsikcb8000778dd0rv8le73") oder mit "ORD-" beginnen
    const orderItems = inv.filter(item => 
      isOrderId(item.sourceId) || 
      (item.obtainedFrom === 'purchase' && item.sourceName === 'Kauf')
    )
    console.log('[Inventory] Order items found:', orderItems.length)
    
    // Wenn Items kein sourceId haben, aber von Bestellungen stammen, versuche sie zuzuordnen
    // Prüfe ob sourceId vorhanden ist (egal ob ORD- oder CUID)
    const itemsWithoutSourceId = orderItems.filter(item => !isOrderId(item.sourceId))
    console.log('[Inventory] Items without sourceId:', itemsWithoutSourceId.length)
    
    // Wenn alle Items bereits eine sourceId haben, überspringe die Aktualisierung
    if (itemsWithoutSourceId.length === 0) {
      console.log('[Inventory] All order items already have sourceId, skipping update')
      // Setze finalInventory direkt auf inv, da keine Updates nötig sind
      const updatedOrderItems = inv.filter(item => isOrderId(item.sourceId))
      const uniqueOrderIds = [...new Set(updatedOrderItems.map(item => item.sourceId!))]
      
      if (uniqueOrderIds.length === 0) {
        console.log('[Inventory] No order IDs found, skipping status load')
        setIsLoadingStatuses(false)
        return
      }
      
      // Lade Status für bestehende Orders
      const statuses: Record<string, string> = {}
      const details: Record<string, { status: string; updatedAt?: string; statusReason?: string }> = {}
      
      try {
        const { getOrdersFromAPI } = await import('@/lib/api/orders')
        const allOrders = await getOrdersFromAPI(user.id)
        
        for (const orderId of uniqueOrderIds) {
          const order = allOrders.find((o: any) => o.id === orderId)
          if (order) {
            statuses[orderId] = order.status
            details[orderId] = {
              status: order.status,
              updatedAt: (order as any).updatedAt || order.createdAt,
              statusReason: (order as any).statusReason,
            }
          }
        }
      } catch (error) {
        console.error('[Inventory] Error loading orders from API:', error)
      }
      
      setOrderStatuses(statuses)
      setOrderDetails(details)
      setIsLoadingStatuses(false)
      return
    }
    
    let hasUpdates = false
    let finalInventory = inv // Verwende inv als Ausgangspunkt
    
    if (itemsWithoutSourceId.length > 0 && user?.id) {
      // Versuche Bestellungen zu finden, die zu diesen Items passen
      try {
        const { getOrdersFromAPI } = await import('@/lib/api/orders')
        const orders = await getOrdersFromAPI(user.id)
        console.log('[Inventory] Loaded orders from API:', orders.length)
        
        // Erstelle eine Map von Produkt-ID zu Bestellung für bessere Performance
        const productToOrderMap = new Map<string, string>()
        for (const order of orders) {
          if (order.status === 'failed' || order.status === 'cancelled') continue
          for (const orderItem of order.items) {
            if (orderItem.type === 'product' && (orderItem as any).productId) {
              // Verwende productId als Key, oder name falls productId fehlt
              const key = (orderItem as any).productId || orderItem.name
              if (!productToOrderMap.has(key)) {
                productToOrderMap.set(key, order.id)
              }
            }
          }
        }
        
        // Aktualisiere alle Items auf einmal mit immutable updates
        const currentInventory = inv
        const updatedItems = new Set<string>() // Track welche Items bereits aktualisiert wurden
        
        // Erstelle eine neue Liste mit aktualisierten Items (immutable update)
        let updatedInventory = currentInventory.map(item => {
          // Überspringe Items, die bereits ein sourceId haben (ORD- oder CUID)
          if (isOrderId(item.sourceId)) {
            return item
          }
          
          // Überspringe Items, die nicht von Bestellungen stammen
          if (item.obtainedFrom !== 'purchase' || item.sourceName !== 'Kauf') {
            return item
          }
          
          // Überspringe Items, die bereits in dieser Iteration aktualisiert wurden
          const itemKey = `${item.product.id}-${item.product.name}`
          if (updatedItems.has(itemKey)) {
            return item
          }
          
          // Versuche Bestellung zu finden
          const orderId = productToOrderMap.get(item.product.id) || productToOrderMap.get(item.product.name)
          if (orderId) {
            updatedItems.add(itemKey)
            hasUpdates = true
            console.log('[Inventory] Will update item for product:', item.product.name, 'with order:', orderId)
            return { ...item, sourceId: orderId }
          }
          
          return item
        })
        
        // Verwende updatedInventory direkt als finalInventory (keine doppelte Iteration)
        finalInventory = updatedInventory
        
        // Debug: Prüfe finalInventory vor dem Speichern
        const itemsWithSourceIdBeforeSave = finalInventory.filter(item => isOrderId(item.sourceId))
        console.log('[Inventory] Has updates:', hasUpdates, 'Updated items set size:', updatedItems.size)
        console.log('[Inventory] Items with sourceId BEFORE save:', itemsWithSourceIdBeforeSave.length, 'Sample:', itemsWithSourceIdBeforeSave.slice(0, 3).map(item => ({ name: item.product.name, sourceId: item.sourceId })))
        
        // Speichere nur einmal, wenn es Updates gab
        if (hasUpdates) {
          // Debug: Prüfe finalInventory vor dem Speichern
          const itemsWithSourceIdBeforeSave = finalInventory.filter(item => isOrderId(item.sourceId))
          console.log('[Inventory] Items with sourceId BEFORE localStorage save:', itemsWithSourceIdBeforeSave.length)
          
          // Speichere in localStorage (Fallback)
          const inventoryToSave = JSON.stringify(finalInventory)
          localStorage.setItem('simexmafia-inventory', inventoryToSave)
          console.log('[Inventory] Saved to localStorage, string length:', inventoryToSave.length)
          
          // Prüfe sofort nach dem Speichern
          const immediatelyAfterSave = JSON.parse(localStorage.getItem('simexmafia-inventory') || '[]')
          const itemsWithSourceIdImmediately = immediatelyAfterSave.filter((item: any) => isOrderId(item.sourceId))
          console.log('[Inventory] Items with sourceId IMMEDIATELY after save:', itemsWithSourceIdImmediately.length)
          
          // Speichere auch in der Datenbank
          try {
            if (!user?.id) {
              console.warn('[Inventory] No user ID, skipping database update')
              // KEIN return hier - localStorage wurde bereits gespeichert
            } else {
            
            const { getInventoryFromAPI, addInventoryItemToAPI, bulkUpdateInventoryItemsAPI } = await import('@/lib/api/inventory')
            
            // Hole alle Datenbank-Items für diesen User
            const dbItems = await getInventoryFromAPI(user.id)
            const dbItemsMap = new Map(dbItems.map((item: any) => [`${item.productId}-${item.sourceId || 'none'}`, item]))
            
            // Finde alle Items, die aktualisiert wurden
            const itemsToUpdate: Array<{ itemId: string; sourceId?: string; orderId?: string }> = []
            const itemsToCreate: Array<{ productId: string; source: string; sourceId?: string; orderId?: string }> = []
            
            for (const item of finalInventory) {
              if (isOrderId(item.sourceId)) {
                // Prüfe ob Item bereits in DB existiert (basierend auf productId und sourceId)
                const dbKey = `${item.product.id}-${item.sourceId}`
                const existingDbItem = dbItemsMap.get(dbKey)
                
                if (existingDbItem) {
                  // Item existiert bereits - aktualisiere es
                  itemsToUpdate.push({
                    itemId: existingDbItem.id,
                    sourceId: item.sourceId || undefined,
                    orderId: item.sourceId || undefined,
                  })
                } else {
                  // Item existiert nicht - erstelle es
                  itemsToCreate.push({
                    productId: item.product.id,
                    source: 'purchase',
                    sourceId: item.sourceId,
                    orderId: item.sourceId,
                  })
                }
              }
            }
            
            // Führe Updates und Creates aus
            if (itemsToUpdate.length > 0) {
              await bulkUpdateInventoryItemsAPI(user.id, itemsToUpdate)
              console.log('[Inventory] Updated', itemsToUpdate.length, 'items in database with sourceId')
            }
            
            if (itemsToCreate.length > 0) {
              for (const itemData of itemsToCreate) {
                await addInventoryItemToAPI({ ...itemData, userId: user.id })
              }
              console.log('[Inventory] Created', itemsToCreate.length, 'new items in database')
            }
            }
          } catch (dbError) {
            console.error('[Inventory] Error updating items in database:', dbError)
            // Fallback: localStorage wurde bereits gespeichert
          }
          
          console.log('[Inventory] Saved updated inventory with sourceIds')
          // Debug: Prüfe ob sourceIds korrekt gespeichert wurden
          const savedInventory = JSON.parse(localStorage.getItem('simexmafia-inventory') || '[]')
          const itemsWithSourceId = savedInventory.filter((item: any) => isOrderId(item.sourceId))
          console.log('[Inventory] Items with sourceId after save:', itemsWithSourceId.length, 'Sample:', itemsWithSourceId.slice(0, 3).map((item: any) => ({ name: item.product?.name, sourceId: item.sourceId })))
          
          // Debug: Zeige ein vollständiges Item
          if (itemsWithSourceId.length > 0) {
            console.log('[Inventory] Full item sample:', JSON.stringify(itemsWithSourceId[0], null, 2))
          } else {
            console.log('[Inventory] No items with sourceId found. First item in saved inventory:', savedInventory[0] ? JSON.stringify(savedInventory[0], null, 2) : 'No items')
            // Debug: Prüfe ob sourceId im finalInventory vorhanden ist
            const finalItemsWithSourceId = finalInventory.filter(item => isOrderId(item.sourceId))
            console.log('[Inventory] Items with sourceId in finalInventory:', finalItemsWithSourceId.length)
            if (finalItemsWithSourceId.length > 0) {
              console.log('[Inventory] Sample from finalInventory:', JSON.stringify(finalItemsWithSourceId[0], null, 2))
            }
          }
          
          // Lade Inventar neu, damit die Änderungen sichtbar werden
          loadInventory()
        }
      } catch (error) {
        console.error('[Inventory] Error updating sourceIds:', error)
      }
    }
    
    // Verwende finalInventory direkt, wenn Updates gemacht wurden, sonst inv
    // ABER: Wenn Updates gemacht wurden, lade das Inventar neu aus localStorage
    let updatedInv = inv
    if (hasUpdates) {
      // Lade das Inventar neu aus localStorage, um sicherzustellen, dass wir die gespeicherten Daten haben
      const reloadedInventory = getInventory()
      updatedInv = reloadedInventory
      console.log('[Inventory] Reloaded inventory after save, items:', reloadedInventory.length)
    }
    
    const updatedOrderItems = updatedInv.filter(item => isOrderId(item.sourceId))
    const uniqueOrderIds = [...new Set(updatedOrderItems.map(item => item.sourceId!))]
    console.log('[Inventory] Unique order IDs to load:', uniqueOrderIds.length, uniqueOrderIds)
    console.log('[Inventory] Sample items with sourceId:', updatedOrderItems.slice(0, 3).map(item => ({ name: item.product.name, sourceId: item.sourceId })))
    
    if (uniqueOrderIds.length === 0) {
      console.log('[Inventory] No order IDs found, skipping status load')
      setIsLoadingStatuses(false)
      return
    }
    
    const statuses: Record<string, string> = {}
    const details: Record<string, { status: string; updatedAt?: string; statusReason?: string }> = {}
    
    // Lade alle Bestellungen auf einmal für bessere Performance
    try {
      const { getOrdersFromAPI } = await import('@/lib/api/orders')
      const allOrders = await getOrdersFromAPI(user.id)
      console.log('[Inventory] Loaded all orders for status:', allOrders.length)
      
      for (const orderId of uniqueOrderIds) {
        const order = allOrders.find((o: any) => o.id === orderId)
        if (order) {
          statuses[orderId] = order.status
          details[orderId] = {
            status: order.status,
            updatedAt: (order as any).updatedAt || order.createdAt,
            statusReason: (order as any).statusReason,
          }
          console.log('[Inventory] Found status for order:', orderId, 'Status:', order.status)
        } else {
          console.warn('[Inventory] Order not found in API:', orderId)
        }
      }
    } catch (error) {
      console.error('[Inventory] Error loading orders from API:', error)
      // Fallback: Verwende getOrderDetails für einzelne Bestellungen
      for (const orderId of uniqueOrderIds) {
        const orderDetails = await getOrderDetails(orderId)
        if (orderDetails) {
          statuses[orderId] = orderDetails.status
          details[orderId] = orderDetails
        }
      }
    }
    
      console.log('[Inventory] Final statuses:', statuses)
      setOrderStatuses(statuses)
      setOrderDetails(details)
    } finally {
      setIsLoadingStatuses(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    
    // Synchronisiere zuerst Bestellungen mit Inventar
    syncInventory().then(() => {
      loadInventory()
      // Warte kurz, damit syncInventory fertig ist
      setTimeout(() => {
        loadOrderStatuses()
      }, 500)
    })
    
    // Automatisches Aktualisieren alle 30 Sekunden, um Status-Updates zu sehen
    // ABER: Nur wenn nicht bereits geladen wird
    const interval = setInterval(() => {
      if (!isLoadingStatuses) {
        loadOrderStatuses()
      }
    }, 30000) // 30 Sekunden
    
    return () => clearInterval(interval)
  }, [user?.id, syncInventory])

  // Hole Key aus Bestellung, falls Item von einer Bestellung kommt
  const getKeyFromOrder = async (item: InventoryItem): Promise<string | null> => {
    if (!isOrderId(item.sourceId)) {
      return null
    }
    
    try {
      // Versuche API zu verwenden
      try {
        if (!user?.id) {
          throw new Error('User not authenticated')
        }
        const { getOrdersFromAPI } = await import('@/lib/api/orders')
        const orders = await getOrdersFromAPI(user.id)
        const order = orders.find((o: any) => o.id === item.sourceId)
        
        if (!order) {
          throw new Error('Bestellung nicht gefunden.')
        }
        
        if (order.status !== 'completed') {
          throw new Error(`Die Bestellung ist noch nicht abgeschlossen. Aktueller Status: ${order.status === 'pending' ? 'Ausstehend' : order.status === 'processing' ? 'In Bearbeitung' : order.status}.`)
        }
        
        // Finde das OrderItem mit dem passenden Produkt
        const orderItem = order.items?.find((oi: any) => 
          oi.productId === item.product.id || oi.name === item.product.name
        )
        
        if (!orderItem) {
          throw new Error('Produkt nicht in Bestellung gefunden.')
        }
        
        if (!orderItem.key) {
          throw new Error('Die Bestellung ist abgeschlossen, aber der digitale Key wurde noch nicht vom Admin eingefügt. Bitte kontaktieren Sie den Support oder warten Sie, bis der Admin den Key hinzugefügt hat.')
        }
        
        return orderItem.key
      } catch (apiError: any) {
        // Wenn es bereits ein Error-Objekt mit Message ist, werfe es weiter
        if (apiError.message) {
          throw apiError
        }
        
        // Fallback: localStorage
        if (!item.sourceId) {
          throw new Error('No sourceId available')
        }
        const { getOrderById } = await import('@/data/payments')
        const order = getOrderById(item.sourceId)
        
        if (!order) {
          throw new Error('Bestellung nicht gefunden.')
        }
        
        if (order.status !== 'completed') {
          throw new Error(`Die Bestellung ist noch nicht abgeschlossen. Aktueller Status: ${order.status === 'pending' ? 'Ausstehend' : order.status === 'processing' ? 'In Bearbeitung' : order.status}.`)
        }
        
        // Finde das OrderItem mit dem passenden Produkt
        const orderItem = order.items?.find((oi: any) => 
          oi.metadata?.productId === item.product.id || oi.name === item.product.name
        )
        
        if (!orderItem) {
          throw new Error('Produkt nicht in Bestellung gefunden.')
        }
        
        if (!(orderItem as any).key) {
          throw new Error('Die Bestellung ist abgeschlossen, aber der digitale Key wurde noch nicht vom Admin eingefügt. Bitte kontaktieren Sie den Support oder warten Sie, bis der Admin den Key hinzugefügt hat.')
        }
        
        return (orderItem as any).key
      }
    } catch (error: any) {
      console.error('Error getting key from order:', error)
      // Wirf den Fehler weiter, damit die aufrufende Funktion ihn behandeln kann
      throw error
    }
  }

  const handleRedeem = async (item: InventoryItem) => {
    try {
      // Für Produkte mit Bestell-ID: KEINE Einlösung erlaubt - nur Key anzeigen
      if (isOrderId(item.sourceId)) {
        showError('Für gekaufte Produkte können Sie den Key direkt anzeigen, sobald die Bestellung abgeschlossen ist. Es ist keine separate Einlösung nötig.')
        return
      }
      
      // Nur für Items ohne Bestell-ID (z.B. aus Säcken): Normale Einlösung
      const { redeemItemAsync } = await import('@/data/inventory')
      const code = await redeemItemAsync(item.id, user?.id)
      if (code) {
        loadInventory()
        showSuccess('Produkt erfolgreich eingelöst!', 4000)
      } else {
        showError('Produkt konnte nicht eingelöst werden.')
      }
    } catch (error: any) {
      showError(error.message || 'Produkt konnte nicht eingelöst werden.')
    }
  }

  const handleRemove = (itemId: string) => {
    if (removeFromInventory(itemId)) {
      loadInventory()
      setSelectedItem(null)
      showSuccess('Produkt aus Inventar entfernt', 3000)
    } else {
      showError('Fehler beim Entfernen des Produkts')
    }
  }

  const handleClearInventory = () => {
    clearInventory()
    setInventory([])
    setStatistics(getInventoryStatistics())
    setShowClearConfirm(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen'
      case 'pending':
        return 'Ausstehend'
      case 'processing':
        return 'In Bearbeitung'
      case 'failed':
        return 'Fehlgeschlagen'
      case 'cancelled':
        return 'Storniert'
      default:
        return status
    }
  }

  const getFilteredInventory = () => {
    if (activeTab === 'unredeemed') {
      return getUnredeemedInventory()
    } else if (activeTab === 'redeemed') {
      return getRedeemedInventory()
    }
    return inventory
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-4">Mein Inventar</h1>
            <p className="text-xl text-gray-400">
              Alle Ihre gewonnenen und gekauften Produkte
            </p>
          </div>
          {inventory.length > 0 && (
            <div className="flex space-x-3">
              <button
                onClick={removeDuplicates}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Package className="w-5 h-5" />
                <span>Duplikate entfernen</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>Inventar löschen</span>
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        {inventory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamt</h3>
              </div>
              <div className="text-3xl font-bold text-white">{statistics.total}</div>
            </div>

            <div className="bg-fortnite-dark border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Gift className="w-6 h-6 text-green-400" />
                <h3 className="text-gray-400 text-sm">Nicht eingelöst</h3>
              </div>
              <div className="text-3xl font-bold text-green-400">{statistics.unredeemed}</div>
              <div className="text-sm text-gray-400 mt-1">
                Wert: €{statistics.unredeemedValue.toFixed(2)}
              </div>
            </div>

            <div className="bg-fortnite-dark border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-gray-400 text-sm">Eingelöst</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{statistics.redeemed}</div>
              <div className="text-sm text-gray-400 mt-1">
                Wert: €{statistics.redeemedValue.toFixed(2)}
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamtwert</h3>
              </div>
              <div className="text-3xl font-bold text-white">€{statistics.totalValue.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Source Breakdown */}
        {inventory.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Herkunft</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Aus Säcken</div>
                <div className="text-2xl font-bold text-purple-400">{statistics.sourceCounts.sack}</div>
              </div>
              <div className="bg-fortnite-dark border border-blue-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Gekauft</div>
                <div className="text-2xl font-bold text-blue-400">{statistics.sourceCounts.purchase}</div>
              </div>
              <div className="bg-fortnite-dark border border-pink-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Geschenk</div>
                <div className="text-2xl font-bold text-pink-400">{statistics.sourceCounts.gift}</div>
              </div>
              <div className="bg-fortnite-dark border border-gray-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Sonstiges</div>
                <div className="text-2xl font-bold text-gray-400">{statistics.sourceCounts.other}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {inventory.length > 0 && (
          <div className="flex space-x-4 mb-6 border-b border-purple-500/20">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Alle ({statistics.total})
            </button>
            <button
              onClick={() => setActiveTab('unredeemed')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'unredeemed'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Nicht eingelöst ({statistics.unredeemed})
            </button>
            <button
              onClick={() => setActiveTab('redeemed')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'redeemed'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Eingelöst ({statistics.redeemed})
            </button>
          </div>
        )}

        {/* Inventory List */}
        {inventory.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Inventar ist leer</h2>
            <p className="text-gray-400 mb-6">
              Gewinnen Sie Produkte aus Säcken oder kaufen Sie welche im Shop!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a
                href="/sacks"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/sacks'
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Säcke öffnen
              </a>
              <a
                href="/products"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/products'
                }}
                className="bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Zum Shop
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredInventory().map((item) => (
              <div
                key={item.id}
                className={`bg-fortnite-dark border rounded-lg p-6 hover:border-purple-500/50 transition-all relative ${
                  item.isRedeemed
                    ? 'border-yellow-500/30 opacity-75'
                    : 'border-purple-500/20'
                }`}
              >
                {/* Status Badge */}
                {(() => {
                  const isOrderItem = isOrderId(item.sourceId) || (item.obtainedFrom === 'purchase' && item.sourceName === 'Kauf')
                  const orderStatus = isOrderId(item.sourceId) && item.sourceId
                    ? orderStatuses[item.sourceId]
                    : null
                  const pending = orderStatus ? orderStatus !== 'completed' : (isOrderItem ? true : false)
                  
                  if (item.isRedeemed) {
                    return (
                      <div className="absolute top-4 right-4 bg-yellow-500/90 border border-yellow-500/50 rounded-full px-3 py-1 z-20 backdrop-blur-sm shadow-lg">
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-yellow-100" />
                          <span className="text-yellow-100 text-xs font-semibold">Eingelöst</span>
                        </div>
                      </div>
                    )
                  } else if (pending) {
                    return (
                      <div className="absolute top-4 right-4 bg-orange-500/90 border border-orange-500/50 rounded-full px-3 py-1 z-20 backdrop-blur-sm shadow-lg">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-orange-100" />
                          <span className="text-orange-100 text-xs font-semibold">
                            {orderStatus ? getStatusText(orderStatus) : 'Ausstehend'}
                          </span>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Product Image */}
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/50 to-yellow-900/50">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">🎮</span>
                    </div>
                  )}
                  {item.isRedeemed && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <CheckCircle className="w-16 h-16 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{item.product.name}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      {item.product.platform}
                    </span>
                    <span className="text-green-400 font-semibold">€{item.product.price.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Erhalten: {formatDate(item.obtainedAt)}
                  </div>
                  {item.sourceName && (
                    <div className="text-xs text-gray-500 mt-1">
                      Von: {item.sourceName}
                    </div>
                  )}
                  {/* Bestellstatus anzeigen mit Zeitstempel - IMMER anzeigen wenn es eine Bestellung ist */}
                  {(isOrderId(item.sourceId) || (item.obtainedFrom === 'purchase' && item.sourceName === 'Kauf')) && (
                    <div className="mt-2 space-y-1">
                      {isOrderId(item.sourceId) && orderStatuses[item.sourceId!] ? (
                        <>
                          <div className="flex items-center space-x-2">
                            {item.sourceId && (
                              <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(orderStatuses[item.sourceId])}`}>
                                Bestellung: {getStatusText(orderStatuses[item.sourceId])}
                              </span>
                            )}
                            {item.sourceId && orderDetails[item.sourceId]?.updatedAt && (
                              <span className="text-xs text-gray-500">
                                (Geändert: {formatDate(orderDetails[item.sourceId].updatedAt!)})
                              </span>
                            )}
                          </div>
                          {item.sourceId && orderDetails[item.sourceId]?.statusReason && (
                            <div className="text-xs text-red-400 mt-1">
                              Grund: {orderDetails[item.sourceId].statusReason}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 rounded font-medium bg-gray-500/20 text-gray-400">
                            Bestellung: Lade Status...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    {/* Für Bestellungen: KEIN Einlösen-Button - nur Key anzeigen wenn abgeschlossen */}
                    {(isOrderId(item.sourceId) || (item.obtainedFrom === 'purchase' && item.sourceName === 'Kauf')) ? (
                      // Bestellung: Nur Key anzeigen wenn abgeschlossen, kein Einlösen-Button
                      <>
                        <a
                          href={`/products/${item.product.id}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = `/products/${item.product.id}`
                          }}
                          className="bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          Ansehen
                        </a>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      // Keine Bestellung: Normale Einlösung (z.B. aus Säcken)
                      <>
                        {!item.isRedeemed && (
                          <>
                            {(() => {
                              const pending = isItemPending(item)
                              return (
                                <button
                                  onClick={() => handleRedeem(item)}
                                  disabled={pending}
                                  className={`flex-1 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                                    pending
                                      ? 'bg-gray-500/20 border border-gray-500/30 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                  }`}
                                  title={pending ? 'Die Bestellung ist noch nicht abgeschlossen. Bitte warten Sie, bis die Bestellung bestätigt wurde.' : ''}
                                >
                                  <Key className="w-4 h-4" />
                                  <span>{pending ? 'Ausstehend' : 'Einlösen'}</span>
                                </button>
                              )
                            })()}
                            <a
                              href={`/products/${item.product.id}`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.location.href = `/products/${item.product.id}`
                              }}
                              className="bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                            >
                              Ansehen
                            </a>
                          </>
                        )}
                        {item.isRedeemed && (
                          <>
                            {item.redemptionCode ? (
                              <div className="flex-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-yellow-400 text-xs font-semibold">Code:</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <code className="flex-1 bg-fortnite-dark border border-purple-500/30 rounded px-3 py-2 text-white font-mono text-sm break-all">
                                    {item.redemptionCode}
                                  </code>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.redemptionCode!)
                                      alert('Code in Zwischenablage kopiert!')
                                    }}
                                    className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
                                    title="Code kopieren"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 text-center text-yellow-400 text-sm py-2">
                                Eingelöst: {item.redeemedAt ? formatDate(item.redeemedAt) : '-'}
                              </div>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Key anzeigen Button - nur wenn Bestellung abgeschlossen und Key vorhanden */}
                  {(isOrderId(item.sourceId) || (item.obtainedFrom === 'purchase' && item.sourceName === 'Kauf')) && isOrderId(item.sourceId) && (
                    <KeyDisplayButton 
                      item={item} 
                      visibleKeys={visibleKeys}
                      setVisibleKeys={setVisibleKeys}
                      getKeyFromOrder={getKeyFromOrder}
                      orderStatus={item.sourceId ? orderStatuses[item.sourceId] : undefined}
                      showError={showError}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-red-500/30 rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <Trash2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Produkt entfernen?</h2>
                <p className="text-gray-400 mb-6">
                  Möchten Sie "{selectedItem.product.name}" wirklich aus Ihrem Inventar entfernen?
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      handleRemove(selectedItem.id)
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-red-500/30 rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <Trash2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Inventar löschen?</h2>
                <p className="text-gray-400 mb-6">
                  Möchten Sie wirklich das gesamte Inventar löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleClearInventory}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Key Display Button Component
function KeyDisplayButton({ 
  item, 
  visibleKeys, 
  setVisibleKeys, 
  getKeyFromOrder,
  orderStatus,
  showError: showErrorToast
}: { 
  item: InventoryItem
  visibleKeys: Set<string>
  setVisibleKeys: (keys: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  getKeyFromOrder: (item: InventoryItem) => Promise<string | null>
  orderStatus?: string
  showError: (message: string) => void
}) {
  const [key, setKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const isVisible = visibleKeys.has(item.id)

  // Nur anzeigen wenn es eine Bestellung ist
  if (!item.sourceId || !item.sourceId.startsWith('ORD-')) {
    return null
  }

  const handleShowKey = async () => {
    if (isVisible) {
      setVisibleKeys(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      setKey(null)
      setKeyError(null)
      return
    }

    // Prüfe zuerst den Status
    if (orderStatus && orderStatus !== 'completed') {
      showErrorToast(`Die Bestellung ist noch nicht abgeschlossen. Aktueller Status: ${orderStatus === 'pending' ? 'Ausstehend' : orderStatus === 'processing' ? 'In Bearbeitung' : orderStatus}. Bitte warten Sie, bis die Bestellung abgeschlossen wurde.`)
      return
    }

    setIsLoading(true)
    setKeyError(null)
    try {
      const orderKey = await getKeyFromOrder(item)
      if (orderKey) {
        setKey(orderKey)
        setVisibleKeys(prev => new Set(prev).add(item.id))
      } else {
        // Bestellung ist completed, aber Key fehlt
        const errorMsg = 'Die Bestellung ist abgeschlossen, aber der digitale Key wurde noch nicht vom Admin eingefügt. Bitte kontaktieren Sie den Support oder warten Sie, bis der Admin den Key hinzugefügt hat.'
        setKeyError(errorMsg)
        showErrorToast(errorMsg)
      }
    } catch (error: any) {
      console.error('Error loading key:', error)
      const errorMsg = error.message || 'Fehler beim Laden des Keys. Bitte versuchen Sie es später erneut.'
      setKeyError(errorMsg)
      showErrorToast(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Wenn Status noch nicht geladen wurde, zeige nichts (wird später geladen)
  if (orderStatus === undefined) {
    return null
  }

  // Wenn Status nicht "completed" ist, zeige nichts (Status wird oben angezeigt)
  if (orderStatus !== 'completed') {
    return null
  }

  // Status ist "completed" - zeige Key-Button
  if (!isVisible && !key) {
    return (
      <div className="w-full space-y-2">
        <button
          onClick={handleShowKey}
          disabled={isLoading}
          className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
          <span>{isLoading ? 'Lädt...' : 'Key anzeigen'}</span>
        </button>
        {keyError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <p className="text-red-400 text-xs">{keyError}</p>
          </div>
        )}
      </div>
    )
  }

  // Key ist sichtbar
  if (isVisible && key) {
    return (
      <div className="bg-fortnite-darker border border-green-500/30 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Digital Key:</span>
          <button
            onClick={handleShowKey}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-fortnite-dark border border-purple-500/30 rounded px-3 py-2 text-white font-mono text-sm break-all">
            {key}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(key)
              alert('Key in Zwischenablage kopiert!')
            }}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
            title="Key kopieren"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Code Display Component mit Copy-Funktion
function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1 bg-black/30 border border-green-500/50 rounded-lg px-4 py-3">
        <code className="text-2xl font-mono font-bold text-green-400 tracking-wider">{code}</code>
      </div>
      <button
        onClick={handleCopy}
        className={`px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
          copied
            ? 'bg-green-500/20 border border-green-500/50'
            : 'bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Kopiert!</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">Kopieren</span>
          </>
        )}
      </button>
    </div>
  )
}

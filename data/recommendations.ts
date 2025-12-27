import { Product } from '@/types'
import { getProductsFromAPI } from '@/lib/api/products'
import { getOrders, Order } from './payments'

/**
 * Findet ähnliche Produkte basierend auf Kategorie, Plattform und Tags
 */
export async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  excludeId?: string
): Promise<Product[]> {
  const allProducts = await getProductsFromAPI()
  const exclude = excludeId || product.id

  // Berechne Ähnlichkeits-Score für jedes Produkt
  const scored = allProducts
    .filter(p => p.id !== exclude && p.inStock)
    .map(p => {
      let score = 0

      // Gleiche Kategorie: +3 Punkte
      if (p.category === product.category) {
        score += 3
      }

      // Gleiche Plattform: +2 Punkte
      if (p.platform === product.platform) {
        score += 2
      }

      // Gemeinsame Tags: +1 Punkt pro Tag
      const commonTags = p.tags.filter(tag => product.tags.includes(tag))
      score += commonTags.length

      // Ähnlicher Preisbereich: +1 Punkt (wenn innerhalb von 20%)
      const priceDiff = Math.abs(p.price - product.price) / product.price
      if (priceDiff <= 0.2) {
        score += 1
      }

      return { product: p, score }
    })
    .filter(item => item.score > 0) // Nur Produkte mit Score > 0
    .sort((a, b) => b.score - a.score) // Sortiere nach Score (höchste zuerst)
    .slice(0, limit)
    .map(item => item.product)

  return scored
}

/**
 * Analysiert Bestellungen, um "Kunden kauften auch" Empfehlungen zu finden
 */
export async function getCustomersAlsoBought(
  productId: string,
  limit: number = 4
): Promise<Product[]> {
  if (typeof window === 'undefined') {
    return []
  }

  const orders = await getOrders()
  const allProducts = await getProductsFromAPI()
  
  // Finde alle Bestellungen, die dieses Produkt enthalten
  const ordersWithProduct = orders.filter(order => 
    order.items.some(item => 
      item.type === 'product' && 
      item.metadata?.productId === productId
    )
  )

  if (ordersWithProduct.length === 0) {
    // Falls keine Bestellungen gefunden, verwende ähnliche Produkte
    const product = allProducts.find(p => p.id === productId)
    if (product) {
      return await getSimilarProducts(product, limit, productId)
    }
    return []
  }

  // Sammle alle anderen Produkte, die zusammen mit diesem Produkt gekauft wurden
  const productCounts = new Map<string, number>()
  
  ordersWithProduct.forEach(order => {
    order.items.forEach(item => {
      if (item.type === 'product' && item.metadata?.productId) {
        const otherProductId = item.metadata.productId
        if (otherProductId !== productId) {
          const currentCount = productCounts.get(otherProductId) || 0
          productCounts.set(otherProductId, currentCount + item.quantity)
        }
      }
    })
  })

  // Sortiere nach Häufigkeit und konvertiere zu Produkten
  const recommended = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sortiere nach Häufigkeit (höchste zuerst)
    .slice(0, limit)
    .map(([productId]) => allProducts.find(p => p.id === productId))
    .filter((p): p is Product => p !== undefined && p.inStock)

  // Falls nicht genug Empfehlungen, fülle mit ähnlichen Produkten auf
  if (recommended.length < limit) {
    const product = allProducts.find(p => p.id === productId)
    if (product) {
      const similar = await getSimilarProducts(product, limit - recommended.length, productId)
      const existingIds = new Set(recommended.map(p => p.id))
      const additional = similar.filter(p => !existingIds.has(p.id))
      recommended.push(...additional)
    }
  }

  return recommended.slice(0, limit)
}

/**
 * Empfohlene Produkte für die Startseite
 * Kombiniert beliebte Produkte, neue Produkte und Produkte mit Rabatten
 */
export async function getHomePageRecommendations(limit: number = 8): Promise<Product[]> {
  const allProducts = (await getProductsFromAPI()).filter(p => p.inStock)

  // Beliebte Produkte (hohe Bewertung + viele Reviews)
  const popular = [...allProducts]
    .sort((a, b) => {
      const scoreA = a.rating * Math.log(a.reviewCount + 1)
      const scoreB = b.rating * Math.log(b.reviewCount + 1)
      return scoreB - scoreA
    })
    .slice(0, Math.ceil(limit / 2))

  // Produkte mit Rabatten
  const discounted = [...allProducts]
    .filter(p => p.discount && p.discount > 0)
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .slice(0, Math.ceil(limit / 2))

  // Kombiniere und entferne Duplikate
  const combined = [...popular, ...discounted]
  const unique = Array.from(
    new Map(combined.map(p => [p.id, p])).values()
  )

  // Falls nicht genug, fülle mit zufälligen Produkten auf
  if (unique.length < limit) {
    const usedIds = new Set(unique.map(p => p.id))
    const additional = allProducts
      .filter(p => !usedIds.has(p.id))
      .slice(0, limit - unique.length)
    unique.push(...additional)
  }

  return unique.slice(0, limit)
}

/**
 * Empfohlene Produkte basierend auf Benutzer-Bestellungen
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 6
): Promise<Product[]> {
  if (typeof window === 'undefined') {
    return []
  }

  const orders = await getOrders()
  const allProducts = await getProductsFromAPI()
  
  // Finde alle Bestellungen des Benutzers
  const userOrders = orders.filter(order => order.userId === userId && order.status === 'completed')

  if (userOrders.length === 0) {
    // Falls keine Bestellungen, verwende Startseiten-Empfehlungen
    return await getHomePageRecommendations(limit)
  }

  // Sammle alle gekauften Produkt-IDs
  const purchasedProductIds = new Set<string>()
  userOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.type === 'product' && item.metadata?.productId) {
        purchasedProductIds.add(item.metadata.productId)
      }
    })
  })

  // Finde ähnliche Produkte für jedes gekaufte Produkt
  const recommendations = new Map<string, { product: Product; score: number }>()
  
  await Promise.all(
    Array.from(purchasedProductIds).map(async (productId) => {
      const product = allProducts.find(p => p.id === productId)
      if (product) {
        const similar = await getSimilarProducts(product, 3, productId)
        similar.forEach(similarProduct => {
          if (!purchasedProductIds.has(similarProduct.id)) {
            const current = recommendations.get(similarProduct.id)
            const score = current ? current.score + 1 : 1
            recommendations.set(similarProduct.id, { product: similarProduct, score })
          }
        })
      }
    })
  )

  // Sortiere nach Score und gib die Top-Empfehlungen zurück
  return Array.from(recommendations.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product)
}




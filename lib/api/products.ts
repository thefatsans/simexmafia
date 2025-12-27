import { Product } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Ruft alle Produkte von der API ab
 * Fallback: Verwendet Mock-Daten wenn API nicht verfügbar
 */
export async function getProductsFromAPI(filters?: {
  category?: string
  platform?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  inStock?: boolean
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.inStock) params.append('inStock', 'true')

    const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const data = await response.json()
    
    // Konvertiere Datenbank-Format zu Product-Format und aktualisiere Bilder
    const { updateProductImages } = await import('@/lib/image-updater')
    const products = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      image: p.image,
      category: p.category as Product['category'],
      platform: p.platform as Product['platform'],
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        rating: p.seller.rating,
        reviewCount: p.seller.reviewCount,
        verified: p.seller.verified,
        avatar: p.seller.avatar,
      },
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock,
      tags: p.tags || [],
    }))
    
    // Aktualisiere alle Bilder mit den neuesten aus complete-product-images.ts
    return updateProductImages(products)
  } catch (error) {
    console.warn('API not available, using fallback:', error)
    // Fallback zu Mock-Daten
    const { getProducts } = await import('@/data/products')
    return getProducts()
  }
}

/**
 * Ruft ein einzelnes Produkt von der API ab
 */
export async function getProductFromAPI(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        // Prüfe ob es eine numerische ID ist - dann keine Name-Suche
        const isNumericId = /^\d+$/.test(id)
        if (!isNumericId) {
          // Versuche nach Name zu suchen, falls ID nicht gefunden (nur für nicht-numerische IDs)
          return await searchProductByName(id)
        }
        // Für numerische IDs: null zurückgeben
        return null
      }
      throw new Error('Failed to fetch product')
    }

    const p = await response.json()
    
    // Prüfe ob es ein Fehler-Objekt ist
    if (p.error) {
      // Prüfe ob es eine numerische ID ist - dann keine Name-Suche
      const isNumericId = /^\d+$/.test(id)
      if (!isNumericId) {
        // Versuche nach Name zu suchen (nur für nicht-numerische IDs)
        return await searchProductByName(id)
      }
      // Für numerische IDs: null zurückgeben
      return null
    }
    
    // Verwende getCompleteProductImage für korrektes Bild
    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const correctImage = getCompleteProductImage(p.name) || p.image
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      image: correctImage,
      category: p.category as Product['category'],
      platform: p.platform as Product['platform'],
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        rating: p.seller.rating,
        reviewCount: p.seller.reviewCount,
        verified: p.seller.verified,
        avatar: p.seller.avatar,
      },
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock,
      tags: p.tags || [],
    }
  } catch (error) {
    console.warn('API not available, using fallback:', error)
    // Fallback: Versuche zuerst generierte Produkte
    try {
      const { generateProducts } = await import('@/prisma/product-data')
      const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
      const generatedProducts = generateProducts(sellerIds)
      
      // Suche zuerst nach exakter ID-Übereinstimmung
      let foundProduct = generatedProducts.find((p: any) => p.id === id)
      
      // Wenn nicht gefunden UND die ID nicht wie eine numerische ID aussieht, versuche nach Name zu suchen
      // Numerische IDs sollten nicht als Namen interpretiert werden
      const isNumericId = /^\d+$/.test(id)
      
      // Für numerische IDs: Keine Name-Suche, nur exakte ID-Übereinstimmung
      if (!foundProduct && !isNumericId) {
        const idLower = id.toLowerCase().trim()
        
        // Erstelle eine Liste von Kandidaten mit Relevanz-Score
        const candidates = generatedProducts
          .map((p: any) => {
            if (!p.name) return null
            const nameLower = (p.name || '').toLowerCase().trim()
            let score = 0
            
            // Exakte Übereinstimmung = höchste Priorität (Score 100)
            if (nameLower === idLower) {
              score = 100
            }
            // Exakte Übereinstimmung nach Normalisierung (Score 90)
            else {
              const nameNormalized = nameLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
              const idNormalized = idLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
              
              if (nameNormalized === idNormalized) {
                score = 90
              }
              // Name beginnt mit Suchbegriff (Score 80)
              else if (nameLower.startsWith(idLower)) {
                score = 80
              }
              // Name enthält Suchbegriff (Score 70)
              else if (nameLower.includes(idLower)) {
                score = 70
              }
              // Normalisierter Name enthält normalisierten Suchbegriff (Score 60)
              else if (nameNormalized.includes(idNormalized)) {
                score = 60
              }
              // Spezielle Suche für "Simex Geheimer Discord-Server"
              else if (idLower.includes('simex') && idLower.includes('discord')) {
                if (nameLower.includes('simex') && nameLower.includes('discord')) {
                  score = 95 // Sehr hohe Priorität für Discord-Server
                }
              }
              else if (idLower.includes('discord') && idLower.includes('server')) {
                if (nameLower.includes('discord') && nameLower.includes('server')) {
                  score = 85
                }
              }
            }
            
            return score > 0 ? { product: p, score } : null
          })
          .filter((c: any) => c !== null)
          .sort((a: any, b: any) => b.score - a.score) // Sortiere nach Score (höchste zuerst)
        
        // Nimm das Produkt mit dem höchsten Score (nur wenn Score >= 90 für Name-Suche)
        // Für numerische IDs sollte keine Name-Suche durchgeführt werden
        if (candidates.length > 0 && candidates[0] && candidates[0].score >= 90) {
          foundProduct = candidates[0].product
        }
      }
      
      // Wenn immer noch nicht gefunden, versuche auch in Mock-Daten (nur nach exakter ID)
      if (!foundProduct) {
        try {
          const { getProducts } = await import('@/data/products')
          const mockProducts = getProducts()
          const mockProduct = mockProducts.find((p: any) => String(p.id) === String(id))
          
          if (mockProduct) {
            console.log(`[Client] Product with ID "${id}" found in mock data: ${mockProduct.name}`)
            // Konvertiere Mock-Product zu Product-Format
            foundProduct = mockProduct as any
          }
        } catch (mockError) {
          console.warn('Error loading mock products:', mockError)
        }
      }
      
      if (foundProduct) {
        // Verwende getCompleteProductImage für korrektes Bild
        const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
        const correctImage = getCompleteProductImage(foundProduct.name) || foundProduct.image
        
        return {
          id: foundProduct.id,
          name: foundProduct.name,
          description: foundProduct.description,
          price: foundProduct.price,
          originalPrice: foundProduct.originalPrice,
          discount: foundProduct.discount,
          image: correctImage,
          category: foundProduct.category as Product['category'],
          platform: foundProduct.platform as Product['platform'],
          seller: {
            id: foundProduct.sellerId || 'seller1',
            name: foundProduct.sellerId === 'seller1' ? 'GameDeals Pro' : foundProduct.sellerId === 'seller2' ? 'DigitalKeys Store' : foundProduct.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
            rating: 4.7,
            reviewCount: 2000,
            verified: true,
          },
          rating: foundProduct.rating || 0,
          reviewCount: foundProduct.reviewCount || 0,
          inStock: foundProduct.inStock,
          tags: foundProduct.tags || [],
        }
      }
    } catch (genError) {
      console.warn('Generated products fallback failed:', genError)
    }
    
    // Letzter Fallback zu Mock-Daten
    try {
      const { getProducts } = await import('@/data/products')
      const products = getProducts()
      // Suche nach exakter ID-Übereinstimmung (beide als String vergleichen)
      let foundProduct = products.find(p => String(p.id) === String(id))
      
      // Wenn nicht gefunden UND es keine numerische ID ist, versuche nach Name zu suchen
      if (!foundProduct) {
        const isNumericId = /^\d+$/.test(id)
        if (!isNumericId) {
          const idLower = id.toLowerCase().trim()
          foundProduct = products.find(p => {
            const nameLower = (p.name || '').toLowerCase().trim()
            return nameLower === idLower || 
                   nameLower.includes(idLower) || 
                   idLower.includes(nameLower)
          })
        }
      }
      
      if (foundProduct) {
        console.log(`[Client] Product with ID "${id}" found in mock data: ${foundProduct.name}`)
      }
      
      return foundProduct || null
    } catch (mockError) {
      console.warn('Mock products fallback failed:', mockError)
      return null
    }
  }
}

/**
 * Sucht ein Produkt nach Name in allen verfügbaren Quellen
 */
export async function searchProductByName(searchTerm: string): Promise<Product | null> {
  try {
    // Versuche zuerst über die API mit Suchparameter
    const response = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(searchTerm)}`)
    
    if (response.ok) {
      const products = await response.json()
      if (products && products.length > 0) {
        // Konvertiere zu Product-Format
        const p = products[0]
        // Verwende getCompleteProductImage für korrektes Bild
        const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
        const correctImage = getCompleteProductImage(p.name) || p.image
        
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          image: correctImage,
          category: p.category as Product['category'],
          platform: p.platform as Product['platform'],
          seller: {
            id: p.seller.id,
            name: p.seller.name,
            rating: p.seller.rating,
            reviewCount: p.seller.reviewCount,
            verified: p.seller.verified,
            avatar: p.seller.avatar,
          },
          rating: p.rating || 0,
          reviewCount: p.reviewCount || 0,
          inStock: p.inStock,
          tags: p.tags || [],
        }
      }
    }
  } catch (error) {
    console.warn('API search failed, using fallback:', error)
  }
  
  // Fallback: Suche in generierten Produkten
  try {
    const { generateProducts } = await import('@/prisma/product-data')
    const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
    const generatedProducts = generateProducts(sellerIds)
    
    const searchLower = searchTerm.toLowerCase().trim()
    const foundProduct = generatedProducts.find((p: any) => {
      if (!p.name) return false
      const nameLower = p.name.toLowerCase().trim()
      return nameLower === searchLower ||
             nameLower.includes(searchLower) ||
             searchLower.includes(nameLower) ||
             nameLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ') === searchLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
    })
    
      if (foundProduct) {
        // Verwende getCompleteProductImage für korrektes Bild
        const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
        const correctImage = getCompleteProductImage(foundProduct.name) || foundProduct.image
        
        return {
          id: foundProduct.id,
          name: foundProduct.name,
          description: foundProduct.description,
          price: foundProduct.price,
          originalPrice: foundProduct.originalPrice,
          discount: foundProduct.discount,
          image: correctImage,
          category: foundProduct.category as Product['category'],
          platform: foundProduct.platform as Product['platform'],
          seller: {
            id: foundProduct.sellerId || 'seller1',
            name: foundProduct.sellerId === 'seller1' ? 'GameDeals Pro' : foundProduct.sellerId === 'seller2' ? 'DigitalKeys Store' : foundProduct.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
            rating: 4.7,
            reviewCount: 2000,
            verified: true,
          },
          rating: foundProduct.rating || 0,
          reviewCount: foundProduct.reviewCount || 0,
          inStock: foundProduct.inStock,
          tags: foundProduct.tags || [],
        }
      }
  } catch (genError) {
    console.warn('Generated products search failed:', genError)
  }
  
  // Letzter Fallback zu Mock-Daten
  try {
    const { getProducts } = await import('@/data/products')
    const products = getProducts()
    const searchLower = searchTerm.toLowerCase().trim()
    const foundProduct = products.find(p => {
      const nameLower = (p.name || '').toLowerCase().trim()
      return nameLower === searchLower ||
             nameLower.includes(searchLower) ||
             searchLower.includes(nameLower)
    })
    
    if (foundProduct) {
      // Verwende getCompleteProductImage für korrektes Bild
      const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
      const correctImage = getCompleteProductImage(foundProduct.name) || foundProduct.image
      
      return {
        ...foundProduct,
        image: correctImage,
      }
    }
    
    return null
  } catch (mockError) {
    console.warn('Mock products search failed:', mockError)
    return null
  }
}

/**
 * Erstellt ein neues Produkt über die API
 */
export async function createProductAPI(productData: {
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  category: string
  platform: string
  tags?: string[]
  sellerId: string
  inStock?: boolean
}): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create product')
    }

    const p = await response.json()
    
    // Verwende getCompleteProductImage für korrektes Bild
    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const correctImage = getCompleteProductImage(p.name) || p.image
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      image: correctImage,
      category: p.category as Product['category'],
      platform: p.platform as Product['platform'],
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        rating: p.seller.rating,
        reviewCount: p.seller.reviewCount,
        verified: p.seller.verified,
        avatar: p.seller.avatar,
      },
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock,
      tags: p.tags || [],
    }
  } catch (error: any) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Aktualisiert ein Produkt über die API
 */
export async function updateProductAPI(
  productId: string,
  productData: {
    name?: string
    description?: string
    price?: number
    originalPrice?: number
    discount?: number
    image?: string
    category?: string
    platform?: string
    tags?: string[]
    inStock?: boolean
  }
): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update product')
    }

    const p = await response.json()
    
    // Verwende getCompleteProductImage für korrektes Bild
    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const correctImage = getCompleteProductImage(p.name) || p.image
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      image: correctImage,
      category: p.category as Product['category'],
      platform: p.platform as Product['platform'],
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        rating: p.seller.rating,
        reviewCount: p.seller.reviewCount,
        verified: p.seller.verified,
        avatar: p.seller.avatar,
      },
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock,
      tags: p.tags || [],
    }
  } catch (error: any) {
    console.error('Error updating product:', error)
    throw error
  }
}

/**
 * Löscht ein Produkt über die API
 */
export async function deleteProductAPI(productId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete product')
    }
  } catch (error: any) {
    console.error('Error deleting product:', error)
    throw error
  }
}



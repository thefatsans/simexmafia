import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id] - Einzelnes Produkt abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: params.id },
          include: {
            seller: true,
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        })

        if (product) {
          // Berechne durchschnittliche Bewertung
          const avgRating =
            product.reviews.length > 0
              ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
              : product.rating

          return NextResponse.json({
            ...product,
            rating: avgRating,
            reviewCount: product.reviews.length || product.reviewCount,
          })
        }
      } catch (dbError) {
        console.warn('Database error, trying fallback:', dbError)
      }
    }

    // Fallback: Suche in generierten Produkten
    try {
      const { generateProducts } = await import('@/prisma/product-data')
      const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
      const generatedProducts = generateProducts(sellerIds)
      
      // Suche nach ID (beide als String vergleichen, um Typ-Probleme zu vermeiden)
      let foundProduct = generatedProducts.find((p: any) => String(p.id) === String(params.id))
      
      // Debug: Log für Diagnose
      if (!foundProduct) {
        console.log(`[API] Product with ID "${params.id}" (type: ${typeof params.id}) not found in generated products.`)
        console.log(`[API] Total generated products: ${generatedProducts.length}`)
        console.log(`[API] Available IDs (first 20):`, generatedProducts.slice(0, 20).map((p: any) => ({ id: p.id, idType: typeof p.id, name: p.name })))
        // Prüfe, ob die ID in einem anderen Format existiert
        const foundByIdNumber = generatedProducts.find((p: any) => Number(p.id) === Number(params.id))
        const foundByIdString = generatedProducts.find((p: any) => String(p.id) === String(params.id))
        console.log(`[API] Found by number comparison:`, foundByIdNumber ? `${foundByIdNumber.name} (ID: ${foundByIdNumber.id})` : 'null')
        console.log(`[API] Found by string comparison:`, foundByIdString ? `${foundByIdString.name} (ID: ${foundByIdString.id})` : 'null')
        // Prüfe, ob die ID im Bereich der generierten IDs liegt
        const allIds = generatedProducts.map((p: any) => Number(p.id)).sort((a, b) => a - b)
        const minId = allIds[0]
        const maxId = allIds[allIds.length - 1]
        const requestedIdNum = Number(params.id)
        console.log(`[API] ID range: ${minId} - ${maxId}, requested: ${requestedIdNum}`)
        if (requestedIdNum >= minId && requestedIdNum <= maxId) {
          console.log(`[API] WARNING: Requested ID ${requestedIdNum} is in range but not found!`)
        }
      } else {
        console.log(`[API] Found product: ID="${foundProduct.id}" (type: ${typeof foundProduct.id}), Name="${foundProduct.name}"`)
      }
      
      // Prüfe ob es eine numerische ID ist (sollte nicht als Name interpretiert werden)
      const isNumericId = /^\d+$/.test(params.id)
      
      // Wenn nicht gefunden UND es keine numerische ID ist, versuche nach Name zu suchen
      if (!foundProduct && !isNumericId) {
        const idLower = decodeURIComponent(params.id).toLowerCase().trim()
        const decodedId = decodeURIComponent(params.id)
        const decodedLower = decodedId.toLowerCase().trim()
        
        // Erstelle eine Liste von Kandidaten mit Relevanz-Score
        const candidates = generatedProducts
          .map((p: any) => {
            if (!p.name) return null
            const nameLower = p.name.toLowerCase().trim()
            let score = 0
            
            // Exakte Übereinstimmung = höchste Priorität (Score 100)
            if (nameLower === idLower || nameLower === decodedLower) {
              score = 100
            }
            // Exakte Übereinstimmung nach Normalisierung (Score 90)
            else {
              const nameNormalized = nameLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
              const idNormalized = idLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
              const decodedNormalized = decodedLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
              
              if (nameNormalized === idNormalized || nameNormalized === decodedNormalized) {
                score = 90
              }
              // Name beginnt mit Suchbegriff (Score 80)
              else if (nameLower.startsWith(idLower) || nameLower.startsWith(decodedLower)) {
                score = 80
              }
              // Name enthält Suchbegriff (Score 70)
              else if (nameLower.includes(idLower) || nameLower.includes(decodedLower)) {
                score = 70
              }
              // Normalisierter Name enthält normalisierten Suchbegriff (Score 60)
              else if (nameNormalized.includes(idNormalized) || nameNormalized.includes(decodedNormalized)) {
                score = 60
              }
              // Suchbegriff enthält Name (niedrigere Priorität, Score 50)
              else if (idLower.includes(nameLower) || decodedLower.includes(nameLower)) {
                score = 50
              }
              // Spezielle Behandlung für "Simex Geheimer Discord-Server"
              else if ((idLower.includes('simex') && idLower.includes('discord')) ||
                       (decodedLower.includes('simex') && decodedLower.includes('discord'))) {
                if (nameLower.includes('simex') && nameLower.includes('discord') && nameLower.includes('server')) {
                  score = 95 // Sehr hohe Priorität für Discord-Server
                }
              }
              else if ((idLower.includes('discord') && idLower.includes('server')) ||
                       (decodedLower.includes('discord') && decodedLower.includes('server'))) {
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
          const mockProduct = mockProducts.find((p: any) => String(p.id) === String(params.id))
          
          // Debug: Log wenn Produkt in Mock-Daten gefunden
          if (mockProduct) {
            console.log(`[API] Product with ID "${params.id}" found in mock data: ${mockProduct.name}`)
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
        
        // Konvertiere zu Product-Format
        return NextResponse.json({
          id: foundProduct.id,
          name: foundProduct.name,
          description: foundProduct.description,
          price: foundProduct.price,
          originalPrice: foundProduct.originalPrice,
          discount: foundProduct.discount,
          image: correctImage,
          category: foundProduct.category,
          platform: foundProduct.platform,
          rating: foundProduct.rating || 0,
          reviewCount: foundProduct.reviewCount || 0,
          inStock: foundProduct.inStock,
          tags: foundProduct.tags || [],
          seller: {
            id: foundProduct.sellerId || 'seller1',
            name: foundProduct.sellerId === 'seller1' ? 'GameDeals Pro' : foundProduct.sellerId === 'seller2' ? 'DigitalKeys Store' : foundProduct.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
            rating: 4.7,
            reviewCount: 2000,
            verified: true,
            avatar: null,
          },
          reviews: [],
        })
      }
    } catch (fallbackError) {
      console.warn('Fallback error:', fallbackError)
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/[id] - Produkt aktualisieren (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      originalPrice,
      discount,
      image,
      category,
      platform,
      tags,
      inStock,
    } = body

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(discount !== undefined && { discount: discount ? parseInt(discount) : null }),
        ...(image && { image }),
        ...(category && { category }),
        ...(platform && { platform }),
        ...(tags && { tags }),
        ...(inStock !== undefined && { inStock }),
      },
      include: {
        seller: true,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Produkt löschen (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}





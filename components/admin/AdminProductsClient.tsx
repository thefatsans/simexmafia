'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminGate } from '@/hooks/useAdminGate'
import { Product } from '@/types'
import { Plus, Edit, Trash2, Search, Package, Key } from 'lucide-react'
import ProductKeysModal from '@/components/admin/ProductKeysModal'
import AdminLoading from '@/components/admin/AdminLoading'
import { useToast } from '@/contexts/ToastContext'
import Image from 'next/image'
import ProductFormModal from '@/components/admin/ProductFormModal'
import { adminFetch } from '@/lib/admin-fetch'

type AdminProduct = Product & {
  keysAvailable?: number
  keysUsed?: number
  keysTotal?: number
}

function mapAdminProduct(p: Record<string, unknown>): AdminProduct {
  return {
    id: p.id as string,
    name: p.name as string,
    description: p.description as string,
    price: p.price as number,
    originalPrice: p.originalPrice as number | undefined,
    discount: p.discount as number | undefined,
    image: p.image as string,
    category: p.category as Product['category'],
    platform: p.platform as Product['platform'],
    seller: (p.seller as Product['seller'])
      ? {
          id: (p.seller as Product['seller']).id,
          name: (p.seller as Product['seller']).name,
          rating: (p.seller as Product['seller']).rating,
          reviewCount: (p.seller as Product['seller']).reviewCount,
          verified: (p.seller as Product['seller']).verified,
          avatar: (p.seller as Product['seller']).avatar,
        }
      : {
          id: 'seller-simexmafia',
          name: 'SimexMafia',
          rating: 5,
          reviewCount: 0,
          verified: true,
        },
    rating: (p.rating as number) || 0,
    reviewCount: (p.reviewCount as number) || 0,
    inStock: (p.inStock as boolean) ?? true,
    stockCount: p.stockCount as number | undefined,
    keysAvailable: (p.keysAvailable as number) ?? 0,
    keysUsed: (p.keysUsed as number) ?? 0,
    keysTotal: (p.keysTotal as number) ?? 0,
    tags: (p.tags as string[]) || [],
  }
}

export default function AdminProductsClient({
  initialProducts = null,
}: {
  initialProducts?: Record<string, unknown>[] | null
}) {
  const router = useRouter()
  const { user, isLoading: gateLoading, isReady } = useAdminGate()
  const { showSuccess, showError } = useToast()
  const [products, setProducts] = useState<AdminProduct[]>(() =>
    initialProducts ? initialProducts.map((p) => mapAdminProduct(p)) : []
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(!initialProducts)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [keysProduct, setKeysProduct] = useState<AdminProduct | null>(null)

  useEffect(() => {
    if (!isReady || !user || initialProducts) return
    loadProducts(user)
  }, [isReady, user, initialProducts])

  const loadProducts = async (currentUser: NonNullable<typeof user>) => {
    setIsLoading(true)
    try {
      const res = await adminFetch('/api/admin/products', currentUser)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setProducts((data || []).map((p: Record<string, unknown>) => mapAdminProduct(p)))
    } catch (error) {
      console.error('Error loading products:', error)
      showError('Fehler beim Laden der Produkte')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!user || !confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
      return
    }

    try {
      const res = await adminFetch(`/api/products/${productId}`, user, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Löschen fehlgeschlagen')
      }
      setProducts(products.filter((p) => p.id !== productId))
      showSuccess('Produkt erfolgreich gelöscht')
    } catch (error: unknown) {
      console.error('Error deleting product:', error)
      showError(error instanceof Error ? error.message : 'Fehler beim Löschen des Produkts')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if ((gateLoading && !initialProducts) || (isLoading && !initialProducts)) {
    return <AdminLoading label="Produkte werden geladen..." />
  }

  if (!isReady || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Produktverwaltung</h1>
            <p className="text-gray-400">Verwalten Sie alle Produkte im Shop</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin/products/migrate')}
              className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-semibold px-4 py-2 rounded-lg transition-colors"
              title="Produkte von localStorage in Datenbank migrieren"
            >
              <span>Migrieren</span>
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Neues Produkt</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Produkte durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-fortnite-darker border-b border-purple-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Produkt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Kategorie</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Plattform</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Preis</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Bestand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-purple-500/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-gray-400 text-sm">{product.seller.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{product.platform}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-white font-semibold">€{product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                          <span className="text-gray-500 text-sm line-through">
                            €{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {(product.keysTotal ?? 0) > 0 ? (
                        <div>
                          <span className="text-green-400 font-medium">
                            {product.keysAvailable ?? 0} verfügbar
                          </span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-blue-400">{product.keysUsed ?? 0} verkauft</span>
                        </div>
                      ) : product.stockCount !== undefined ? (
                        <span className="font-medium">{product.stockCount}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          product.inStock
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.inStock ? 'Auf Lager' : 'Nicht verfügbar'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setKeysProduct(product)}
                          className="p-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 rounded-lg transition-colors"
                          title="Keys verwalten"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine Produkte gefunden</p>
          </div>
        )}
      </div>

      {keysProduct && (
        <ProductKeysModal
          product={keysProduct}
          user={user}
          onClose={() => setKeysProduct(null)}
          onSaved={(stockCount) => {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === keysProduct.id
                  ? {
                      ...p,
                      stockCount,
                      keysAvailable: stockCount,
                      keysTotal: stockCount + (p.keysUsed ?? 0),
                      inStock: stockCount > 0,
                    }
                  : p
              )
            )
          }}
        />
      )}

      {/* Product Modal */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
          onManageKeys={(p) => {
            setShowModal(false)
            setEditingProduct(null)
            setKeysProduct(p)
          }}
          onSave={async (product) => {
            if (!user) return
            try {
              const payload = {
                name: product.name,
                description: product.description,
                price: product.price,
                originalPrice: product.originalPrice,
                discount: product.discount,
                image: product.image,
                category: product.category,
                platform: product.platform,
                tags: product.tags,
                inStock: product.inStock,
              }

              if (editingProduct) {
                const res = await adminFetch(`/api/products/${editingProduct.id}`, user, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                })
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}))
                  throw new Error(err.error || 'Update fehlgeschlagen')
                }
                const updated = mapAdminProduct(await res.json())
                setProducts(products.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
                showSuccess('Produkt erfolgreich aktualisiert')
              } else {
                const res = await adminFetch('/api/products', user, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...payload,
                    sellerId: product.seller.id,
                  }),
                })
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}))
                  throw new Error(err.error || 'Erstellen fehlgeschlagen')
                }
                const created = mapAdminProduct(await res.json())
                setProducts([created, ...products])
                showSuccess('Produkt erfolgreich hinzugefügt')
              }
              setShowModal(false)
              setEditingProduct(null)
            } catch (error: unknown) {
              console.error('Error saving product:', error)
              showError(error instanceof Error ? error.message : 'Fehler beim Speichern des Produkts')
            }
          }}
        />
      )}
    </div>
  )
}


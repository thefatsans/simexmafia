'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { getProductsFromAPI, createProductAPI, updateProductAPI, deleteProductAPI } from '@/lib/api/products'
import { Product } from '@/types'
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import Image from 'next/image'
import ProductFormModal from '@/components/admin/ProductFormModal'

export default function AdminProductsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return // Wait for auth to load
    }
    
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/auth/login')
      return
    }
    
    const userIsAdmin = isAdmin(user.email)
    console.log('Admin products page - Checking admin access:', { email: user.email, isAdmin: userIsAdmin })
    
    if (!userIsAdmin) {
      console.log('User is not admin, redirecting to account')
      router.push('/account')
      return
    }
    
    console.log('User is admin, loading products')
    loadProducts()
  }, [user, router, authLoading])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProductsFromAPI()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      showError('Fehler beim Laden der Produkte')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
      return
    }

    try {
      await deleteProductAPI(productId)
      setProducts(products.filter(p => p.id !== productId))
      showSuccess('Produkt erfolgreich gelöscht')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      showError(error.message || 'Fehler beim Löschen des Produkts')
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fortnite-darker">
        <div className="text-white">Lädt...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) {
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

      {/* Product Modal */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
          onSave={async (product) => {
            try {
              if (editingProduct) {
                // Update existing product
                const updated = await updateProductAPI(editingProduct.id, {
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
                })
                setProducts(products.map(p => p.id === updated.id ? updated : p))
                showSuccess('Produkt erfolgreich aktualisiert')
              } else {
                // Add new product
                const newProduct = await createProductAPI({
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  discount: product.discount,
                  image: product.image,
                  category: product.category,
                  platform: product.platform,
                  tags: product.tags,
                  sellerId: product.seller.id,
                  inStock: product.inStock,
                })
                setProducts([...products, newProduct])
                showSuccess('Produkt erfolgreich hinzugefügt')
              }
              setShowModal(false)
              setEditingProduct(null)
            } catch (error: any) {
              console.error('Error saving product:', error)
              showError(error.message || 'Fehler beim Speichern des Produkts')
            }
          }}
        />
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Product, Category, Platform } from '@/types'
import { X, Upload, Save } from 'lucide-react'
import { mockSellers } from '@/data/sellers'

interface ProductFormModalProps {
  product: Product | null
  onClose: () => void
  onSave: (product: Product) => void
}

const categories: Category[] = ['games', 'gift-cards', 'subscriptions', 'dlc', 'in-game-currency', 'top-ups']
const platforms: Platform[] = ['Steam', 'PlayStation', 'Xbox', 'Nintendo', 'Epic Games', 'Origin', 'Battle.net', 'Other']

export default function ProductFormModal({ product, onClose, onSave }: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    image: '',
    category: 'games' as Category,
    platform: 'Steam' as Platform,
    sellerId: mockSellers[0]?.id || '',
    rating: '4.5',
    reviewCount: '0',
    inStock: true,
    tags: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        discount: product.discount?.toString() || '',
        image: product.image,
        category: product.category,
        platform: product.platform,
        sellerId: product.seller.id,
        rating: product.rating.toString(),
        reviewCount: product.reviewCount.toString(),
        inStock: product.inStock,
        tags: product.tags.join(', '),
      })
    }
  }, [product])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Gültiger Preis ist erforderlich'
    }

    if (formData.originalPrice && parseFloat(formData.originalPrice) <= parseFloat(formData.price)) {
      newErrors.originalPrice = 'Originalpreis muss höher als der Preis sein'
    }

    if (!formData.image.trim()) {
      newErrors.image = 'Bild-URL ist erforderlich'
    }

    if (!formData.sellerId) {
      newErrors.sellerId = 'Verkäufer ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const selectedSeller = mockSellers.find(s => s.id === formData.sellerId)
    if (!selectedSeller) {
      return
    }

    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)

    const productData: Product = {
      id: product?.id || '',
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      discount: formData.originalPrice ? Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100) : undefined,
      image: formData.image.trim(),
      category: formData.category,
      platform: formData.platform,
      seller: selectedSeller,
      rating: parseFloat(formData.rating),
      reviewCount: parseInt(formData.reviewCount) || 0,
      inStock: formData.inStock,
      tags,
    }

    onSave(productData)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {product ? 'Produkt bearbeiten' : 'Neues Produkt'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Produktname *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-purple-500/30'
                }`}
                placeholder="z.B. Fortnite V-Bucks 1000"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beschreibung *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                  errors.description ? 'border-red-500' : 'border-purple-500/30'
                }`}
                placeholder="Produktbeschreibung..."
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preis (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.price ? 'border-red-500' : 'border-purple-500/30'
                }`}
                placeholder="7.99"
              />
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Originalpreis (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.originalPrice ? 'border-red-500' : 'border-purple-500/30'
                }`}
                placeholder="9.99"
              />
              {errors.originalPrice && <p className="text-red-400 text-sm mt-1">{errors.originalPrice}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kategorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plattform *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>

            {/* Seller */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verkäufer *
              </label>
              <select
                value={formData.sellerId}
                onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.sellerId ? 'border-red-500' : 'border-purple-500/30'
                }`}
              >
                {mockSellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
              {errors.sellerId && <p className="text-red-400 text-sm mt-1">{errors.sellerId}</p>}
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bild-URL *
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.image ? 'border-red-500' : 'border-purple-500/30'
                }`}
                placeholder="https://example.com/image.jpg"
              />
              {errors.image && <p className="text-red-400 text-sm mt-1">{errors.image}</p>}
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bewertung
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="4.5"
              />
            </div>

            {/* Review Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Anzahl Bewertungen
              </label>
              <input
                type="number"
                min="0"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>

            {/* In Stock */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="w-5 h-5 bg-fortnite-darker border-purple-500/30 rounded text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-300">Auf Lager</span>
              </label>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (kommagetrennt)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="fortnite, v-bucks, popular"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-purple-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-fortnite-darker border border-purple-500/30 text-gray-300 hover:border-purple-500 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
            >
              <Save className="w-5 h-5" />
              <span>{product ? 'Speichern' : 'Hinzufügen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}














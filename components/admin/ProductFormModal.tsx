'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product, Category, Platform } from '@/types'
import { X, Save, Key, ExternalLink } from 'lucide-react'
import { SIMEXMAFIA_SELLER, SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'
import { isKeyInventoryProduct } from '@/lib/products/key-inventory-catalog'

interface ProductFormModalProps {
  product: Product | null
  onClose: () => void
  onSave: (product: Product) => void
  onManageKeys?: (product: Product) => void
}

const categories: { value: Category; label: string }[] = [
  { value: 'games', label: 'Spiele' },
  { value: 'gift-cards', label: 'Gutscheine' },
  { value: 'subscriptions', label: 'Abonnements' },
  { value: 'dlc', label: 'DLC & Erweiterungen' },
  { value: 'in-game-currency', label: 'Spielwährung' },
  { value: 'top-ups', label: 'Aufladungen' },
]

const platforms: Platform[] = [
  'Steam',
  'PlayStation',
  'Xbox',
  'Nintendo',
  'Epic Games',
  'Origin',
  'Battle.net',
  'Discord',
  'Roblox',
  'Other',
]

const IMAGE_PRESETS: { label: string; url: string }[] = [
  {
    label: 'PSN 10 € (DE)',
    url: 'https://static.rapido.com/cms/sites/21/2020/08/04104235/Gift-cards-Dual-Branded.jpg',
  },
  {
    label: 'Roblox 800',
    url: 'https://cdn.cdkeys.com/media/catalog/product/r/o/roblox_800_robux.jpg',
  },
  {
    label: 'Discord Server',
    url: 'https://i.ibb.co/s9q1nZHs/image.png',
  },
]

function calcDiscountPercent(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

function calcOriginalFromDiscount(price: number, discountPercent: number): number | undefined {
  if (!discountPercent || discountPercent <= 0 || discountPercent >= 100) return undefined
  return Math.round((price / (1 - discountPercent / 100)) * 100) / 100
}

export default function ProductFormModal({
  product,
  onClose,
  onSave,
  onManageKeys,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    image: '',
    category: 'games' as Category,
    platform: 'Steam' as Platform,
    sellerId: SIMEXMAFIA_SELLER_ID,
    inStock: true,
    tags: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const usesKeyPool = product
    ? isKeyInventoryProduct(product) ||
      ('keysTotal' in product && ((product as Product & { keysTotal?: number }).keysTotal ?? 0) > 0)
    : false

  useEffect(() => {
    if (product) {
      const discount =
        product.discount ??
        (product.originalPrice
          ? calcDiscountPercent(product.price, product.originalPrice)
          : 0)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        discount: discount ? String(discount) : '',
        image: product.image,
        category: product.category,
        platform: product.platform,
        sellerId: product.seller.id,
        inStock: product.inStock,
        tags: product.tags.join(', '),
      })
    }
  }, [product])

  const savings = useMemo(() => {
    const price = parseFloat(formData.price)
    const original = parseFloat(formData.originalPrice)
    if (!price || !original || original <= price) return null
    const pct = calcDiscountPercent(price, original)
    return { amount: original - price, percent: pct }
  }, [formData.price, formData.originalPrice])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich'
    if (!formData.description.trim()) newErrors.description = 'Beschreibung ist erforderlich'
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Gültiger Preis ist erforderlich'
    }
    if (formData.originalPrice && parseFloat(formData.originalPrice) <= parseFloat(formData.price)) {
      newErrors.originalPrice = 'Originalpreis muss höher als der Preis sein'
    }
    if (!formData.image.trim()) newErrors.image = 'Bild-URL ist erforderlich'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePriceChange = (price: string) => {
    setFormData((prev) => {
      const next = { ...prev, price }
      const p = parseFloat(price)
      const d = parseInt(prev.discount, 10)
      if (p > 0 && d > 0) {
        const orig = calcOriginalFromDiscount(p, d)
        if (orig) next.originalPrice = orig.toFixed(2)
      }
      return next
    })
  }

  const handleOriginalPriceChange = (originalPrice: string) => {
    setFormData((prev) => {
      const next = { ...prev, originalPrice }
      const p = parseFloat(prev.price)
      const o = parseFloat(originalPrice)
      if (p > 0 && o > p) {
        next.discount = String(calcDiscountPercent(p, o))
      } else if (!originalPrice) {
        next.discount = ''
      }
      return next
    })
  }

  const handleDiscountChange = (discount: string) => {
    setFormData((prev) => {
      const next = { ...prev, discount }
      const p = parseFloat(prev.price)
      const d = parseInt(discount, 10)
      if (p > 0 && d > 0 && d < 100) {
        const orig = calcOriginalFromDiscount(p, d)
        if (orig) next.originalPrice = orig.toFixed(2)
      } else if (!discount) {
        next.originalPrice = ''
      }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const price = parseFloat(formData.price)
    const originalPrice = formData.originalPrice ? parseFloat(formData.originalPrice) : undefined
    const discount = formData.discount
      ? parseInt(formData.discount, 10)
      : originalPrice
        ? calcDiscountPercent(price, originalPrice)
        : undefined

    const productData: Product = {
      id: product?.id || '',
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      originalPrice,
      discount,
      image: formData.image.trim(),
      category: formData.category,
      platform: formData.platform,
      seller: product?.seller ?? SIMEXMAFIA_SELLER,
      rating: product?.rating ?? 0,
      reviewCount: product?.reviewCount ?? 0,
      inStock: usesKeyPool ? (product?.inStock ?? false) : formData.inStock,
      stockCount: product?.stockCount,
      tags,
    }

    onSave(productData)
  }

  const sectionClass = 'space-y-4 pb-6 border-b border-purple-500/20 last:border-0'
  const sectionTitle = 'text-lg font-semibold text-white mb-3'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2'
  const inputClass =
    'w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          <section className={sectionClass}>
            <h3 className={sectionTitle}>Grundlagen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Produkt-ID</label>
                  <input
                    type="text"
                    value={product.id}
                    readOnly
                    className={`${inputClass} text-gray-500 cursor-not-allowed`}
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className={labelClass}>Produktname *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Beschreibung *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`${inputClass} resize-none ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Kategorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Category })
                  }
                  className={inputClass}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Plattform *</label>
                <select
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value as Platform })
                  }
                  className={inputClass}
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Tags (kommagetrennt)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className={inputClass}
                  placeholder="gift-card, playstation, instant"
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className={sectionTitle}>Preis & Angebot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Preis (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className={`${inputClass} ${errors.price ? 'border-red-500' : ''}`}
                />
                {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className={labelClass}>Originalpreis (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  className={`${inputClass} ${errors.originalPrice ? 'border-red-500' : ''}`}
                />
                {errors.originalPrice && (
                  <p className="text-red-400 text-sm mt-1">{errors.originalPrice}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Rabatt (%)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className={inputClass}
                  placeholder="20"
                />
              </div>
            </div>
            {savings && (
              <p className="text-green-400 text-sm mt-2">
                Ersparnis: €{savings.amount.toFixed(2)} ({savings.percent}%)
              </p>
            )}
          </section>

          <section className={sectionClass}>
            <h3 className={sectionTitle}>Shop & Medien</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Bild-URL *</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className={`${inputClass} ${errors.image ? 'border-red-500' : ''}`}
                />
                {errors.image && <p className="text-red-400 text-sm mt-1">{errors.image}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className="text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              {formData.image && (
                <div className="md:col-span-2">
                  <p className={labelClass}>Vorschau</p>
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-purple-500/30 bg-fortnite-darker">
                    <Image
                      src={formData.image}
                      alt="Vorschau"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              <div>
                <label className={labelClass}>Verkäufer</label>
                <input
                  type="text"
                  value={SIMEXMAFIA_SELLER.name}
                  readOnly
                  className={`${inputClass} text-gray-500 cursor-not-allowed`}
                />
              </div>
              <div>
                <label className={labelClass}>Bewertung</label>
                <input
                  type="text"
                  value={
                    product
                      ? `${product.rating.toFixed(1)} (${product.reviewCount} Bewertungen)`
                      : '—'
                  }
                  readOnly
                  className={`${inputClass} text-gray-500 cursor-not-allowed`}
                />
                {product && (
                  <p className="text-gray-500 text-xs mt-1">Wird aus echten Kundenbewertungen berechnet</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  className={`flex items-center space-x-3 ${usesKeyPool ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={usesKeyPool ? product?.inStock ?? false : formData.inStock}
                    disabled={usesKeyPool}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-5 h-5 bg-fortnite-darker border-purple-500/30 rounded text-purple-500"
                  />
                  <span className="text-gray-300">Auf Lager</span>
                </label>
                {usesKeyPool && (
                  <p className="text-amber-400/90 text-xs mt-2">
                    Bestand wird über Keys gesteuert
                    {product?.stockCount !== undefined ? ` (${product.stockCount} verfügbar)` : ''}.
                  </p>
                )}
              </div>
            </div>
          </section>

          {product && (
            <div className="flex flex-wrap gap-3 pb-2">
              <Link
                href={`/products/${product.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
              >
                <ExternalLink className="w-4 h-4" />
                Im Shop ansehen
              </Link>
              {onManageKeys && (
                <button
                  type="button"
                  onClick={() => onManageKeys(product)}
                  className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
                >
                  <Key className="w-4 h-4" />
                  Keys verwalten
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-purple-500/20">
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

import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getSellerById, getSellerProducts } from '@/data/sellers'
import { Star, CheckCircle, TrendingUp, Package, Clock, Shield } from 'lucide-react'

export default function SellerPage({ params }: { params: { id: string } }) {
  const seller = getSellerById(params.id)

  if (!seller) {
    notFound()
  }

  const sellerProducts = getSellerProducts(params.id)
  const totalSales = sellerProducts.reduce((sum, product) => sum + product.reviewCount, 0)
  const averagePrice = sellerProducts.length > 0
    ? sellerProducts.reduce((sum, product) => sum + product.price, 0) / sellerProducts.length
    : 0

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-purple-400">Startseite</Link>
          <span className="mx-2">/</span>
          <Link href="/sellers" className="hover:text-purple-400">Verkäufer</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{seller.name}</span>
        </nav>

        {/* Seller Header */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-4xl font-bold text-white">{seller.name}</h1>
                {seller.verified && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                      Verifizierter Verkäufer
                    </span>
                  </div>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(seller.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="ml-3 text-white font-semibold text-xl">{seller.rating}</span>
                </div>
                <span className="text-gray-400">({seller.reviewCount.toLocaleString()} Bewertungen)</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Produkte</span>
                  </div>
                  <p className="text-white font-bold text-2xl">{sellerProducts.length}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Gesamtverkäufe</span>
                  </div>
                  <p className="text-white font-bold text-2xl">{totalSales.toLocaleString()}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Star className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Bewertung</span>
                  </div>
                  <p className="text-white font-bold text-2xl">{seller.rating}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Ø Preis</span>
                  </div>
                  <p className="text-white font-bold text-2xl">€{averagePrice.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">Über diesen Verkäufer</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {seller.verified
                  ? `${seller.name} ist ein verifizierter Verkäufer auf SimexMafia mit einer ausgezeichneten Erfolgsbilanz. Sie bieten konkurrenzfähige Preise und schnelle Lieferung bei allen digitalen Gaming-Produkten. Alle Transaktionen sind sicher und durch unsere Käuferschutzrichtlinie abgedeckt.`
                  : `${seller.name} bietet eine große Auswahl an digitalen Gaming-Produkten zu konkurrenzfähigen Preisen.`}
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">
              Produkte von {seller.name}
            </h2>
            <span className="text-gray-400">
              {sellerProducts.length} {sellerProducts.length === 1 ? 'Produkt' : 'Produkte'}
            </span>
          </div>

          {sellerProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-fortnite-dark border border-purple-500/20 rounded-lg">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Dieser Verkäufer hat derzeit keine Produkte verfügbar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



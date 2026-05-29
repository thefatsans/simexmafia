import { Suspense } from 'react'
import SearchPageClient from '@/components/SearchPageClient'
import { loadStorefrontCatalog } from '@/lib/products/load-storefront-catalog'
import { searchProducts } from '@/lib/search-utils'

export const revalidate = 60

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q?.trim() ?? ''
  const catalog = await loadStorefrontCatalog()

  const initialResults = query
    ? searchProducts(catalog, query, { minScore: 45, maxResults: 500 })
    : []

  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-400 text-lg text-center py-12">Suche läuft…</p>
          </div>
        </div>
      }
    >
      <SearchPageClient query={query} initialResults={initialResults} />
    </Suspense>
  )
}

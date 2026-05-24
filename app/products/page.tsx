import { Suspense } from 'react'
import ProductsPageContent from '@/components/ProductsPageContent'

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Produkte werden geladen…
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  )
}

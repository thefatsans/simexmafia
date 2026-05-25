import { Suspense } from 'react'
import ProductsPageContent from '@/components/ProductsPageContent'
import { LoadingPage } from '@/components/LoadingSpinner'

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingPage label="Produkte werden geladen..." />}>
      <ProductsPageContent />
    </Suspense>
  )
}

import ProductsPageContent from '@/components/ProductsPageContent'
import { loadStorefrontCatalog } from '@/lib/products/load-storefront-catalog'

export const revalidate = 60

export default async function ProductsPage() {
  const initialProducts = await loadStorefrontCatalog()
  return <ProductsPageContent initialProducts={initialProducts} />
}

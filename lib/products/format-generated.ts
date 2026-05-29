import { resolveSeller } from '@/lib/sellers'

export function formatGeneratedProducts(generatedProducts: Array<Record<string, unknown>>) {
  return generatedProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    discount: p.discount ?? undefined,
    image: p.image,
    category: p.category,
    platform: p.platform,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    inStock: p.inStock ?? true,
    tags: p.tags ?? [],
    seller: resolveSeller(p.sellerId),
  }))
}

/** @deprecated Nutze getStorefrontFallbackCatalog() — lädt nur Shop-Produkte, nicht den vollen Seed-Katalog. */
export async function loadGeneratedProductsCatalog() {
  const { getStorefrontFallbackCatalog } = await import('@/lib/products/storefront-seeds')
  return getStorefrontFallbackCatalog()
}

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

export async function loadGeneratedProductsCatalog() {
  const { generateProducts } = await import('@/prisma/product-data')
  const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4', 'seller-simexmafia']
  return formatGeneratedProducts(generateProducts(sellerIds) as any)
}

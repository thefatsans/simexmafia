import { Product } from '@/types'

export type ProductSortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'popularity'
  | 'name-asc'
  | 'name-desc'
  | 'discount-desc'

export function sortProducts<T extends Product>(products: T[], sortOption: ProductSortOption): T[] {
  const sorted = [...products]

  sorted.sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'rating-desc':
        return b.rating - a.rating
      case 'rating-asc':
        return a.rating - b.rating
      case 'popularity':
        return b.reviewCount - a.reviewCount
      case 'name-asc':
        return a.name.localeCompare(b.name, 'de')
      case 'name-desc':
        return b.name.localeCompare(a.name, 'de')
      case 'discount-desc':
        return (b.discount || 0) - (a.discount || 0)
      default:
        return a.name.localeCompare(b.name, 'de')
    }
  })

  return sorted
}

/** Gruppiert Produkte nach Kategorie in fester Reihenfolge */
export function groupProductsByCategory(
  products: Product[],
  categoryOrder: Product['category'][]
): Partial<Record<Product['category'], Product[]>> {
  const grouped = products.reduce(
    (acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = []
      }
      acc[product.category]!.push(product)
      return acc
    },
    {} as Partial<Record<Product['category'], Product[]>>
  )

  return grouped
}

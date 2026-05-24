import { Product } from '@/types'

export interface ProductQueryFilters {
  category?: string | null
  platform?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  inStock?: boolean
  search?: string | null
}

export function parseProductQueryFromSearchParams(
  searchParams: URLSearchParams
): ProductQueryFilters {
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')

  return {
    category: searchParams.get('category'),
    platform: searchParams.get('platform'),
    minPrice: minPrice != null && minPrice !== '' ? parseFloat(minPrice) : null,
    maxPrice: maxPrice != null && maxPrice !== '' ? parseFloat(maxPrice) : null,
    inStock: searchParams.get('inStock') === 'true',
    search: searchParams.get('search'),
  }
}

export function applyProductQueryFilters<T extends Product>(
  products: T[],
  filters: ProductQueryFilters
): T[] {
  let result = [...products]

  if (filters.category) {
    result = result.filter((p) => p.category === filters.category)
  }

  if (filters.platform) {
    result = result.filter((p) => p.platform === filters.platform)
  }

  if (filters.inStock) {
    result = result.filter((p) => p.inStock)
  }

  if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
    result = result.filter((p) => p.price >= filters.minPrice!)
  }

  if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
    result = result.filter((p) => p.price <= filters.maxPrice!)
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(q))
    )
  }

  return result
}

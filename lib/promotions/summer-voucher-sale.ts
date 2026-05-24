import { Product } from '@/types'

export const SUMMER_VOUCHER_SALE = {
  active: true,
  category: 'gift-cards' as const,
  minDiscount: 20,
  maxDiscount: 30,
  label: 'Sommer-Sale',
  endsLabel: 'Nur für kurze Zeit',
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** 20 % für alle Gutscheine, ~30 % der Produkte erhalten 30 % */
export function getSummerVoucherDiscountPercent(productId: string): number {
  return hashString(productId) % 100 < 32 ? 30 : 20
}

export function applySummerVoucherSale<T extends Pick<Product, 'id' | 'category' | 'price' | 'originalPrice' | 'discount'>>(
  product: T
): T {
  if (!SUMMER_VOUCHER_SALE.active || product.category !== SUMMER_VOUCHER_SALE.category) {
    return product
  }

  const basePrice =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : product.price

  const discount = getSummerVoucherDiscountPercent(product.id)
  const salePrice = Math.round(basePrice * (1 - discount / 100) * 100) / 100

  return {
    ...product,
    originalPrice: basePrice,
    price: salePrice,
    discount,
  }
}

export function applySummerVoucherSaleList<T extends Pick<Product, 'id' | 'category' | 'price' | 'originalPrice' | 'discount'>>(
  products: T[]
): T[] {
  return products.map(applySummerVoucherSale)
}

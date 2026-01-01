// Utility to update product images with the latest from complete-product-images.ts
// This ensures all products always use the correct, up-to-date images

import { getCompleteProductImage } from '@/prisma/complete-product-images'
import { Product } from '@/types'

/**
 * Updates a single product's image with the latest from complete-product-images.ts
 */
export function updateProductImage(product: Product): Product {
  if (!product.name) return product
  
  const correctImage = getCompleteProductImage(product.name)
  
  if (correctImage) {
    return {
      ...product,
      image: correctImage,
    }
  }
  
  return product
}

/**
 * Updates multiple products' images with the latest from complete-product-images.ts
 */
export function updateProductImages(products: Product[]): Product[] {
  return products.map(product => updateProductImage(product))
}

/**
 * Updates product image by name (useful for order items)
 */
export function getProductImageByName(productName: string): string | null {
  if (!productName) return null
  return getCompleteProductImage(productName)
}










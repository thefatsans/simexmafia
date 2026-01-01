import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Load DATABASE_URL from .env.local manually
let DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  try {
    const envFile = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/)
    if (match) {
      DATABASE_URL = match[1]
    }
  } catch (error) {
    console.error('Error reading .env.local:', error)
  }
}

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please set it in .env.local or as environment variable.')
}

// Set DATABASE_URL in environment before creating PrismaClient
process.env.DATABASE_URL = DATABASE_URL

console.log('🔗 Using DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...')

// Create PrismaClient instance with adapter for Prisma 7
const pool = new Pool({
  connectionString: DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function migrateLocalStorageProducts() {
  console.log('🔄 Migrating products from localStorage to database...')
  
  // This script should be run in the browser context or we need to read from a file
  // For now, we'll create a helper script that can be run from the browser console
  // or we can create an API endpoint to do this migration
  
  console.log(`
📝 To migrate your localStorage products to the database, you have two options:

Option 1: Run this in your browser console (on the admin products page):
---------------------------------------------------------------
const products = JSON.parse(localStorage.getItem('simexmafia-admin-products') || '[]');
const mockProductIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
const adminProducts = products.filter(p => !mockProductIds.includes(p.id));

// Then call the API endpoint to import them
adminProducts.forEach(async (product) => {
  await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      image: product.image,
      category: product.category,
      platform: product.platform,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      inStock: product.inStock,
      tags: product.tags || [],
      sellerId: product.seller.id || 'seller1', // Default seller
    }),
  });
});

Option 2: Use the API endpoint directly
---------------------------------------------------------------
We'll create an API endpoint /api/products/migrate that you can call.
  `)
  
  // Check if there are any products in the database that aren't from seed
  const existingProducts = await prisma.product.findMany({
    where: {
      NOT: {
        id: {
          in: ['1', '2', '3', '4', '5', '6', '7', '8']
        }
      }
    }
  })
  
  console.log(`\n✅ Found ${existingProducts.length} products in database (excluding seed products)`)
  
  await prisma.$disconnect()
}

migrateLocalStorageProducts()
  .catch((e) => {
    console.error('❌ Error migrating products:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })













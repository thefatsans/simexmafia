// Script to find which products don't have images in the complete mapping
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { getCompleteProductImage } from './complete-product-images'
import { getProductImage } from './image-helper'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function findMissingProducts() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set')
    process.exit(1)
  }

  let adapter: PrismaPg | undefined
  try {
    const pool = new Pool({ connectionString: databaseUrl })
    adapter = new PrismaPg(pool)
  } catch (error) {
    console.error('Error creating adapter:', error)
    process.exit(1)
  }

  const prisma = new PrismaClient({
    adapter: adapter,
    log: ['error'],
  })

  try {
    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    console.log(`\n📦 Checking ${products.length} products for missing images...\n`)

    const missing: Array<{ name: string; platform: string; category: string; currentImage: string }> = []

    for (const product of products) {
      const completeImage = getCompleteProductImage(product.name)
      const helperImage = getProductImage(product.category, product.platform, product.name, product.id)
      
      // Check if it's a generic Unsplash image or placeholder
      const isGeneric = product.image.includes('unsplash.com') || 
                       product.image.includes('steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad')
      
      if (!completeImage && isGeneric) {
        missing.push({
          name: product.name,
          platform: product.platform,
          category: product.category,
          currentImage: product.image.substring(0, 80) + '...',
        })
      }
    }

    if (missing.length > 0) {
      console.log(`⚠️  Found ${missing.length} products with generic/placeholder images:\n`)
      missing.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p.platform}, ${p.category})`)
      })
      console.log(`\n📝 These need specific image URLs added to complete-product-images.ts`)
    } else {
      console.log('✅ All products have specific images!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findMissingProducts()












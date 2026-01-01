// Script to update ALL products with correct images from complete mapping
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { getCompleteProductImage } from './complete-product-images'
import { getProductImage } from './image-helper'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function updateAllProductsComplete() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set')
    process.exit(1)
  }

  console.log('🔗 Connecting to database...')

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
    console.log('🔍 Fetching all products...')
    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    console.log(`📦 Found ${products.length} products`)
    console.log('🖼️  Updating ALL product images with complete mapping...\n')

    let updated = 0
    let skipped = 0
    const missing: Array<{ name: string; platform: string; category: string }> = []

    for (const product of products) {
      // First try complete mapping
      let newImageUrl = getCompleteProductImage(product.name)
      
      // If not found, try image helper
      if (!newImageUrl) {
        newImageUrl = getProductImage(product.category, product.platform, product.name, product.id)
      }
      
      if (newImageUrl && newImageUrl !== product.image) {
        await prisma.product.update({
          where: { id: product.id },
          data: { image: newImageUrl },
        })
        updated++
        console.log(`✅ Updated: ${product.name}`)
      } else if (!newImageUrl) {
        missing.push({ name: product.name, platform: product.platform, category: product.category })
        skipped++
        console.log(`⚠️  No image found for: ${product.name} (${product.platform}, ${product.category})`)
      } else {
        skipped++
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} products!`)
    console.log(`⏭️  Skipped ${skipped} products`)
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing images for ${missing.length} products:`)
      missing.forEach(p => console.log(`   - ${p.name} (${p.platform}, ${p.category})`))
      console.log('\n📝 These products need manual image URLs added to complete-product-images.ts')
    } else {
      console.log('\n✅ All products have images!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateAllProductsComplete()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })












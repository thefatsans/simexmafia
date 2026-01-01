// Script to update all product images in the database using the product-images.ts mapping
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { getCustomProductImage } from './product-images'
import { getProductImage } from './image-helper'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function updateAllProductImages() {
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
      include: { seller: true },
    })

    console.log(`📦 Found ${products.length} products`)
    console.log('🖼️  Updating product images...\n')

    let updated = 0
    let skipped = 0

    for (const product of products) {
      // Try to get custom image first
      const customImage = getCustomProductImage(product.name, product.id)
      
      if (customImage && customImage !== product.image) {
        await prisma.product.update({
          where: { id: product.id },
          data: { image: customImage },
        })
        updated++
        console.log(`✅ Updated: ${product.name}`)
      } else {
        // Use the image helper to get a better image
        const betterImage = getProductImage(
          product.category,
          product.platform,
          product.name,
          product.id
        )
        
        if (betterImage !== product.image) {
          await prisma.product.update({
            where: { id: product.id },
            data: { image: betterImage },
          })
          updated++
          console.log(`✅ Updated: ${product.name}`)
        } else {
          skipped++
        }
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} products!`)
    console.log(`⏭️  Skipped ${skipped} products (already have correct images)`)
  } catch (error) {
    console.error('❌ Error updating product images:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateAllProductImages()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })












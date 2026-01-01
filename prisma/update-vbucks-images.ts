// Script to update V-Bucks product images in the database
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const V_BUCKS_IMAGE_URL = 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270'

async function updateVBucksImages() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env.local')
    process.exit(1)
  }

  console.log('🔗 Connecting to database...')

  let adapter: PrismaPg | undefined
  try {
    const pool = new Pool({
      connectionString: databaseUrl,
    })
    adapter = new PrismaPg(pool)
  } catch (error) {
    console.error('Error creating Prisma adapter:', error)
    process.exit(1)
  }

  const prisma = new PrismaClient({
    adapter: adapter,
    log: ['error', 'warn'],
  })

  try {
    console.log('🔍 Searching for V-Bucks products...')
    
    // Find all V-Bucks products
    const vbucksProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'V-Bucks', mode: 'insensitive' } },
          { name: { contains: 'vbucks', mode: 'insensitive' } },
          { name: { contains: 'Fortnite', mode: 'insensitive' } },
        ],
        category: 'in-game-currency',
        platform: 'Epic Games',
      },
    })

    console.log(`📦 Found ${vbucksProducts.length} V-Bucks products`)

    if (vbucksProducts.length === 0) {
      console.log('⚠️  No V-Bucks products found. Make sure products are seeded first.')
      return
    }

    // Update all V-Bucks products with the new image
    let updated = 0
    for (const product of vbucksProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { image: V_BUCKS_IMAGE_URL },
      })
      updated++
      console.log(`✅ Updated: ${product.name}`)
    }

    console.log(`\n🎉 Successfully updated ${updated} V-Bucks products with new image!`)
    console.log(`🖼️  Image URL: ${V_BUCKS_IMAGE_URL}`)
  } catch (error) {
    console.error('❌ Error updating V-Bucks images:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateVBucksImages()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })












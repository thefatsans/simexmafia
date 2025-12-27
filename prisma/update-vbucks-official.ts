// Script to update V-Bucks products to official Epic Games packages
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const V_BUCKS_IMAGE_URL = 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270'

// Official V-Bucks packages from Epic Games
const OFFICIAL_PACKAGES = [
  { amount: 1000, originalPrice: 8.99, price: 7.64 },
  { amount: 2800, originalPrice: 22.99, price: 19.54 },
  { amount: 5000, originalPrice: 39.99, price: 33.99 },
  { amount: 13500, originalPrice: 99.99, price: 84.99 },
]

async function updateVBucksToOfficial() {
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
    console.log('🔍 Finding all V-Bucks products...')
    
    // Find all V-Bucks products
    const allVBucksProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'V-Bucks', mode: 'insensitive' } },
          { name: { contains: 'vbucks', mode: 'insensitive' } },
        ],
        category: 'in-game-currency',
        platform: 'Epic Games',
      },
    })

    console.log(`📦 Found ${allVBucksProducts.length} V-Bucks products`)

    // Delete non-official packages
    const officialAmounts = OFFICIAL_PACKAGES.map(p => p.amount)
    const toDelete = allVBucksProducts.filter(p => {
      const amount = parseInt(p.name.replace(/[^\d]/g, ''))
      return !officialAmounts.includes(amount)
    })

    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} non-official V-Bucks packages:`)
      for (const product of toDelete) {
        await prisma.product.delete({ where: { id: product.id } })
        console.log(`   ❌ Deleted: ${product.name}`)
      }
    }

    // Update or create official packages
    console.log(`\n📝 Updating/Creating official V-Bucks packages:`)
    for (const pkg of OFFICIAL_PACKAGES) {
      // Find all products with this amount (handle duplicates)
      const existingProducts = allVBucksProducts.filter(p => {
        const amount = parseInt(p.name.replace(/[^\d]/g, ''))
        return amount === pkg.amount
      })

      if (existingProducts.length > 0) {
        // Keep the first one (or the one with proper formatting), delete others
        const toKeep = existingProducts[0] // Keep the first one found
        const toDelete = existingProducts.slice(1)

        // Delete duplicates
        if (toDelete.length > 0) {
          console.log(`   🗑️  Removing ${toDelete.length} duplicate(s) for ${pkg.amount.toLocaleString()} V-Bucks:`)
          for (const duplicate of toDelete) {
            await prisma.product.delete({ where: { id: duplicate.id } })
            console.log(`      ❌ Deleted: ${duplicate.name} (ID: ${duplicate.id})`)
          }
        }

        // Update the kept product
        await prisma.product.update({
          where: { id: toKeep.id },
          data: {
            name: `Fortnite V-Bucks ${pkg.amount.toLocaleString()}`,
            description: `Get ${pkg.amount.toLocaleString()} V-Bucks to purchase Battle Pass, skins, emotes, and more in Fortnite! Official Epic Games package. Instant delivery.`,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            discount: Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100),
            image: V_BUCKS_IMAGE_URL,
          },
        })
        console.log(`   ✅ Updated: Fortnite V-Bucks ${pkg.amount.toLocaleString()} (ID: ${toKeep.id})`)
      } else {
        // Create new product (we need a seller ID)
        const sellers = await prisma.seller.findMany({ take: 1 })
        if (sellers.length === 0) {
          console.error('❌ No sellers found. Please run db:seed first.')
          return
        }

        await prisma.product.create({
          data: {
            name: `Fortnite V-Bucks ${pkg.amount.toLocaleString()}`,
            description: `Get ${pkg.amount.toLocaleString()} V-Bucks to purchase Battle Pass, skins, emotes, and more in Fortnite! Official Epic Games package. Instant delivery.`,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            discount: Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100),
            image: V_BUCKS_IMAGE_URL,
            category: 'in-game-currency',
            platform: 'Epic Games',
            rating: 4.5 + Math.random() * 0.5,
            reviewCount: Math.floor(Math.random() * 1000) + 100,
            inStock: true,
            tags: ['fortnite', 'v-bucks', 'popular', 'instant', 'official'],
            sellerId: sellers[0].id,
          },
        })
        console.log(`   ✅ Created: Fortnite V-Bucks ${pkg.amount.toLocaleString()}`)
      }
    }

    console.log(`\n🎉 Successfully updated to official V-Bucks packages!`)
    console.log(`📊 Official packages: ${OFFICIAL_PACKAGES.map(p => p.amount.toLocaleString()).join(', ')} V-Bucks`)
  } catch (error) {
    console.error('❌ Error updating V-Bucks products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateVBucksToOfficial()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })


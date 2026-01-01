// Script to list all products with their current images
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function listProductsWithImages() {
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
      select: {
        id: true,
        name: true,
        category: true,
        platform: true,
        image: true,
      },
    })

    console.log(`\n📦 Total products: ${products.length}\n`)
    
    // Group by category
    const byCategory: Record<string, typeof products> = {}
    for (const product of products) {
      if (!byCategory[product.category]) {
        byCategory[product.category] = []
      }
      byCategory[product.category].push(product)
    }

    for (const [category, categoryProducts] of Object.entries(byCategory)) {
      console.log(`\n📁 ${category.toUpperCase()} (${categoryProducts.length} products):`)
      console.log('─'.repeat(80))
      
      for (const product of categoryProducts) {
        const isGeneric = product.image.includes('unsplash.com') || 
                         product.image.includes('steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad')
        const status = isGeneric ? '⚠️  GENERIC' : '✅'
        console.log(`${status} ${product.name} (${product.platform})`)
        if (isGeneric) {
          console.log(`   Current: ${product.image.substring(0, 80)}...`)
        }
      }
    }

    // Count generic images
    const genericCount = products.filter(p => 
      p.image.includes('unsplash.com') || 
      p.image.includes('steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad')
    ).length

    console.log(`\n\n📊 Summary:`)
    console.log(`   Total products: ${products.length}`)
    console.log(`   ✅ Specific images: ${products.length - genericCount}`)
    console.log(`   ⚠️  Generic images: ${genericCount}`)
    
    if (genericCount > 0) {
      console.log(`\n⚠️  ${genericCount} products still have generic/placeholder images!`)
    } else {
      console.log(`\n✅ All products have specific images!`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listProductsWithImages()












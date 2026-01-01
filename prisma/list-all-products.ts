// Script to list all products in the database
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function listAllProducts() {
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
      select: {
        id: true,
        name: true,
        category: true,
        platform: true,
        image: true,
      },
      orderBy: [
        { category: 'asc' },
        { platform: 'asc' },
        { name: 'asc' },
      ],
    })

    console.log(`\n📦 Found ${products.length} products:\n`)
    
    const byCategory: Record<string, any[]> = {}
    products.forEach(p => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = []
      }
      byCategory[p.category].push(p)
    })

    for (const [category, items] of Object.entries(byCategory)) {
      console.log(`\n=== ${category.toUpperCase()} (${items.length} products) ===`)
      items.forEach(p => {
        console.log(`  - ${p.name} (${p.platform})`)
      })
    }

    // Write to file for easier processing
    const fs = require('fs')
    fs.writeFileSync(
      'prisma/products-list.json',
      JSON.stringify(products, null, 2)
    )
    console.log(`\n✅ Product list saved to prisma/products-list.json`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAllProducts()












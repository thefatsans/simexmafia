// Script to check for duplicate V-Bucks products
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function checkDuplicates() {
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
    const vbucksProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'V-Bucks', mode: 'insensitive' } },
          { name: { contains: 'vbucks', mode: 'insensitive' } },
        ],
        category: 'in-game-currency',
        platform: 'Epic Games',
      },
      orderBy: { name: 'asc' },
    })

    console.log(`\n📦 Found ${vbucksProducts.length} V-Bucks products:\n`)

    const amounts = new Map<number, any[]>()
    
    vbucksProducts.forEach(product => {
      const amount = parseInt(product.name.replace(/[^\d]/g, ''))
      if (!amounts.has(amount)) {
        amounts.set(amount, [])
      }
      amounts.get(amount)!.push(product)
    })

    let hasDuplicates = false
    amounts.forEach((products, amount) => {
      if (products.length > 1) {
        hasDuplicates = true
        console.log(`⚠️  DUPLICATE: ${amount} V-Bucks (${products.length} products):`)
        products.forEach(p => {
          console.log(`   - ID: ${p.id}, Name: ${p.name}, Price: €${p.price}`)
        })
      } else {
        console.log(`✅ ${amount.toLocaleString()} V-Bucks: ${products[0].name} (€${products[0].price})`)
      }
    })

    if (!hasDuplicates) {
      console.log(`\n✅ No duplicates found! All V-Bucks products are unique.`)
    } else {
      console.log(`\n⚠️  Found duplicates! Consider running cleanup.`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates()












// Script to find and remove duplicate products
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function findAndRemoveDuplicates() {
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
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    })

    console.log(`📦 Found ${products.length} products`)
    console.log('🔎 Searching for duplicates...\n')

    // Group products by name, platform, and category
    const productMap = new Map<string, Array<{ id: string; name: string; platform: string; category: string; price: number; createdAt: Date }>>()

    for (const product of products) {
      // Create a unique key based on name, platform, and category
      const key = `${product.name}|${product.platform}|${product.category}`
      
      if (!productMap.has(key)) {
        productMap.set(key, [])
      }
      
      productMap.get(key)!.push({
        id: product.id,
        name: product.name,
        platform: product.platform,
        category: product.category,
        price: product.price,
        createdAt: product.createdAt,
      })
    }

    // Find duplicates
    const duplicates: Array<{ key: string; products: Array<{ id: string; name: string; platform: string; category: string; price: number; createdAt: Date }> }> = []
    
    for (const [key, productList] of productMap.entries()) {
      if (productList.length > 1) {
        duplicates.push({ key, products: productList })
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!')
      return
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate groups:\n`)

    let totalToDelete = 0
    const toDelete: string[] = []

    for (const duplicate of duplicates) {
      const [name, platform, category] = duplicate.key.split('|')
      console.log(`📋 "${name}" (${platform}, ${category}):`)
      console.log(`   Found ${duplicate.products.length} duplicates`)

      // Sort by creation date (keep the oldest one)
      const sorted = [...duplicate.products].sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )

      // Keep the first one (oldest), delete the rest
      const keep = sorted[0]
      const deleteList = sorted.slice(1)

      console.log(`   ✅ Keeping: ${keep.id} (created: ${keep.createdAt.toISOString()}, price: €${keep.price})`)
      
      for (const del of deleteList) {
        console.log(`   ❌ Deleting: ${del.id} (created: ${del.createdAt.toISOString()}, price: €${del.price})`)
        toDelete.push(del.id)
        totalToDelete++
      }
      console.log('')
    }

    if (toDelete.length === 0) {
      console.log('✅ No duplicates to remove')
      return
    }

    console.log(`\n🗑️  Deleting ${totalToDelete} duplicate products...`)
    
    for (const id of toDelete) {
      await prisma.product.delete({
        where: { id },
      })
    }

    console.log(`\n✅ Successfully deleted ${totalToDelete} duplicate products`)
    console.log(`✅ Kept ${products.length - totalToDelete} unique products`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

findAndRemoveDuplicates()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })


/**
 * Reduces the database catalog to PSN 10 € (DE) at 9,99 € (+ keeps Discord product rows for orders).
 * Run: npm run db:catalog-psn-only
 */
import { readFileSync } from 'fs'
import path from 'path'

if (!process.env.DATABASE_URL) {
  try {
    const envFile = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/)
    if (match) {
      process.env.DATABASE_URL = match[1]
    }
    if (envFile.includes('NODE_TLS_REJECT_UNAUTHORIZED=0')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }
  } catch {
    // .env.local optional when DATABASE_URL is set in the shell
  }
}

if (process.env.DATABASE_URL?.includes('supabase') && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { generateId } from './product-data'
import { getProductImage } from './image-helper'
import { PSN_10_DE_LEGACY_NAME, PSN_10_DE_PRODUCT_NAME } from '../lib/products/storefront-catalog'
import { SIMEXMAFIA_SELLER_ID } from '../lib/sellers'

const PSN_10_PRODUCT_ID = generateId(PSN_10_DE_LEGACY_NAME, 'gift-cards', 'PlayStation')

const PSN_10_DESCRIPTION =
  'PlayStation Store Guthaben 10 € für deutsche PSN-Accounts (Region DE). ' +
  'Digitaler Code – Lieferung nach Zahlung. Nur auf einem deutschen PlayStation Network-Konto einlösbar.'

function isDiscordProductRow(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    (lower.includes('simex') && lower.includes('discord')) ||
    (lower.includes('geheimer') && lower.includes('discord'))
  )
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    await prisma.seller.upsert({
      where: { id: SIMEXMAFIA_SELLER_ID },
      update: {
        name: 'SimexMafia',
        verified: true,
      },
      create: {
        id: SIMEXMAFIA_SELLER_ID,
        name: 'SimexMafia',
        rating: 0,
        reviewCount: 0,
        verified: true,
      },
    })

    const image = getProductImage(
      'gift-cards',
      'PlayStation',
      PSN_10_DE_LEGACY_NAME,
      PSN_10_PRODUCT_ID
    )

    await prisma.product.upsert({
      where: { id: PSN_10_PRODUCT_ID },
      create: {
        id: PSN_10_PRODUCT_ID,
        name: PSN_10_DE_PRODUCT_NAME,
        description: PSN_10_DESCRIPTION,
        price: 9.99,
        originalPrice: 10,
        discount: 1,
        image,
        category: 'gift-cards',
        platform: 'PlayStation',
        tags: ['gift-card', 'playstation', 'instant', 'de', 'psn-10'],
        sellerId: SIMEXMAFIA_SELLER_ID,
        inStock: true,
        rating: 4.8,
        reviewCount: 0,
      },
      update: {
        name: PSN_10_DE_PRODUCT_NAME,
        description: PSN_10_DESCRIPTION,
        price: 9.99,
        originalPrice: 10,
        discount: 1,
        image,
        category: 'gift-cards',
        platform: 'PlayStation',
        tags: ['gift-card', 'playstation', 'instant', 'de', 'psn-10'],
        sellerId: SIMEXMAFIA_SELLER_ID,
        inStock: true,
      },
    })

    console.log(`Upserted PSN 10 € DE (id=${PSN_10_PRODUCT_ID})`)

    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { orderItems: true } },
      },
    })

    let deleted = 0
    let archived = 0

    for (const product of allProducts) {
      if (product.id === PSN_10_PRODUCT_ID) continue
      if (isDiscordProductRow(product.name)) continue

      await prisma.cartItem.deleteMany({ where: { productId: product.id } })
      await prisma.wishlistItem.deleteMany({ where: { productId: product.id } })
      await prisma.inventoryItem.deleteMany({ where: { productId: product.id } })

      if (product._count.orderItems === 0) {
        await prisma.product.delete({ where: { id: product.id } })
        deleted++
      } else {
        const archivedName = product.name.startsWith('[ARCHIV]')
          ? product.name
          : `[ARCHIV] ${product.name}`
        await prisma.product.update({
          where: { id: product.id },
          data: { inStock: false, name: archivedName },
        })
        archived++
      }
    }

    console.log(`Removed ${deleted} products, archived ${archived} with existing orders.`)
    console.log('Storefront shows PSN 10 € (DE) + Discord via API filter.')
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

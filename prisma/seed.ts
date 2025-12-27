import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import path from 'path'

// Load DATABASE_URL from .env.local manually
let DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  try {
    const envFile = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/)
    if (match) {
      DATABASE_URL = match[1]
    }
  } catch (error) {
    console.error('Error reading .env.local:', error)
  }
}

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please set it in .env.local or as environment variable.')
}

// Set DATABASE_URL in environment before creating PrismaClient
process.env.DATABASE_URL = DATABASE_URL

console.log('🔗 Using DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...')

// For Prisma 7, we need to use the connection string from prisma.config.ts
// But since we're in a seed script, we'll use the direct connection
// Import Pool from pg and create adapter
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({
  connectionString: DATABASE_URL,
})

const adapter = new PrismaPg(pool)

// Create PrismaClient instance with adapter for Prisma 7
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Erstelle alle Seller
  const seller1 = await prisma.seller.upsert({
    where: { id: 'seller1' },
    update: {},
    create: {
      id: 'seller1',
      name: 'GameDeals Pro',
      rating: 4.8,
      reviewCount: 1245,
      verified: true,
    },
  })

  const seller2 = await prisma.seller.upsert({
    where: { id: 'seller2' },
    update: {},
    create: {
      id: 'seller2',
      name: 'DigitalKeys Store',
      rating: 4.9,
      reviewCount: 3421,
      verified: true,
    },
  })

  const seller3 = await prisma.seller.upsert({
    where: { id: 'seller3' },
    update: {},
    create: {
      id: 'seller3',
      name: 'GiftCard Masters',
      rating: 4.7,
      reviewCount: 8923,
      verified: true,
    },
  })

  const seller4 = await prisma.seller.upsert({
    where: { id: 'seller4' },
    update: {},
    create: {
      id: 'seller4',
      name: 'Subscriptions Hub',
      rating: 4.6,
      reviewCount: 2134,
      verified: true,
    },
  })

  console.log('✅ Sellers created')

  // Erstelle Test-User
  const user1 = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      goofyCoins: 342,
      totalSpent: 287.50,
      tier: 'Gold',
    },
  })

  // Erstelle Admin-User (für Admin-Panel Zugriff)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@simexmafia.de' },
    update: {},
    create: {
      email: 'admin@simexmafia.de',
      firstName: 'Admin',
      lastName: 'User',
      goofyCoins: 10000,
      totalSpent: 5000.00,
      tier: 'Diamond',
    },
  })

  // Erstelle Test-User für Admin-Zugriff (wird auch als Admin erkannt)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      goofyCoins: 500,
      totalSpent: 120.50,
      tier: 'Silver',
    },
  })

  console.log('✅ Users created (including admin users)')

  // Importiere erweiterte Produktdaten
  const { generateProducts } = await import('./product-data')
  const { getProductImage } = await import('./image-helper')
  const sellerIds = [seller1.id, seller2.id, seller3.id, seller4.id]
  
  // Generiere alle Produkte (200-300+)
  const generatedProducts = generateProducts(sellerIds)

  // Erstelle die ursprünglichen 8 Produkte (für Kompatibilität)
  const originalProducts = [
    {
      id: '1',
      name: 'Fortnite V-Bucks 1000',
      description: 'Get 1000 V-Bucks to purchase Battle Pass, skins, and more in Fortnite!',
      price: 7.99,
      originalPrice: 9.99,
      discount: 20,
      image: getProductImage('in-game-currency', 'Epic Games', 'Fortnite V-Bucks 1000'),
      category: 'in-game-currency',
      platform: 'Epic Games',
      rating: 4.7,
      reviewCount: 892,
      inStock: true,
      tags: ['fortnite', 'v-bucks', 'popular'],
      sellerId: seller1.id,
    },
    {
      id: '2',
      name: 'Call of Duty: Modern Warfare III',
      description: 'The latest installment in the Call of Duty franchise. Epic battles await!',
      price: 49.99,
      originalPrice: 69.99,
      discount: 29,
      image: getProductImage('games', 'Steam', 'Call of Duty: Modern Warfare III'),
      category: 'games',
      platform: 'Steam',
      rating: 4.6,
      reviewCount: 2156,
      inStock: true,
      tags: ['fps', 'action', 'multiplayer'],
      sellerId: seller2.id,
    },
    {
      id: '3',
      name: 'PlayStation Store Gift Card €50',
      description: 'Redeemable on PlayStation Store for games, DLC, and subscriptions.',
      price: 44.99,
      originalPrice: 50.00,
      discount: 10,
      image: getProductImage('gift-cards', 'PlayStation', 'PlayStation Store Gift Card €50'),
      category: 'gift-cards',
      platform: 'PlayStation',
      rating: 4.8,
      reviewCount: 5678,
      inStock: true,
      tags: ['gift-card', 'playstation', 'instant'],
      sellerId: seller3.id,
    },
    {
      id: '4',
      name: 'Xbox Game Pass Ultimate 3 Months',
      description: 'Access hundreds of games with Xbox Game Pass Ultimate subscription.',
      price: 24.99,
      originalPrice: 44.97,
      discount: 44,
      image: getProductImage('subscriptions', 'Xbox', 'Xbox Game Pass Ultimate 3 Months'),
      category: 'subscriptions',
      platform: 'Xbox',
      rating: 4.5,
      reviewCount: 1234,
      inStock: true,
      tags: ['subscription', 'xbox', 'game-pass'],
      sellerId: seller4.id,
    },
    {
      id: '5',
      name: 'Baldur\'s Gate 3',
      description: 'Award-winning RPG adventure. Explore, battle, and shape your destiny.',
      price: 39.99,
      originalPrice: 59.99,
      discount: 33,
      image: getProductImage('games', 'Steam', 'Baldur\'s Gate 3'),
      category: 'games',
      platform: 'Steam',
      rating: 4.9,
      reviewCount: 3456,
      inStock: true,
      tags: ['rpg', 'fantasy', 'single-player'],
      sellerId: seller1.id,
    },
    {
      id: '6',
      name: 'Steam Wallet Code €20',
      description: 'Add funds to your Steam wallet instantly. No credit card needed!',
      price: 18.99,
      originalPrice: 20.00,
      discount: 5,
      image: getProductImage('gift-cards', 'Steam', 'Steam Wallet Code €20'),
      category: 'gift-cards',
      platform: 'Steam',
      rating: 4.7,
      reviewCount: 4567,
      inStock: true,
      tags: ['gift-card', 'steam', 'instant'],
      sellerId: seller3.id,
    },
    {
      id: '7',
      name: 'Cyberpunk 2077: Phantom Liberty DLC',
      description: 'Expansion pack for Cyberpunk 2077. New story, characters, and areas.',
      price: 19.99,
      originalPrice: 29.99,
      discount: 33,
      image: getProductImage('dlc', 'Steam', 'Cyberpunk 2077: Phantom Liberty DLC'),
      category: 'dlc',
      platform: 'Steam',
      rating: 4.6,
      reviewCount: 1890,
      inStock: true,
      tags: ['dlc', 'rpg', 'expansion'],
      sellerId: seller2.id,
    },
    {
      id: '8',
      name: 'FIFA 24 Ultimate Team Points 4600',
      description: 'Get FIFA Points to build your ultimate team and compete online.',
      price: 39.99,
      originalPrice: 49.99,
      discount: 20,
      image: getProductImage('in-game-currency', 'Origin', 'FIFA 24 Ultimate Team Points 4600'),
      category: 'in-game-currency',
      platform: 'Origin',
      rating: 4.4,
      reviewCount: 987,
      inStock: true,
      tags: ['fifa', 'sports', 'points'],
      sellerId: seller4.id,
    },
  ]

  // Kombiniere ursprüngliche und generierte Produkte
  const allProducts = [...originalProducts, ...generatedProducts]

  console.log(`📦 Creating ${allProducts.length} products...`)
  
  // Erstelle alle Produkte in Batches für bessere Performance
  const batchSize = 50
  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize)
    await Promise.all(
      batch.map(product =>
        prisma.product.upsert({
          where: { id: product.id },
          update: {},
          create: product,
        })
      )
    )
    console.log(`   Created ${Math.min(i + batchSize, allProducts.length)}/${allProducts.length} products...`)
  }

  console.log(`✅ ${allProducts.length} products created successfully!`)

  // Erstelle Test-Reviews für bessere Demo-Daten
  const reviews = [
    {
      id: 'review1',
      productId: '1',
      userId: user1.id,
      rating: 5,
      title: 'Perfect! Instant delivery',
      comment: 'Got my V-Bucks within seconds of purchase. Key worked perfectly and I was able to use it right away. Highly recommend this seller!',
      verifiedPurchase: true,
      helpful: 23,
    },
    {
      id: 'review2',
      productId: '1',
      userId: testUser.id,
      rating: 4,
      title: 'Great deal, fast delivery',
      comment: 'Good price compared to Epic Games store. Delivery was quick and the key worked without any issues. Will buy again!',
      verifiedPurchase: true,
      helpful: 15,
    },
    {
      id: 'review3',
      productId: '2',
      userId: user1.id,
      rating: 5,
      title: 'Amazing game, great price',
      comment: 'The game is fantastic and the price was much better than Steam. Key activated immediately and I was playing within minutes. Excellent service!',
      verifiedPurchase: true,
      helpful: 42,
    },
    {
      id: 'review4',
      productId: '2',
      userId: testUser.id,
      rating: 4,
      title: 'Solid purchase',
      comment: 'Game works great, multiplayer is fun. The discount made it worth buying here instead of directly from Steam.',
      verifiedPurchase: true,
      helpful: 8,
    },
    {
      id: 'review5',
      productId: '3',
      userId: user1.id,
      rating: 5,
      title: 'Instant delivery, perfect!',
      comment: 'Received the code immediately after payment. Redeemed it on PSN without any problems. Great seller!',
      verifiedPurchase: true,
      helpful: 31,
    },
    {
      id: 'review6',
      productId: '5',
      userId: testUser.id,
      rating: 5,
      title: 'Best RPG I\'ve ever played!',
      comment: 'Baldur\'s Gate 3 is absolutely incredible. The story, characters, and gameplay are all top-notch. Worth every penny!',
      verifiedPurchase: true,
      helpful: 67,
    },
    {
      id: 'review7',
      productId: '6',
      userId: user1.id,
      rating: 4,
      title: 'Quick and easy',
      comment: 'Steam wallet code worked perfectly. Added funds instantly and was able to purchase games right away.',
      verifiedPurchase: true,
      helpful: 12,
    },
  ]

  console.log(`💬 Creating ${reviews.length} reviews...`)
  
  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: {},
      create: review,
    })
  }

  console.log('✅ Reviews created')
  console.log('🎉 Seeding completed!')
  console.log('\n📋 Test Accounts:')
  console.log('   Admin: admin@simexmafia.de (oder test@example.com)')
  console.log('   User:  user@example.com')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


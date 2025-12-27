// Product data based on Eneba categories
// This file contains 200-300 products similar to what Eneba sells

import { getProductImage } from './image-helper'

export interface ProductSeedData {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  category: string
  platform: string
  rating: number
  reviewCount: number
  inStock: boolean
  tags: string[]
  sellerId: string
}

// Helper function to generate deterministic product ID based on name
// This ensures IDs remain consistent across restarts
function generateId(productName: string, category?: string, platform?: string): string {
  // Create a deterministic ID based on product name, category, and platform
  // This ensures the same product always gets the same ID
  const baseString = `${productName}-${category || ''}-${platform || ''}`
  
  // Simple hash function to convert string to number
  let hash = 0
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive number and ensure it's at least 9 (to avoid conflicts with existing IDs)
  const id = Math.abs(hash) + 9
  
  return String(id)
}

// Helper function to calculate discount
function calculateDiscount(price: number, originalPrice: number): number {
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

// Helper function to get random seller ID
function getRandomSeller(sellers: string[]): string {
  return sellers[Math.floor(Math.random() * sellers.length)]
}

// Helper function to get random rating (4.0 - 5.0)
function getRandomRating(): number {
  return Math.round((Math.random() * 1.0 + 4.0) * 10) / 10
}

// Helper function to get random review count
function getRandomReviewCount(): number {
  return Math.floor(Math.random() * 5000) + 50
}

export function generateProducts(sellerIds: string[]): ProductSeedData[] {
  const products: ProductSeedData[] = []

  // ===== FORTNITE V-BUCKS (In-Game Currency) =====
  // Official V-Bucks packages from Epic Games
  const vBucksPackages = [
    { amount: 1000, originalPrice: 8.99, price: 7.64 }, // ~15% discount
    { amount: 2800, originalPrice: 22.99, price: 19.54 }, // ~15% discount
    { amount: 5000, originalPrice: 39.99, price: 33.99 }, // ~15% discount
    { amount: 13500, originalPrice: 99.99, price: 84.99 }, // ~15% discount
  ]
  
  vBucksPackages.forEach(pkg => {
    const productName = `Fortnite V-Bucks ${pkg.amount.toLocaleString()}`
    const productId = generateId(productName, 'in-game-currency', 'Epic Games')
    products.push({
      id: productId,
      name: productName,
      description: `Get ${pkg.amount.toLocaleString()} V-Bucks to purchase Battle Pass, skins, emotes, and more in Fortnite! Official Epic Games package. Instant delivery.`,
      price: pkg.price,
      originalPrice: pkg.originalPrice,
      discount: calculateDiscount(pkg.price, pkg.originalPrice),
      image: getProductImage('in-game-currency', 'Epic Games', `Fortnite V-Bucks ${pkg.amount}`, productId),
      category: 'in-game-currency',
      platform: 'Epic Games',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['fortnite', 'v-bucks', 'popular', 'instant', 'official'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== STEAM GAMES =====
  const steamGames = [
    { name: 'Counter-Strike 2', price: 0, originalPrice: 0, tags: ['fps', 'competitive', 'multiplayer'] },
    { name: 'Grand Theft Auto V', price: 14.99, originalPrice: 29.99, tags: ['open-world', 'action', 'popular'] },
    { name: 'Red Dead Redemption 2', price: 19.99, originalPrice: 59.99, tags: ['open-world', 'western', 'story'] },
    { name: 'The Witcher 3: Wild Hunt', price: 9.99, originalPrice: 39.99, tags: ['rpg', 'fantasy', 'open-world'] },
    { name: 'Elden Ring', price: 39.99, originalPrice: 59.99, tags: ['rpg', 'souls-like', 'difficult'] },
    { name: 'Cyberpunk 2077', price: 29.99, originalPrice: 59.99, tags: ['rpg', 'sci-fi', 'open-world'] },
    { name: 'Hogwarts Legacy', price: 34.99, originalPrice: 59.99, tags: ['rpg', 'harry-potter', 'magic'] },
    { name: 'Starfield', price: 49.99, originalPrice: 69.99, tags: ['rpg', 'sci-fi', 'space'] },
    { name: 'Resident Evil 4 Remake', price: 39.99, originalPrice: 59.99, tags: ['horror', 'survival', 'action'] },
    { name: 'Dead Space Remake', price: 34.99, originalPrice: 69.99, tags: ['horror', 'sci-fi', 'survival'] },
    { name: 'Call of Duty: Black Ops Cold War', price: 24.99, originalPrice: 59.99, tags: ['fps', 'multiplayer', 'zombies'] },
    { name: 'Battlefield 2042', price: 19.99, originalPrice: 59.99, tags: ['fps', 'multiplayer', 'war'] },
    { name: 'Apex Legends - Starter Pack', price: 4.99, originalPrice: 9.99, tags: ['battle-royale', 'fps', 'free-to-play'] },
    { name: 'Rocket League', price: 0, originalPrice: 19.99, tags: ['sports', 'racing', 'multiplayer'] },
    { name: 'Terraria', price: 4.99, originalPrice: 9.99, tags: ['sandbox', 'adventure', '2d'] },
    { name: 'Stardew Valley', price: 7.99, originalPrice: 14.99, tags: ['farming', 'simulation', 'indie'] },
    { name: 'Among Us', price: 2.99, originalPrice: 4.99, tags: ['party', 'social', 'multiplayer'] },
    { name: 'Fall Guys', price: 0, originalPrice: 19.99, tags: ['party', 'battle-royale', 'fun'] },
    { name: 'It Takes Two', price: 19.99, originalPrice: 39.99, tags: ['co-op', 'puzzle', 'adventure'] },
  ]

  steamGames.forEach(game => {
    if (game.price === 0) return // Skip free games
    const productId = generateId(game.name, 'games', 'Steam')
    products.push({
      id: productId,
      name: game.name,
      description: `${game.name} - Steam Key. Instant delivery. Activate and play immediately!`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: game.originalPrice ? calculateDiscount(game.price, game.originalPrice) : undefined,
      image: getProductImage('games', 'Steam', game.name, productId),
      category: 'games',
      platform: 'Steam',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['steam', 'instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== STEAM GIFT CARDS =====
  const steamAmounts = [5, 10, 20, 25, 50, 100]
  steamAmounts.forEach(amount => {
    const originalPrice = amount
    const price = amount * 0.95 // 5% discount
    const productName = `Steam Wallet Code €${amount}`
    const productId = generateId(productName, 'gift-cards', 'Steam')
    products.push({
      id: productId,
      name: productName,
      description: `Add €${amount} to your Steam wallet instantly. No credit card needed! Instant delivery.`,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice,
      discount: calculateDiscount(price, originalPrice),
      image: getProductImage('gift-cards', 'Steam', `Steam Wallet Code €${amount}`, productId),
      category: 'gift-cards',
      platform: 'Steam',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['gift-card', 'steam', 'instant', 'wallet'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== PLAYSTATION GAMES =====
  const psGames = [
    { name: 'God of War Ragnarök', price: 39.99, originalPrice: 69.99, tags: ['action', 'adventure', 'exclusive'] },
    { name: 'Spider-Man 2', price: 49.99, originalPrice: 79.99, tags: ['action', 'superhero', 'exclusive'] },
    { name: 'The Last of Us Part I', price: 34.99, originalPrice: 69.99, tags: ['action', 'story', 'zombie'] },
    { name: 'Horizon Forbidden West', price: 29.99, originalPrice: 69.99, tags: ['action', 'rpg', 'open-world'] },
    { name: 'Gran Turismo 7', price: 39.99, originalPrice: 69.99, tags: ['racing', 'simulation', 'sports'] },
    { name: 'Ratchet & Clank: Rift Apart', price: 29.99, originalPrice: 69.99, tags: ['action', 'platformer', 'exclusive'] },
    { name: 'Final Fantasy XVI', price: 44.99, originalPrice: 79.99, tags: ['rpg', 'fantasy', 'action'] },
    { name: 'Demon\'s Souls', price: 34.99, originalPrice: 69.99, tags: ['rpg', 'souls-like', 'difficult'] },
  ]

  psGames.forEach(game => {
    const productId = generateId(game.name, 'games', 'PlayStation')
    products.push({
      id: productId,
      name: game.name,
      description: `${game.name} - PlayStation Store Key. Instant delivery for PS4/PS5.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'PlayStation', game.name, productId),
      category: 'games',
      platform: 'PlayStation',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['playstation', 'instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== PLAYSTATION GIFT CARDS =====
  const psAmounts = [10, 20, 25, 50, 75, 100]
  psAmounts.forEach(amount => {
    const originalPrice = amount
    const price = amount * 0.92 // 8% discount
    const productName = `PlayStation Store Gift Card €${amount}`
    const productId = generateId(productName, 'gift-cards', 'PlayStation')
    products.push({
      id: productId,
      name: productName,
      description: `Redeemable on PlayStation Store for games, DLC, and subscriptions. Instant delivery.`,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice,
      discount: calculateDiscount(price, originalPrice),
      image: getProductImage('gift-cards', 'PlayStation', `PlayStation Store Gift Card €${amount}`, productId),
      category: 'gift-cards',
      platform: 'PlayStation',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['gift-card', 'playstation', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== XBOX GAMES =====
  const xboxGames = [
    { name: 'Halo Infinite', price: 19.99, originalPrice: 59.99, tags: ['fps', 'sci-fi', 'multiplayer'] },
    { name: 'Forza Horizon 5', price: 29.99, originalPrice: 59.99, tags: ['racing', 'open-world', 'simulation'] },
    { name: 'Starfield', price: 49.99, originalPrice: 69.99, tags: ['rpg', 'sci-fi', 'space'] },
    { name: 'Gears 5', price: 14.99, originalPrice: 59.99, tags: ['shooter', 'action', 'multiplayer'] },
    { name: 'Sea of Thieves', price: 19.99, originalPrice: 39.99, tags: ['adventure', 'multiplayer', 'pirate'] },
  ]

  xboxGames.forEach(game => {
    const productId = generateId(game.name, 'games', 'Xbox')
    products.push({
      id: productId,
      name: game.name,
      description: `${game.name} - Xbox Store Key. Works on Xbox One, Series X/S, and PC. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Xbox', game.name, productId),
      category: 'games',
      platform: 'Xbox',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['xbox', 'instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== XBOX GIFT CARDS =====
  const xboxAmounts = [10, 25, 50, 75, 100]
  xboxAmounts.forEach(amount => {
    const originalPrice = amount
    const price = amount * 0.93 // 7% discount
    const productName = `Xbox Gift Card €${amount}`
    const productId = generateId(productName, 'gift-cards', 'Xbox')
    products.push({
      id: productId,
      name: productName,
      description: `Redeemable on Xbox Store for games, DLC, and subscriptions. Instant delivery.`,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice,
      discount: calculateDiscount(price, originalPrice),
      image: getProductImage('gift-cards', 'Xbox', `Xbox Gift Card €${amount}`, productId),
      category: 'gift-cards',
      platform: 'Xbox',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['gift-card', 'xbox', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== XBOX GAME PASS =====
  const gamePassOptions = [
    { name: 'Xbox Game Pass Ultimate 1 Month', price: 9.99, originalPrice: 12.99, duration: '1 month' },
    { name: 'Xbox Game Pass Ultimate 3 Months', price: 24.99, originalPrice: 38.97, duration: '3 months' },
    { name: 'Xbox Game Pass PC 1 Month', price: 7.99, originalPrice: 9.99, duration: '1 month' },
    { name: 'Xbox Game Pass PC 3 Months', price: 19.99, originalPrice: 29.97, duration: '3 months' },
  ]

  gamePassOptions.forEach(option => {
    const productId = generateId(option.name, 'subscriptions', 'Xbox')
    products.push({
      id: productId,
      name: option.name,
      description: `Access hundreds of games with Xbox Game Pass. ${option.duration} subscription. Instant delivery.`,
      price: option.price,
      originalPrice: option.originalPrice,
      discount: calculateDiscount(option.price, option.originalPrice),
      image: getProductImage('subscriptions', 'Xbox', option.name, productId),
      category: 'subscriptions',
      platform: 'Xbox',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['subscription', 'xbox', 'game-pass', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== PLAYSTATION PLUS =====
  const psPlusOptions = [
    { name: 'PlayStation Plus Essential 1 Month', price: 7.99, originalPrice: 8.99, duration: '1 month' },
    { name: 'PlayStation Plus Essential 3 Months', price: 19.99, originalPrice: 24.99, duration: '3 months' },
    { name: 'PlayStation Plus Extra 1 Month', price: 12.99, originalPrice: 13.99, duration: '1 month' },
    { name: 'PlayStation Plus Extra 12 Months', price: 99.99, originalPrice: 119.99, duration: '12 months' },
    { name: 'PlayStation Plus Premium 1 Month', price: 14.99, originalPrice: 16.99, duration: '1 month' },
  ]

  psPlusOptions.forEach(option => {
    const productId = generateId(option.name, 'subscriptions', 'PlayStation')
    products.push({
      id: productId,
      name: option.name,
      description: `PlayStation Plus subscription. ${option.duration} access to online multiplayer, free games, and more. Instant delivery.`,
      price: option.price,
      originalPrice: option.originalPrice,
      discount: calculateDiscount(option.price, option.originalPrice),
      image: getProductImage('subscriptions', 'PlayStation', option.name, productId),
      category: 'subscriptions',
      platform: 'PlayStation',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['subscription', 'playstation', 'ps-plus', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== FIFA POINTS =====
  const fifaPoints = [
    { amount: 500, price: 4.99, originalPrice: 4.99, name: 'FIFA 24 Ultimate Team Points 500' },
    { amount: 1050, price: 9.99, originalPrice: 9.99, name: 'FIFA 24 Ultimate Team Points 1.050' },
    { amount: 2200, price: 19.99, originalPrice: 19.99, name: 'FIFA 24 Ultimate Team Points 2.200' },
    { amount: 4600, price: 39.99, originalPrice: 49.99, name: 'FIFA 24 Ultimate Team Points 4.600' },
    { amount: 12000, price: 99.99, originalPrice: 99.99, name: 'FIFA 24 Ultimate Team Points 12.000' },
  ]

  fifaPoints.forEach(item => {
    // Verwende den exakten Namen, damit getCompleteProductImage das Bild findet
    const productName = item.name
    const productId = generateId(productName, 'in-game-currency', 'EA')
    products.push({
      id: productId,
      name: productName,
      description: `Get ${item.amount.toLocaleString()} FIFA Points to build your ultimate team and compete online. Instant delivery.`,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.originalPrice > item.price ? calculateDiscount(item.price, item.originalPrice) : undefined,
      image: getProductImage('in-game-currency', 'Origin', productName, productId),
      category: 'in-game-currency',
      platform: 'Origin',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['fifa', 'sports', 'points', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== NINTENDO ESHOP GIFT CARDS =====
  const nintendoAmounts = [10, 20, 35, 50]
  nintendoAmounts.forEach(amount => {
    const originalPrice = amount
    const price = amount * 0.94 // 6% discount
    const productName = `Nintendo eShop Gift Card €${amount}`
    const productId = generateId(productName, 'gift-cards', 'Nintendo')
    products.push({
      id: productId,
      name: productName,
      description: `Redeemable on Nintendo eShop for games, DLC, and subscriptions. Works on Switch, 3DS, and Wii U. Instant delivery.`,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice,
      discount: calculateDiscount(price, originalPrice),
      image: getProductImage('gift-cards', 'Nintendo', `Nintendo eShop Gift Card €${amount}`, productId),
      category: 'gift-cards',
      platform: 'Nintendo',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['gift-card', 'nintendo', 'eshop', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== NINTENDO GAMES =====
  const nintendoGames = [
    { name: 'The Legend of Zelda: Tears of the Kingdom', price: 54.99, originalPrice: 69.99, tags: ['adventure', 'action', 'exclusive'] },
    { name: 'Super Mario Bros. Wonder', price: 49.99, originalPrice: 59.99, tags: ['platformer', 'mario', 'exclusive'] },
    { name: 'Pokémon Scarlet', price: 44.99, originalPrice: 59.99, tags: ['rpg', 'pokemon', 'exclusive'] },
    { name: 'Animal Crossing: New Horizons', price: 39.99, originalPrice: 59.99, tags: ['simulation', 'life', 'exclusive'] },
  ]

  nintendoGames.forEach(game => {
    products.push({
      id: generateId(game.name, 'games', 'Nintendo'),
      name: game.name,
      description: `${game.name} - Nintendo Switch Key. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Nintendo', game.name),
      category: 'games',
      platform: 'Nintendo',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['nintendo', 'switch', 'instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== DLCs =====
  const dlcs = [
    { name: 'Cyberpunk 2077: Phantom Liberty', game: 'Cyberpunk 2077', price: 19.99, originalPrice: 29.99, platform: 'Steam' },
    { name: 'Elden Ring: Shadow of the Erdtree', game: 'Elden Ring', price: 29.99, originalPrice: 39.99, platform: 'Steam' },
    { name: 'The Witcher 3: Blood and Wine', game: 'The Witcher 3', price: 9.99, originalPrice: 19.99, platform: 'Steam' },
    { name: 'The Witcher 3: Hearts of Stone', game: 'The Witcher 3', price: 4.99, originalPrice: 9.99, platform: 'Steam' },
    { name: 'Red Dead Redemption 2: Ultimate Edition Content', game: 'Red Dead Redemption 2', price: 14.99, originalPrice: 19.99, platform: 'Steam' },
    { name: 'Assassin\'s Creed Valhalla: Season Pass', game: 'Assassin\'s Creed Valhalla', price: 24.99, originalPrice: 39.99, platform: 'Steam' },
  ]

  dlcs.forEach(dlc => {
    products.push({
      id: generateId(dlc.name, 'dlc', dlc.platform),
      name: dlc.name,
      description: `${dlc.name} - Expansion pack for ${dlc.game}. Instant delivery.`,
      price: dlc.price,
      originalPrice: dlc.originalPrice,
      discount: calculateDiscount(dlc.price, dlc.originalPrice),
      image: getProductImage('dlc', dlc.platform, dlc.name),
      category: 'dlc',
      platform: dlc.platform,
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['dlc', 'expansion', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== AMAZON GIFT CARDS =====
  const amazonAmounts = [10, 25, 50, 100]
  amazonAmounts.forEach(amount => {
    const originalPrice = amount
    const price = amount * 0.96 // 4% discount
    products.push({
      id: generateId(`Amazon Gift Card €${amount}`, 'gift-cards', 'Amazon'),
      name: `Amazon Gift Card €${amount}`,
      description: `Redeemable on Amazon.de for millions of products. Instant delivery via email.`,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice,
      discount: calculateDiscount(price, originalPrice),
      image: getProductImage('gift-cards', 'Amazon', `Amazon Gift Card €${amount}`),
      category: 'gift-cards',
      platform: 'Amazon',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['gift-card', 'amazon', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== APPLE GIFT CARDS =====
  const appleAmounts = [10, 25, 50, 100]
  appleAmounts.forEach(amount => {
    const originalPrice = amount
    const price = amount * 0.95 // 5% discount
    products.push({
      id: generateId(`Apple Gift Card €${amount}`, 'gift-cards', 'Apple'),
      name: `Apple Gift Card €${amount}`,
      description: `Redeemable on App Store, iTunes, and Apple services. Instant delivery.`,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice,
      discount: calculateDiscount(price, originalPrice),
      image: getProductImage('gift-cards', 'Apple', `Apple Gift Card €${amount}`),
      category: 'gift-cards',
      platform: 'Apple',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['gift-card', 'apple', 'app-store', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== SPOTIFY SUBSCRIPTIONS =====
  const spotifyOptions = [
    { name: 'Spotify Premium 1 Month', price: 4.99, originalPrice: 9.99, duration: '1 month' },
    { name: 'Spotify Premium 3 Months', price: 12.99, originalPrice: 29.97, duration: '3 months' },
    { name: 'Spotify Premium Family 1 Month', price: 7.99, originalPrice: 14.99, duration: '1 month' },
  ]

  spotifyOptions.forEach(option => {
    products.push({
      id: generateId(option.name, 'subscriptions', 'Spotify'),
      name: option.name,
      description: `Spotify Premium subscription. ${option.duration} ad-free music streaming. Instant delivery.`,
      price: option.price,
      originalPrice: option.originalPrice,
      discount: calculateDiscount(option.price, option.originalPrice),
      image: getProductImage('subscriptions', 'Spotify', option.name),
      category: 'subscriptions',
      platform: 'Spotify',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['subscription', 'spotify', 'music', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== NETFLIX SUBSCRIPTIONS =====
  const netflixOptions = [
    { name: 'Netflix Standard 1 Month', price: 7.99, originalPrice: 12.99, duration: '1 month' },
    { name: 'Netflix Premium 1 Month', price: 12.99, originalPrice: 17.99, duration: '1 month' },
  ]

  netflixOptions.forEach(option => {
    products.push({
      id: generateId(option.name, 'subscriptions', 'Netflix'),
      name: option.name,
      description: `Netflix subscription. ${option.duration} unlimited streaming. Instant delivery.`,
      price: option.price,
      originalPrice: option.originalPrice,
      discount: calculateDiscount(option.price, option.originalPrice),
      image: getProductImage('subscriptions', 'Netflix', option.name),
      category: 'subscriptions',
      platform: 'Netflix',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['subscription', 'netflix', 'streaming', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE POPULAR GAMES (Various Platforms) =====
  const moreGames = [
    { name: 'Minecraft Java Edition', price: 19.99, originalPrice: 26.95, platform: 'Other', tags: ['sandbox', 'creative', 'popular'] },
    { name: 'Rust', price: 24.99, originalPrice: 39.99, platform: 'Steam', tags: ['survival', 'multiplayer', 'sandbox'] },
    { name: 'ARK: Survival Evolved', price: 9.99, originalPrice: 29.99, platform: 'Steam', tags: ['survival', 'dinosaur', 'multiplayer'] },
    { name: 'DayZ', price: 19.99, originalPrice: 44.99, platform: 'Steam', tags: ['survival', 'zombie', 'multiplayer'] },
    { name: 'Rust', price: 24.99, originalPrice: 39.99, platform: 'Steam', tags: ['survival', 'multiplayer'] },
    { name: 'Left 4 Dead 2', price: 4.99, originalPrice: 19.99, platform: 'Steam', tags: ['zombie', 'co-op', 'fps'] },
    { name: 'Payday 2', price: 4.99, originalPrice: 19.99, platform: 'Steam', tags: ['heist', 'co-op', 'fps'] },
    { name: 'Garry\'s Mod', price: 4.99, originalPrice: 9.99, platform: 'Steam', tags: ['sandbox', 'creative', 'modding'] },
    { name: 'Team Fortress 2', price: 0, originalPrice: 0, platform: 'Steam', tags: ['fps', 'free', 'multiplayer'] },
    { name: 'Dota 2', price: 0, originalPrice: 0, platform: 'Steam', tags: ['moba', 'free', 'competitive'] },
  ]

  moreGames.forEach(game => {
    if (game.price === 0) return // Skip free games
    products.push({
      id: generateId(game.name, 'games', game.platform),
      name: game.name,
      description: `${game.name} - ${game.platform} Key. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', game.platform, game.name),
      category: 'games',
      platform: game.platform,
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== ROCKSTAR GAMES =====
  const rockstarGames = [
    { name: 'Grand Theft Auto: San Andreas', price: 4.99, originalPrice: 14.99 },
    { name: 'Grand Theft Auto IV', price: 9.99, originalPrice: 19.99 },
    { name: 'Red Dead Redemption 2', price: 19.99, originalPrice: 59.99 },
    { name: 'Max Payne 3', price: 7.99, originalPrice: 19.99 },
  ]

  rockstarGames.forEach(game => {
    products.push({
      id: generateId(game.name, 'games', 'Steam'),
      name: game.name,
      description: `${game.name} - Steam Key. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Steam', game.name),
      category: 'games',
      platform: 'Steam',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['rockstar', 'action', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== EA GAMES =====
  const eaGames = [
    { name: 'The Sims 4', price: 0, originalPrice: 39.99 },
    { name: 'Battlefield 1', price: 4.99, originalPrice: 19.99 },
    { name: 'Battlefield V', price: 9.99, originalPrice: 29.99 },
    { name: 'Titanfall 2', price: 4.99, originalPrice: 19.99 },
    { name: 'Apex Legends - Starter Pack', price: 4.99, originalPrice: 9.99 },
  ]

  eaGames.forEach(game => {
    if (game.price === 0) return
    products.push({
      id: generateId(game.name, 'games', 'Origin'),
      name: game.name,
      description: `${game.name} - Origin/Steam Key. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Origin', game.name),
      category: 'games',
      platform: 'Origin',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['ea', 'action', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== BLIZZARD GAMES =====
  const blizzardGames = [
    { name: 'World of Warcraft: Dragonflight', price: 34.99, originalPrice: 49.99 },
    { name: 'Diablo IV', price: 39.99, originalPrice: 69.99 },
    { name: 'Overwatch 2 - Watchpoint Pack', price: 29.99, originalPrice: 39.99 },
  ]

  blizzardGames.forEach(game => {
    products.push({
      id: generateId(game.name, 'games', 'Battle.net'),
      name: game.name,
      description: `${game.name} - Battle.net Key. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Battle.net', game.name),
      category: 'games',
      platform: 'Battle.net',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['blizzard', 'rpg', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE IN-GAME CURRENCY =====
  const moreCurrency = [
    { name: 'Roblox Robux 400', amount: 400, price: 4.99, originalPrice: 4.99, platform: 'Roblox' },
    { name: 'Roblox Robux 800', amount: 800, price: 9.99, originalPrice: 9.99, platform: 'Roblox' },
    { name: 'Roblox Robux 2000', amount: 2000, price: 19.99, originalPrice: 24.99, platform: 'Roblox' },
    { name: 'GTA Online Shark Card Megalodon', amount: 8000000, price: 79.99, originalPrice: 99.99, platform: 'Rockstar' },
    { name: 'GTA Online Shark Card Whale', amount: 3500000, price: 39.99, originalPrice: 49.99, platform: 'Rockstar' },
  ]

  moreCurrency.forEach(item => {
    products.push({
      id: generateId(item.name, 'in-game-currency', item.platform),
      name: item.name,
      description: `Get ${item.amount.toLocaleString()} ${item.platform === 'Roblox' ? 'Robux' : 'GTA$'} for ${item.platform}. Instant delivery.`,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.originalPrice > item.price ? calculateDiscount(item.price, item.originalPrice) : undefined,
      image: getProductImage('in-game-currency', item.platform, item.name),
      category: 'in-game-currency',
      platform: item.platform,
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: [item.platform.toLowerCase(), 'currency', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE STEAM GAMES (Expanded List) =====
  const moreSteamGames = [
    { name: 'Half-Life: Alyx', price: 29.99, originalPrice: 59.99, tags: ['vr', 'fps', 'sci-fi'] },
    { name: 'Portal 2', price: 2.99, originalPrice: 9.99, tags: ['puzzle', 'co-op', 'classic'] },
    { name: 'Half-Life 2', price: 1.99, originalPrice: 9.99, tags: ['fps', 'classic', 'sci-fi'] },
    { name: 'The Elder Scrolls V: Skyrim', price: 9.99, originalPrice: 19.99, tags: ['rpg', 'open-world', 'fantasy'] },
    { name: 'Fallout 4', price: 7.99, originalPrice: 19.99, tags: ['rpg', 'post-apocalyptic', 'open-world'] },
    { name: 'Fallout: New Vegas', price: 4.99, originalPrice: 9.99, tags: ['rpg', 'post-apocalyptic', 'classic'] },
    { name: 'Borderlands 3', price: 14.99, originalPrice: 59.99, tags: ['fps', 'looter-shooter', 'co-op'] },
    { name: 'Borderlands 2', price: 4.99, originalPrice: 19.99, tags: ['fps', 'looter-shooter', 'co-op'] },
    { name: 'Doom Eternal', price: 19.99, originalPrice: 39.99, tags: ['fps', 'action', 'demons'] },
    { name: 'Doom (2016)', price: 9.99, originalPrice: 19.99, tags: ['fps', 'action', 'demons'] },
    { name: 'Resident Evil Village', price: 24.99, originalPrice: 49.99, tags: ['horror', 'survival', 'action'] },
    { name: 'Resident Evil 2 Remake', price: 19.99, originalPrice: 39.99, tags: ['horror', 'survival', 'zombie'] },
    { name: 'Resident Evil 7', price: 14.99, originalPrice: 29.99, tags: ['horror', 'survival', 'first-person'] },
    { name: 'Monster Hunter: World', price: 19.99, originalPrice: 39.99, tags: ['action', 'rpg', 'co-op'] },
    { name: 'Dark Souls III', price: 19.99, originalPrice: 59.99, tags: ['rpg', 'souls-like', 'difficult'] },
    { name: 'Sekiro: Shadows Die Twice', price: 29.99, originalPrice: 59.99, tags: ['action', 'souls-like', 'difficult'] },
    { name: 'Bloodborne', price: 19.99, originalPrice: 39.99, tags: ['action', 'souls-like', 'horror'] },
    { name: 'Nioh 2', price: 24.99, originalPrice: 49.99, tags: ['action', 'souls-like', 'samurai'] },
    { name: 'Hollow Knight', price: 7.99, originalPrice: 14.99, tags: ['metroidvania', 'indie', '2d'] },
    { name: 'Celeste', price: 4.99, originalPrice: 19.99, tags: ['platformer', 'indie', 'difficult'] },
    { name: 'Hades', price: 14.99, originalPrice: 24.99, tags: ['roguelike', 'indie', 'action'] },
    { name: 'Dead Cells', price: 12.99, originalPrice: 24.99, tags: ['roguelike', 'metroidvania', 'action'] },
    { name: 'Risk of Rain 2', price: 14.99, originalPrice: 24.99, tags: ['roguelike', 'co-op', 'action'] },
    { name: 'Deep Rock Galactic', price: 19.99, originalPrice: 29.99, tags: ['co-op', 'fps', 'mining'] },
    { name: 'Valheim', price: 14.99, originalPrice: 19.99, tags: ['survival', 'viking', 'multiplayer'] },
    { name: 'Subnautica', price: 19.99, originalPrice: 29.99, tags: ['survival', 'underwater', 'exploration'] },
    { name: 'The Forest', price: 9.99, originalPrice: 19.99, tags: ['survival', 'horror', 'multiplayer'] },
    { name: 'Sons of the Forest', price: 19.99, originalPrice: 29.99, tags: ['survival', 'horror', 'multiplayer'] },
    { name: 'Green Hell', price: 14.99, originalPrice: 24.99, tags: ['survival', 'jungle', 'realistic'] },
    { name: 'Project Zomboid', price: 12.99, originalPrice: 19.99, tags: ['survival', 'zombie', 'isometric'] },
  ]

  moreSteamGames.forEach(game => {
    products.push({
      id: generateId(game.name, 'games', 'Steam'),
      name: game.name,
      description: `${game.name} - Steam Key. Instant delivery. Activate and play immediately!`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Steam', game.name),
      category: 'games',
      platform: 'Steam',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['steam', 'instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE INDIE GAMES =====
  const indieGames = [
    { name: 'Stardew Valley', price: 7.99, originalPrice: 14.99, tags: ['farming', 'simulation', 'indie'] },
    { name: 'Terraria', price: 4.99, originalPrice: 9.99, tags: ['sandbox', 'adventure', '2d'] },
    { name: 'Cuphead', price: 12.99, originalPrice: 19.99, tags: ['platformer', 'difficult', 'retro'] },
    { name: 'Ori and the Blind Forest', price: 9.99, originalPrice: 19.99, tags: ['platformer', 'beautiful', 'indie'] },
    { name: 'Ori and the Will of the Wisps', price: 14.99, originalPrice: 29.99, tags: ['platformer', 'beautiful', 'indie'] },
    { name: 'Limbo', price: 2.99, originalPrice: 9.99, tags: ['puzzle', 'atmospheric', 'indie'] },
    { name: 'Inside', price: 4.99, originalPrice: 19.99, tags: ['puzzle', 'atmospheric', 'indie'] },
    { name: 'Little Nightmares', price: 7.99, originalPrice: 19.99, tags: ['horror', 'puzzle', 'indie'] },
    { name: 'Little Nightmares II', price: 14.99, originalPrice: 29.99, tags: ['horror', 'puzzle', 'indie'] },
    { name: 'Gris', price: 4.99, originalPrice: 16.99, tags: ['platformer', 'beautiful', 'emotional'] },
  ]

  indieGames.forEach(game => {
    products.push({
      id: generateId(game.name, 'games', 'Steam'),
      name: game.name,
      description: `${game.name} - Steam Key. Instant delivery.`,
      price: game.price,
      originalPrice: game.originalPrice,
      discount: calculateDiscount(game.price, game.originalPrice),
      image: getProductImage('games', 'Steam', game.name),
      category: 'games',
      platform: 'Steam',
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['steam', 'indie', 'instant', ...game.tags],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE GIFT CARDS (Various Platforms) =====
  const moreGiftCards = [
    { name: 'Google Play Gift Card', amounts: [10, 25, 50], platform: 'Google Play' },
    { name: 'Epic Games Store Gift Card', amounts: [10, 25, 50], platform: 'Epic Games' },
    { name: 'Battle.net Gift Card', amounts: [20, 50, 100], platform: 'Battle.net' },
    { name: 'Origin Gift Card', amounts: [25, 50], platform: 'Origin' },
    { name: 'Riot Points Gift Card', amounts: [10, 25, 50], platform: 'Riot Games' },
  ]

  moreGiftCards.forEach(card => {
    card.amounts.forEach(amount => {
      const originalPrice = amount
      const price = amount * 0.94 // 6% discount
      products.push({
        id: generateId(`${card.name} €${amount}`, 'gift-cards', card.platform),
        name: `${card.name} €${amount}`,
        description: `Redeemable on ${card.platform} for games, DLC, and in-game items. Instant delivery.`,
        price: Math.round(price * 100) / 100,
        originalPrice: originalPrice,
        discount: calculateDiscount(price, originalPrice),
        image: getProductImage('gift-cards', card.platform, `${card.name} €${amount}`),
        category: 'gift-cards',
        platform: card.platform,
        rating: getRandomRating(),
        reviewCount: getRandomReviewCount(),
        inStock: true,
        tags: ['gift-card', card.platform.toLowerCase().replace(' ', '-'), 'instant'],
        sellerId: getRandomSeller(sellerIds),
      })
    })
  })

  // ===== MORE SUBSCRIPTIONS =====
  const moreSubscriptions = [
    { name: 'Discord Nitro 1 Month', price: 7.99, originalPrice: 9.99, platform: 'Discord' },
    { name: 'Discord Nitro Classic 1 Month', price: 3.99, originalPrice: 4.99, platform: 'Discord' },
    { name: 'YouTube Premium 1 Month', price: 9.99, originalPrice: 11.99, platform: 'YouTube' },
    { name: 'Twitch Prime 1 Month', price: 0, originalPrice: 0, platform: 'Twitch' },
    { name: 'EA Play 1 Month', price: 2.99, originalPrice: 3.99, platform: 'EA' },
    { name: 'EA Play Pro 1 Month', price: 12.99, originalPrice: 14.99, platform: 'EA' },
    { name: 'Ubisoft+ 1 Month', price: 9.99, originalPrice: 14.99, platform: 'Ubisoft' },
  ]

  moreSubscriptions.forEach(sub => {
    if (sub.price === 0) return
    products.push({
      id: generateId(sub.name, 'subscriptions', sub.platform),
      name: sub.name,
      description: `${sub.name} subscription. Instant delivery.`,
      price: sub.price,
      originalPrice: sub.originalPrice,
      discount: calculateDiscount(sub.price, sub.originalPrice),
      image: getProductImage('subscriptions', sub.platform, sub.name),
      category: 'subscriptions',
      platform: sub.platform,
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['subscription', sub.platform.toLowerCase(), 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE DLCs =====
  const moreDlcs = [
    { name: 'The Elder Scrolls V: Skyrim - Dawnguard', game: 'Skyrim', price: 9.99, originalPrice: 19.99, platform: 'Steam' },
    { name: 'The Elder Scrolls V: Skyrim - Dragonborn', game: 'Skyrim', price: 9.99, originalPrice: 19.99, platform: 'Steam' },
    { name: 'Fallout 4: Far Harbor', game: 'Fallout 4', price: 9.99, originalPrice: 24.99, platform: 'Steam' },
    { name: 'Fallout 4: Nuka-World', game: 'Fallout 4', price: 7.99, originalPrice: 19.99, platform: 'Steam' },
    { name: 'Borderlands 3: Season Pass', game: 'Borderlands 3', price: 24.99, originalPrice: 49.99, platform: 'Steam' },
    { name: 'Resident Evil Village: Winters\' Expansion', game: 'Resident Evil Village', price: 14.99, originalPrice: 19.99, platform: 'Steam' },
    { name: 'Monster Hunter: World - Iceborne', game: 'Monster Hunter: World', price: 19.99, originalPrice: 39.99, platform: 'Steam' },
    { name: 'Dark Souls III: The Ringed City', game: 'Dark Souls III', price: 9.99, originalPrice: 14.99, platform: 'Steam' },
    { name: 'Dark Souls III: Ashes of Ariandel', game: 'Dark Souls III', price: 7.99, originalPrice: 14.99, platform: 'Steam' },
  ]

  moreDlcs.forEach(dlc => {
    products.push({
      id: generateId(dlc.name, 'dlc', dlc.platform),
      name: dlc.name,
      description: `${dlc.name} - Expansion for ${dlc.game}. Instant delivery.`,
      price: dlc.price,
      originalPrice: dlc.originalPrice,
      discount: calculateDiscount(dlc.price, dlc.originalPrice),
      image: getProductImage('dlc', dlc.platform, dlc.name),
      category: 'dlc',
      platform: dlc.platform,
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: ['dlc', 'expansion', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== MORE IN-GAME CURRENCY =====
  const evenMoreCurrency = [
    { name: 'Apex Legends Coins 1000', amount: 1000, price: 9.99, originalPrice: 9.99, platform: 'EA' },
    { name: 'Apex Legends Coins 2000', amount: 2000, price: 19.99, originalPrice: 19.99, platform: 'EA' },
    { name: 'Valorant Points 1000', amount: 1000, price: 9.99, originalPrice: 9.99, platform: 'Riot Games' },
    { name: 'Valorant Points 2050', amount: 2050, price: 19.99, originalPrice: 19.99, platform: 'Riot Games' },
    { name: 'League of Legends RP 650', amount: 650, price: 4.99, originalPrice: 4.99, platform: 'Riot Games' },
    { name: 'League of Legends RP 1380', amount: 1380, price: 9.99, originalPrice: 9.99, platform: 'Riot Games' },
    { name: 'World of Warcraft Game Time 30 Days', amount: 30, price: 9.99, originalPrice: 12.99, platform: 'Battle.net' },
    { name: 'World of Warcraft Game Time 60 Days', amount: 60, price: 19.99, originalPrice: 25.99, platform: 'Battle.net' },
  ]

  evenMoreCurrency.forEach(item => {
    products.push({
      id: generateId(item.name, item.platform === 'Battle.net' ? 'subscriptions' : 'in-game-currency', item.platform),
      name: item.name,
      description: `Get ${item.amount.toLocaleString()} ${item.platform === 'Battle.net' ? 'days' : 'points'} for ${item.platform}. Instant delivery.`,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.originalPrice > item.price ? calculateDiscount(item.price, item.originalPrice) : undefined,
      image: getProductImage(item.platform === 'Battle.net' ? 'subscriptions' : 'in-game-currency', item.platform, item.name),
      category: item.platform === 'Battle.net' ? 'subscriptions' : 'in-game-currency',
      platform: item.platform,
      rating: getRandomRating(),
      reviewCount: getRandomReviewCount(),
      inStock: true,
      tags: [item.platform.toLowerCase().replace(' ', '-'), 'currency', 'instant'],
      sellerId: getRandomSeller(sellerIds),
    })
  })

  // ===== SIMEX GEHEIMER DISCORD-SERVER (SPECIAL PRODUCT) =====
  products.push({
    id: generateId('Simex Geheimer Discord-Server', 'subscriptions', 'Discord'),
    name: 'Simex Geheimer Discord-Server',
    description: 'Exklusiver Zugang zum geheimen Simex Discord-Server mit vielen exklusiven Inhalten, Leaks, Methoden und Insider-Informationen bezüglich der Website und verschiedenen Strategien. Dieser Server enthält sehr vertrauliche Informationen und ist nur für ausgewählte Mitglieder verfügbar. Enthält: Exklusive Methoden, Website-Insights, Early Access zu neuen Features, VIP-Support, und vieles mehr. WICHTIG: Dieser Server enthält vertrauliche Informationen - Zugang nur nach Kauf.',
    price: 299.99,
    originalPrice: 499.99,
    discount: calculateDiscount(299.99, 499.99),
    image: getProductImage('subscriptions', 'Discord', 'Simex Geheimer Discord-Server'),
    category: 'subscriptions',
    platform: 'Discord',
    rating: 5.0,
    reviewCount: 47,
    inStock: true,
    tags: ['exclusive', 'discord', 'vip', 'leaks', 'methods', 'simex', 'premium'],
    sellerId: sellerIds[0], // Use first seller for this special product
  })

  return products
}


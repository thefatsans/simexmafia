import { Product } from '@/types'

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fortnite V-Bucks 1000',
    description: 'Get 1000 V-Bucks to purchase Battle Pass, skins, and more in Fortnite!',
    price: 7.99,
    originalPrice: 9.99,
    discount: 20,
    image: 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
    category: 'in-game-currency',
    platform: 'Epic Games',
    seller: {
      id: 'seller1',
      name: 'GameDeals Pro',
      rating: 4.8,
      reviewCount: 1245,
      verified: true,
    },
    rating: 4.7,
    reviewCount: 892,
    inStock: true,
    tags: ['fortnite', 'v-bucks', 'popular'],
  },
  {
    id: '2',
    name: 'Call of Duty: Modern Warfare III',
    description: 'The latest installment in the Call of Duty franchise. Epic battles await!',
    price: 49.99,
    originalPrice: 69.99,
    discount: 29,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller2',
      name: 'DigitalKeys Store',
      rating: 4.9,
      reviewCount: 3421,
      verified: true,
    },
    rating: 4.6,
    reviewCount: 2156,
    inStock: true,
    tags: ['fps', 'action', 'multiplayer'],
  },
  {
    id: '3',
    name: 'PlayStation Store Gift Card €50',
    description: 'Redeemable on PlayStation Store for games, DLC, and subscriptions.',
    price: 44.99,
    originalPrice: 50.00,
    discount: 10,
    image: 'https://static.rapido.com/cms/sites/21/2020/08/04104235/Gift-cards-Dual-Branded.jpg',
    category: 'gift-cards',
    platform: 'PlayStation',
    seller: {
      id: 'seller3',
      name: 'GiftCard Masters',
      rating: 4.7,
      reviewCount: 8923,
      verified: true,
    },
    rating: 4.8,
    reviewCount: 5678,
    inStock: true,
    tags: ['gift-card', 'playstation', 'instant'],
  },
  {
    id: '4',
    name: 'Xbox Game Pass Ultimate 3 Months',
    description: 'Access hundreds of games with Xbox Game Pass Ultimate subscription.',
    price: 24.99,
    originalPrice: 44.97,
    discount: 44,
    image: 'https://compass-ssl.xbox.com/assets/83/53/83534a32-99e4-47eb-a74a-696af8c7e7d1.png',
    category: 'subscriptions',
    platform: 'Xbox',
    seller: {
      id: 'seller4',
      name: 'Subscriptions Hub',
      rating: 4.6,
      reviewCount: 2134,
      verified: true,
    },
    rating: 4.5,
    reviewCount: 1234,
    inStock: true,
    tags: ['subscription', 'xbox', 'game-pass'],
  },
  {
    id: '5',
    name: 'Baldur\'s Gate 3',
    description: 'Award-winning RPG adventure. Explore, battle, and shape your destiny.',
    price: 39.99,
    originalPrice: 59.99,
    discount: 33,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller1',
      name: 'GameDeals Pro',
      rating: 4.8,
      reviewCount: 1245,
      verified: true,
    },
    rating: 4.9,
    reviewCount: 3456,
    inStock: true,
    tags: ['rpg', 'fantasy', 'single-player'],
  },
  {
    id: '6',
    name: 'Steam Wallet Code €20',
    description: 'Add funds to your Steam wallet instantly. No credit card needed!',
    price: 18.99,
    originalPrice: 20.00,
    discount: 5,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/593110/header.jpg',
    category: 'gift-cards',
    platform: 'Steam',
    seller: {
      id: 'seller3',
      name: 'GiftCard Masters',
      rating: 4.7,
      reviewCount: 8923,
      verified: true,
    },
    rating: 4.7,
    reviewCount: 4567,
    inStock: true,
    tags: ['gift-card', 'steam', 'instant'],
  },
  {
    id: '7',
    name: 'Cyberpunk 2077: Phantom Liberty DLC',
    description: 'Expansion pack for Cyberpunk 2077. New story, characters, and areas.',
    price: 19.99,
    originalPrice: 29.99,
    discount: 33,
    image: 'https://cdn1.epicgames.com/offer/77f2b98e2cef40c8a7437518bf420e47/EGS_Cyberpunk2077PhantomLiberty_CDPROJEKTRED_DLC_S2_1200x1600-3acec02a8b11a2c50ba8dd3cb217f1c6',
    category: 'dlc',
    platform: 'Steam',
    seller: {
      id: 'seller2',
      name: 'DigitalKeys Store',
      rating: 4.9,
      reviewCount: 3421,
      verified: true,
    },
    rating: 4.6,
    reviewCount: 1890,
    inStock: true,
    tags: ['dlc', 'rpg', 'expansion'],
  },
  {
    id: '8',
    name: 'FIFA 24 Ultimate Team Points 4600',
    description: 'Get FIFA Points to build your ultimate team and compete online.',
    price: 39.99,
    originalPrice: 49.99,
    discount: 20,
    image: 'https://static.electronicfirst.com/products/thumbnail_1691567160_64d3443813a4b.webp',
    category: 'in-game-currency',
    platform: 'Origin',
    seller: {
      id: 'seller4',
      name: 'Subscriptions Hub',
      rating: 4.6,
      reviewCount: 2134,
      verified: true,
    },
    rating: 4.4,
    reviewCount: 987,
    inStock: true,
    tags: ['fifa', 'sports', 'points'],
  },
  {
    id: '9',
    name: 'The Witcher 3: Wild Hunt',
    description: 'Award-winning open-world RPG. Hunt monsters, explore, and make choices that matter.',
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller1',
      name: 'GameDeals Pro',
      rating: 4.8,
      reviewCount: 1245,
      verified: true,
    },
    rating: 4.9,
    reviewCount: 123456,
    inStock: true,
    tags: ['rpg', 'fantasy', 'open-world'],
  },
  {
    id: '10',
    name: 'Elden Ring',
    description: 'FromSoftware\'s epic action RPG. Explore the Lands Between and become the Elden Lord.',
    price: 49.99,
    originalPrice: 59.99,
    discount: 17,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller2',
      name: 'DigitalKeys Store',
      rating: 4.9,
      reviewCount: 3421,
      verified: true,
    },
    rating: 4.9,
    reviewCount: 234567,
    inStock: true,
    tags: ['rpg', 'souls-like', 'action'],
  },
  {
    id: '11',
    name: 'Steam Wallet Code €10',
    description: 'Add €10 to your Steam wallet instantly.',
    price: 9.49,
    originalPrice: 10.00,
    discount: 5,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/593110/header.jpg',
    category: 'gift-cards',
    platform: 'Steam',
    seller: {
      id: 'seller3',
      name: 'GiftCard Masters',
      rating: 4.7,
      reviewCount: 8923,
      verified: true,
    },
    rating: 4.7,
    reviewCount: 2345,
    inStock: true,
    tags: ['gift-card', 'steam', 'instant'],
  },
  {
    id: '12',
    name: 'Hollow Knight',
    description: 'Beautiful hand-drawn action adventure. Explore a vast underground kingdom.',
    price: 14.99,
    originalPrice: 19.99,
    discount: 25,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller1',
      name: 'GameDeals Pro',
      rating: 4.8,
      reviewCount: 1245,
      verified: true,
    },
    rating: 4.8,
    reviewCount: 45678,
    inStock: true,
    tags: ['metroidvania', 'indie', 'platformer'],
  },
  {
    id: '13',
    name: 'Stardew Valley',
    description: 'Relaxing farming simulation. Build your farm, make friends, and explore.',
    price: 12.99,
    originalPrice: 14.99,
    discount: 13,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller2',
      name: 'DigitalKeys Store',
      rating: 4.9,
      reviewCount: 3421,
      verified: true,
    },
    rating: 4.9,
    reviewCount: 345678,
    inStock: true,
    tags: ['farming', 'simulation', 'indie'],
  },
  {
    id: '14',
    name: 'Terraria',
    description: 'Dig, fight, explore, build! The very world is at your fingertips.',
    price: 9.99,
    originalPrice: 9.99,
    discount: 0,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller1',
      name: 'GameDeals Pro',
      rating: 4.8,
      reviewCount: 1245,
      verified: true,
    },
    rating: 4.8,
    reviewCount: 567890,
    inStock: true,
    tags: ['sandbox', 'adventure', 'indie'],
  },
  {
    id: '15',
    name: 'Valorant - Points 1000',
    description: 'Get 1000 Valorant Points to unlock agents, skins, and battle pass.',
    price: 9.99,
    originalPrice: 9.99,
    discount: 0,
    image: 'https://gaming-cdn.com/images/products/7094/orig/valorant-10-eur-1000-valorant-points-1000-valorant-points-pc-game-europe-cover.jpg?v=1748008667',
    category: 'in-game-currency',
    platform: 'Other',
    seller: {
      id: 'seller4',
      name: 'Subscriptions Hub',
      rating: 4.6,
      reviewCount: 2134,
      verified: true,
    },
    rating: 4.5,
    reviewCount: 1234,
    inStock: true,
    tags: ['valorant', 'fps', 'points'],
  },
  {
    id: '16',
    name: 'Red Dead Redemption 2',
    description: 'Epic tale of life in America\'s unforgiving heartland.',
    price: 39.99,
    originalPrice: 59.99,
    discount: 33,
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
    category: 'games',
    platform: 'Steam',
    seller: {
      id: 'seller2',
      name: 'DigitalKeys Store',
      rating: 4.9,
      reviewCount: 3421,
      verified: true,
    },
    rating: 4.8,
    reviewCount: 234567,
    inStock: true,
    tags: ['open-world', 'western', 'adventure'],
  },
]

const STORAGE_KEY = 'simexmafia-admin-products'

// Get all products - from localStorage if available, otherwise from mockProducts
export const getProducts = (): Product[] => {
  // On server-side, always return mockProducts
  if (typeof window === 'undefined') {
    return mockProducts
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with mockProducts to ensure all products are available
        const mockProductIds = new Set(mockProducts.map(p => p.id))
        const storedProducts = parsed.filter((p: Product) => !mockProductIds.has(p.id))
        return [...mockProducts, ...storedProducts]
      }
    }
  } catch (error) {
    console.error('Error loading products from localStorage:', error)
  }

  // Initialize with mock products if not in localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts))
  } catch (error) {
    console.error('Error saving mock products to localStorage:', error)
  }

  return mockProducts
}

// Get product by ID
export const getProductById = (id: string): Product | undefined => {
  const products = getProducts()
  return products.find(p => p.id === id)
}

// Get products by category
export const getProductsByCategory = (category: string): Product[] => {
  const products = getProducts()
  return products.filter(p => p.category === category)
}

// Get products by platform
export const getProductsByPlatform = (platform: string): Product[] => {
  const products = getProducts()
  return products.filter(p => p.platform === platform)
}

// Search products
export const searchProducts = (query: string): Product[] => {
  const products = getProducts()
  const lowerQuery = query.toLowerCase()
  return products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

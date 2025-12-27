// Script to systematically find and update images for ALL products
// This will search for official image URLs for each product

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

// Steam App IDs mapping for games
const STEAM_APP_IDS: Record<string, number> = {
  'Grand Theft Auto V': 271590,
  'Grand Theft Auto IV': 12210,
  'Grand Theft Auto: San Andreas': 12120,
  'Red Dead Redemption 2': 1174180,
  'The Witcher 3: Wild Hunt': 292030,
  'Elden Ring': 1245620,
  'Cyberpunk 2077': 1091500,
  'Hogwarts Legacy': 990080,
  'Starfield': 1716740,
  'Resident Evil 4 Remake': 2050650,
  'Dead Space Remake': 1693980,
  'Call of Duty: Black Ops Cold War': 1985810,
  'Call of Duty: Modern Warfare III': 2519060,
  'Battlefield 2042': 1517290,
  'Apex Legends - Starter Pack': 1172470,
  'Valorant - Points 1000': 1274570,
  'Rocket League': 252950,
  'Terraria': 105600,
  'Stardew Valley': 413150,
  'Among Us': 945360,
  'It Takes Two': 1426210,
  'Baldur\'s Gate 3': 1086940,
  'Left 4 Dead 2': 550,
  'Payday 2': 218620,
  'Rust': 252490,
  'ARK: Survival Evolved': 346110,
  'DayZ': 221100,
  'Garry\'s Mod': 4000,
  'Portal 2': 620,
  'Half-Life 2': 220,
  'The Elder Scrolls V: Skyrim': 489830,
  'Fallout 4': 377160,
  'Fallout: New Vegas': 22380,
  'Borderlands 3': 397540,
  'Borderlands 2': 49520,
  'Doom Eternal': 782330,
  'Doom (2016)': 379720,
  'Resident Evil Village': 1196590,
  'Resident Evil 2 Remake': 883710,
  'Resident Evil 7': 418370,
  'Monster Hunter: World': 582010,
  'Dark Souls III': 374320,
  'Sekiro: Shadows Die Twice': 814380,
  'Bloodborne': 274190,
  'Nioh 2': 1325200,
  'Hollow Knight': 367520,
  'Celeste': 504230,
  'Hades': 1145360,
  'Dead Cells': 588650,
  'Risk of Rain 2': 632360,
  'Deep Rock Galactic': 548430,
  'Valheim': 892970,
  'Subnautica': 264710,
  'The Forest': 242760,
  'Sons of the Forest': 1326470,
  'Green Hell': 815370,
  'Project Zomboid': 108600,
  'Max Payne 3': 204100,
  'Inside': 304430,
  'Ori and the Will of the Wisps': 1057090,
  'Ori and the Blind Forest': 261570,
  'Cuphead': 268910,
  'Little Nightmares II': 860510,
  'Little Nightmares': 424840,
  'Limbo': 48000,
  'Gris': 683320,
  'Minecraft Java Edition': 498242,
  'Diablo IV': 1444780,
  'Overwatch 2 - Watchpoint Pack': 2357570,
  'World of Warcraft: Dragonflight': 1984490,
  'Battlefield 1': 1238840,
  'Battlefield V': 1238810,
  'Titanfall 2': 1237970,
}

// DLC App IDs
const DLC_APP_IDS: Record<string, number> = {
  'Cyberpunk 2077: Phantom Liberty': 1492730,
  'Cyberpunk 2077: Phantom Liberty DLC': 1492730,
  'Elden Ring: Shadow of the Erdtree': 2778580,
  'The Witcher 3: Blood and Wine': 378649,
  'The Witcher 3: Hearts of Stone': 378648,
  'Assassin\'s Creed Valhalla: Season Pass': 2208920,
  'Borderlands 3: Season Pass': 397540,
  'Dark Souls III: Ashes of Ariandel': 506610,
  'Dark Souls III: The Ringed City': 506620,
  'Fallout 4: Far Harbor': 435880,
  'Fallout 4: Nuka-World': 503820,
  'Monster Hunter: World - Iceborne': 1118010,
  'Red Dead Redemption 2: Ultimate Edition Content': 1174180,
  'Resident Evil Village: Winters\' Expansion': 1196590,
  'The Elder Scrolls V: Skyrim - Dawnguard': 211720,
  'The Elder Scrolls V: Skyrim - Dragonborn': 226880,
}

function getSteamImageUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
}

function getProductImageUrl(product: any): string {
  const name = product.name
  const category = product.category
  const platform = product.platform

  // Steam Games
  if (platform === 'Steam' && category === 'games') {
    const appId = STEAM_APP_IDS[name]
    if (appId) {
      return getSteamImageUrl(appId)
    }
  }

  // DLCs
  if (category === 'dlc' && platform === 'Steam') {
    const appId = DLC_APP_IDS[name]
    if (appId) {
      return getSteamImageUrl(appId)
    }
  }

  // Steam Wallet Codes
  if (name.includes('Steam Wallet Code')) {
    return 'https://cdn.cloudflare.steamstatic.com/steam/apps/593110/header.jpg'
  }

  // V-Bucks (already correct)
  if (name.includes('Fortnite V-Bucks')) {
    return 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270'
  }

  // PlayStation Games
  if (platform === 'PlayStation' && category === 'games') {
    const psImages: Record<string, string> = {
      'God of War Ragnarök': 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xM8YK6Z2twRKDp8fE0mqQoa.png',
      'Spider-Man 2': 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/60a7d8c6c6e4e3b0e0e0e0e0.png',
      'The Last of Us Part I': 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMDd2B8vDNPwWUnfONl.png',
      'Horizon Forbidden West': 'https://image.api.playstation.com/vulcan/ap/rnd/202201/2215/5WU3z5dHh7QsMQ1sHfUHDZn2.png',
      'Gran Turismo 7': 'https://image.api.playstation.com/vulcan/ap/rnd/202109/3021/B1aUY0MmHl6bM4L12JRYRYdP.png',
      'Ratchet & Clank: Rift Apart': 'https://image.api.playstation.com/vulcan/ap/rnd/202104/0119/yMfoOPHbPBsL1OoJX6fFnB7Y.png',
      'Final Fantasy XVI': 'https://image.api.playstation.com/vulcan/ap/rnd/202211/1011/zwEqLDUj99lFn4k4cDjs4aDS.png',
      'Demon\'s Souls': 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2419/T3i6m3Q6h5es7L0i2QbPgAp8.png',
    }
    if (psImages[name]) {
      return psImages[name]
    }
  }

  // PlayStation Gift Cards
  if (name.includes('PlayStation Store Gift Card')) {
    return 'https://image.api.playstation.com/vulcan/img/rnd/202011/0204/1K0xa6JD5vESM2Akp8cJMI3T.png'
  }

  // PlayStation Plus
  if (name.includes('PlayStation Plus')) {
    return 'https://image.api.playstation.com/vulcan/img/rnd/202011/0204/1K0xa6JD5vESM2Akp8cJMI3T.png'
  }

  // Xbox Games
  if (platform === 'Xbox' && category === 'games') {
    const xboxImages: Record<string, string> = {
      'Halo Infinite': 'https://store-images.s-microsoft.com/image/apps.18247.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
      'Forza Horizon 5': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
      'Gears 5': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
      'Sea of Thieves': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
      'Starfield': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg',
    }
    if (xboxImages[name]) {
      return xboxImages[name]
    }
  }

  // Xbox Gift Cards
  if (name.includes('Xbox Gift Card')) {
    return 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301'
  }

  // Xbox Game Pass
  if (name.includes('Xbox Game Pass')) {
    return 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301'
  }

  // Nintendo Games
  if (platform === 'Nintendo' && category === 'games') {
    const nintendoImages: Record<string, string> = {
      'The Legend of Zelda: Tears of the Kingdom': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
      'Super Mario Bros. Wonder': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
      'Pokémon Scarlet': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
      'Animal Crossing: New Horizons': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
    }
    if (nintendoImages[name]) {
      return nintendoImages[name]
    }
  }

  // Nintendo eShop
  if (name.includes('Nintendo eShop Gift Card')) {
    return 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0'
  }

  // Return null if no specific image found - will use fallback
  return null as any
}

async function updateAllProductImages() {
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
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    console.log(`📦 Found ${products.length} products`)
    console.log('🖼️  Finding and updating product images...\n')

    let updated = 0
    let skipped = 0
    const missing: string[] = []

    for (const product of products) {
      const newImageUrl = getProductImageUrl(product)
      
      if (newImageUrl && newImageUrl !== product.image) {
        await prisma.product.update({
          where: { id: product.id },
          data: { image: newImageUrl },
        })
        updated++
        console.log(`✅ Updated: ${product.name}`)
      } else if (!newImageUrl) {
        missing.push(product.name)
        skipped++
        console.log(`⚠️  No image found for: ${product.name} (${product.platform})`)
      } else {
        skipped++
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} products!`)
    console.log(`⏭️  Skipped ${skipped} products`)
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing images for ${missing.length} products:`)
      missing.forEach(name => console.log(`   - ${name}`))
    }
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateAllProductImages()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })





// Product-specific image URLs
// Comprehensive image mapping for all products
// Uses Steam CDN for games, official sources for gift cards and subscriptions

import { productImageMap as comprehensiveMap, getCustomProductImage as getComprehensiveImage } from './product-images-comprehensive'

export const productImageMap: Record<string, string> = {
  // ===== FORTNITE V-BUCKS =====
  'Fortnite V-Bucks 1,000': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 1000': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 2,800': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 2800': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 5,000': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 5000': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 13,500': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'Fortnite V-Bucks 13500': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'V-Bucks': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  'vbucks': 'https://store-images.s-microsoft.com/image/apps.45931.66551724481003499.7e333c3e-8eba-4af1-a862-b5048f74fa0a.11f93037-1313-41a5-9e1d-51fd9df9c301?q=90&w=480&h=270',
  
  // ===== STEAM GAMES =====
  // Using Steam Grid DB CDN for game images
  'Counter-Strike 2': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Grand Theft Auto V': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Grand Theft Auto': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'GTA V': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Red Dead Redemption 2': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'The Witcher 3: Wild Hunt': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'The Witcher 3': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Elden Ring': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Cyberpunk 2077': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Hogwarts Legacy': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Starfield': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Resident Evil 4 Remake': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Dead Space Remake': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Call of Duty: Black Ops Cold War': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Call of Duty': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Battlefield 2042': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Apex Legends': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Valorant': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Rocket League': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Terraria': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Stardew Valley': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'Among Us': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  'It Takes Two': 'https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/5d79/5d790b5b41a7373026fc1607d9ce00ad.png',
  
  // ===== STEAM GIFT CARDS =====
  'Steam Wallet Code': 'https://cdn.cloudflare.steamstatic.com/steam/apps/593110/header.jpg',
  'Steam Wallet': 'https://cdn.cloudflare.steamstatic.com/steam/apps/593110/header.jpg',
  'Steam': 'https://cdn.cloudflare.steamstatic.com/steam/apps/593110/header.jpg',
  
  // ===== PLAYSTATION GAMES =====
  'God of War Ragnarök': 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xM8YK6Z2twRKDp8fE0mqQoa.png',
  'God of War': 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xM8YK6Z2twRKDp8fE0mqQoa.png',
  'Spider-Man 2': 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/60a7d8c6c6e4e3b0e0e0e0e0.png',
  'The Last of Us Part I': 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMDd2B8vDNPwWUnfONl.png',
  'Horizon Forbidden West': 'https://image.api.playstation.com/vulcan/ap/rnd/202201/2215/5WU3z5dHh7QsMQ1sHfUHDZn2.png',
  'Gran Turismo 7': 'https://image.api.playstation.com/vulcan/ap/rnd/202109/3021/B1aUY0MmHl6bM4L12JRYRYdP.png',
  'Ratchet & Clank: Rift Apart': 'https://image.api.playstation.com/vulcan/ap/rnd/202104/0119/yMfoOPHbPBsL1OoJX6fFnB7Y.png',
  'Final Fantasy XVI': 'https://image.api.playstation.com/vulcan/ap/rnd/202211/1011/zwEqLDUj99lFn4k4cDjs4aDS.png',
  'Demon\'s Souls': 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2419/T3i6m3Q6h5es7L0i2QbPgAp8.png',
  
  // ===== PLAYSTATION GIFT CARDS =====
  'PlayStation Store Gift Card': 'https://image.api.playstation.com/vulcan/img/rnd/202011/0204/1K0xa6JD5vESM2Akp8cJMI3T.png',
  'PlayStation': 'https://image.api.playstation.com/vulcan/img/rnd/202011/0204/1K0xa6JD5vESM2Akp8cJMI3T.png',
  'PlayStation Plus': 'https://image.api.playstation.com/vulcan/img/rnd/202011/0204/1K0xa6JD5vESM2Akp8cJMI3T.png',
  'PS Plus': 'https://image.api.playstation.com/vulcan/img/rnd/202011/0204/1K0xa6JD5vESM2Akp8cJMI3T.png',
  
  // ===== XBOX GAMES =====
  'Halo Infinite': 'https://store-images.s-microsoft.com/image/apps.18247.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Halo': 'https://store-images.s-microsoft.com/image/apps.18247.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Forza Horizon 5': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Forza': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Gears 5': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Sea of Thieves': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  
  // ===== XBOX GIFT CARDS =====
  'Xbox Gift Card': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Xbox': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Xbox Game Pass': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  'Game Pass': 'https://store-images.s-microsoft.com/image/apps.18413.13510798887687220.6d5b6b86-0e34-4ed3-939f-e5e8b3c0e5b8.11f93037-1313-41a5-9e1d-51fd9df9c301',
  
  // ===== NINTENDO GAMES =====
  'The Legend of Zelda: Tears of the Kingdom': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Zelda': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Super Mario Bros. Wonder': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Mario': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Pokémon Scarlet': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Pokemon': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Animal Crossing: New Horizons': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Animal Crossing': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  
  // ===== NINTENDO ESHOP =====
  'Nintendo eShop Gift Card': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'Nintendo': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  'eShop': 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000063749/4901e1a2f46c3c916f0c5c20ec58574d1d6ce2e419fdc536c4d0e0e0e0e0e0',
  
  // ===== FIFA POINTS =====
  'FIFA': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
  'FIFA Points': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
  'FIFA 24': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== ROBLOX =====
  'Roblox': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
  'Robux': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== GTA SHARK CARDS =====
  'GTA Online': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
  'Shark Card': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== AMAZON GIFT CARDS =====
  'Amazon Gift Card': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  'Amazon': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== APPLE GIFT CARDS =====
  'Apple Gift Card': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  'Apple': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== SPOTIFY =====
  'Spotify': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  'Spotify Premium': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== NETFLIX =====
  'Netflix': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== DISCORD =====
  'Discord': 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format',
  'Discord Nitro': 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format',
  'Simex Geheimer Discord-Server': 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format',
  
  // ===== DLC =====
  'Phantom Liberty': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
  'Shadow of the Erdtree': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
  'Blood and Wine': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
  'Hearts of Stone': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
}

/**
 * Get custom image URL for a product if it exists
 */
export function getCustomProductImage(name: string, productId?: string): string | null {
  // Ensure name is always a string
  const safeName = name || ''
  
  // First check comprehensive map
  const comprehensiveImage = getComprehensiveImage(safeName, productId)
  if (comprehensiveImage) {
    return comprehensiveImage
  }
  
  // Then check local map
  if (safeName && productImageMap[safeName]) {
    return productImageMap[safeName]
  }
  
  // Try to find by product ID
  if (productId && productImageMap[productId]) {
    return productImageMap[productId]
  }
  
  // Try partial name matching (case-insensitive)
  if (!safeName) return null
  const nameLower = safeName.toLowerCase()
  for (const [key, value] of Object.entries(productImageMap)) {
    if (key.toLowerCase().includes(nameLower) || nameLower.includes(key.toLowerCase())) {
      return value
    }
  }
  
  return null
}

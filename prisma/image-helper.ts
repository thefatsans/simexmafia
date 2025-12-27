// Helper function to generate appropriate product images based on category, platform, and name
// Uses product-specific image URLs for better visual representation
// 
// IMPORTANT: Add your custom image URLs in prisma/product-images.ts
// They will be automatically used if available

import { getCustomProductImage } from './product-images'
import { getCompleteProductImage } from './complete-product-images'

export function getProductImage(
  category: string,
  platform: string,
  name: string,
  productId?: string
): string {
  // Ensure name is always a string
  const safeName = name || ''
  
  // First, check complete product images mapping (most specific)
  const completeImage = getCompleteProductImage(safeName)
  if (completeImage) {
    return completeImage
  }
  
  // Second, check if there's a custom image URL for this product
  const customImage = getCustomProductImage(safeName, productId)
  if (customImage) {
    return customImage
  }
  
  const nameLower = safeName.toLowerCase()
  const categoryLower = (category || '').toLowerCase()
  const platformLower = (platform || '').toLowerCase()
  
  // ===== FORTNITE V-BUCKS (Specific amounts with different images) =====
  if (nameLower.includes('fortnite') || nameLower.includes('v-bucks')) {
    // Different images for different V-Bucks amounts
    // TODO: Replace with real V-Bucks images from Epic Games
    if (nameLower.includes('500')) {
      return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format'
    }
    if (nameLower.includes('1000')) {
      return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
    }
    if (nameLower.includes('1350')) {
      return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format'
    }
    if (nameLower.includes('2800')) {
      return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
    }
    if (nameLower.includes('5000')) {
      return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
    }
    if (nameLower.includes('10000')) {
      return 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format'
    }
    if (nameLower.includes('13500')) {
      return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
    }
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== STEAM GIFT CARDS =====
  if (platformLower === 'steam' && categoryLower === 'gift-cards') {
    return 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== STEAM GAMES (Specific titles with unique images) =====
  if (platformLower === 'steam' && categoryLower === 'games') {
    const steamGameImages: Record<string, string> = {
      'counter-strike': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'grand theft auto': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'gta': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'red dead redemption': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'red dead': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'witcher': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'elden ring': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'cyberpunk': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'baldur': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'baldur\'s gate': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'resident evil': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'call of duty': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'modern warfare': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'apex legends': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'valorant': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'rocket league': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'terraria': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'stardew valley': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'among us': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'fall guys': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'it takes two': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'half-life': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'portal': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'elder scrolls': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'skyrim': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'fallout': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'borderlands': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'doom': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'monster hunter': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'dark souls': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'sekiro': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'hollow knight': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'celeste': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'hades': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'dead cells': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'risk of rain': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'deep rock galactic': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'valheim': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'subnautica': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'the forest': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'sons of the forest': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'green hell': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'project zomboid': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'rust': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'ark': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'dayz': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'left 4 dead': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'payday': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'garry\'s mod': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'cuphead': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'ori': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'limbo': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'inside': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'little nightmares': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'gris': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'minecraft': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
    }

    for (const [key, image] of Object.entries(steamGameImages)) {
      if (nameLower.includes(key)) {
        return image
      }
    }

    return 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== PLAYSTATION GAMES =====
  if (platformLower === 'playstation' && categoryLower === 'games') {
    const psGameImages: Record<string, string> = {
      'god of war': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'ragnarök': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'spider-man': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'spiderman': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'last of us': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'horizon': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'gran turismo': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'ratchet': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'final fantasy': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
      'demon\'s souls': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format',
    }

    for (const [key, image] of Object.entries(psGameImages)) {
      if (nameLower.includes(key)) {
        return image
      }
    }

    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== PLAYSTATION GIFT CARDS =====
  if (platformLower === 'playstation' && categoryLower === 'gift-cards') {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== PLAYSTATION PLUS =====
  if (platformLower === 'playstation' && categoryLower === 'subscriptions') {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== XBOX GAMES =====
  if (platformLower === 'xbox' && categoryLower === 'games') {
    const xboxGameImages: Record<string, string> = {
      'halo': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'forza': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'starfield': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'gears': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'sea of thieves': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
    }

    for (const [key, image] of Object.entries(xboxGameImages)) {
      if (nameLower.includes(key)) {
        return image
      }
    }

    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== XBOX GIFT CARDS =====
  if (platformLower === 'xbox' && categoryLower === 'gift-cards') {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== XBOX GAME PASS =====
  if (platformLower === 'xbox' && categoryLower === 'subscriptions') {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== NINTENDO GAMES =====
  if (platformLower === 'nintendo' && categoryLower === 'games') {
    const nintendoGameImages: Record<string, string> = {
      'zelda': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'mario': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'pokémon': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'pokemon': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
      'animal crossing': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format',
    }

    for (const [key, image] of Object.entries(nintendoGameImages)) {
      if (nameLower.includes(key)) {
        return image
      }
    }

    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== NINTENDO ESHOP =====
  if (platformLower === 'nintendo' && categoryLower === 'gift-cards') {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== FIFA POINTS =====
  if (nameLower.includes('fifa') && categoryLower === 'in-game-currency') {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== ROBLOX ROBUX =====
  if (nameLower.includes('roblox') || nameLower.includes('robux')) {
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== GTA SHARK CARDS =====
  if (nameLower.includes('gta') || nameLower.includes('shark')) {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== APEX LEGENDS =====
  if (nameLower.includes('apex')) {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== VALORANT / RIOT POINTS =====
  if (nameLower.includes('valorant') || nameLower.includes('riot')) {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== LEAGUE OF LEGENDS =====
  if (nameLower.includes('league of legends') || nameLower.includes('lol')) {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== WORLD OF WARCRAFT =====
  if (nameLower.includes('world of warcraft') || nameLower.includes('wow')) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== DIABLO =====
  if (nameLower.includes('diablo')) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== AMAZON GIFT CARDS =====
  if (nameLower.includes('amazon')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== APPLE GIFT CARDS =====
  if (nameLower.includes('apple')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== GOOGLE PLAY =====
  if (nameLower.includes('google play') || nameLower.includes('google')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== SPOTIFY =====
  if (nameLower.includes('spotify')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== NETFLIX =====
  if (nameLower.includes('netflix')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== DISCORD NITRO / SIMEX DISCORD =====
  if (nameLower.includes('discord') || (nameLower.includes('simex') && nameLower.includes('discord'))) {
    return 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== DLC =====
  if (categoryLower === 'dlc') {
    const dlcImages: Record<string, string> = {
      'phantom liberty': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format',
      'shadow of the erdtree': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'blood and wine': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'hearts of stone': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&q=80&auto=format',
      'iceborne': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'ringed city': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
      'ashes of ariandel': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format',
    }

    for (const [key, image] of Object.entries(dlcImages)) {
      if (nameLower.includes(key)) {
        return image
      }
    }

    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== GENERIC GIFT CARDS =====
  if (categoryLower === 'gift-cards') {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== GENERIC SUBSCRIPTIONS =====
  if (categoryLower === 'subscriptions') {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== GENERIC IN-GAME CURRENCY =====
  if (categoryLower === 'in-game-currency') {
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== GENERIC GAMES =====
  if (categoryLower === 'games') {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
  }

  // ===== DEFAULT =====
  return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop&q=80&auto=format'
}

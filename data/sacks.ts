import { Product } from '@/types'
import { mockProducts } from './products'

export type SackType = 'bronze' | 'silver' | 'gold' | 'diamond' | 'emerald' | 'void' | 'god' | 'sack-a-holic'

export interface Sack {
  id: string
  type: SackType
  name: string
  description: string
  priceCoins: number
  priceMoney: number
  rarity: number // 1-8, höher = seltener
  color: string
  icon: string
}

export interface SackReward {
  type: 'product' | 'coins' | 'nothing'
  product?: Product
  coins?: number
  message: string
}

export const sackTypes: Sack[] = [
  {
    id: 'bronze',
    type: 'bronze',
    name: 'Bronze Sack',
    description: 'Ein einfacher Sack mit grundlegenden Belohnungen',
    priceCoins: 50,
    priceMoney: 2.99,
    rarity: 1,
    color: '#CD7F32',
    icon: '🥉',
  },
  {
    id: 'silver',
    type: 'silver',
    name: 'Silber Sack',
    description: 'Ein verbesserter Sack mit besseren Belohnungen',
    priceCoins: 100,
    priceMoney: 4.99,
    rarity: 2,
    color: '#C0C0C0',
    icon: '🥈',
  },
  {
    id: 'gold',
    type: 'gold',
    name: 'Gold Sack',
    description: 'Ein wertvoller Sack mit guten Belohnungen',
    priceCoins: 200,
    priceMoney: 9.99,
    rarity: 3,
    color: '#FFD700',
    icon: '🥇',
  },
  {
    id: 'diamond',
    type: 'diamond',
    name: 'Diamant Sack',
    description: 'Ein seltener Sack mit sehr guten Belohnungen',
    priceCoins: 400,
    priceMoney: 19.99,
    rarity: 4,
    color: '#B9F2FF',
    icon: '💎',
  },
  {
    id: 'emerald',
    type: 'emerald',
    name: 'Smaragd Sack',
    description: 'Ein sehr seltener Sack mit exzellenten Belohnungen',
    priceCoins: 750,
    priceMoney: 34.99,
    rarity: 5,
    color: '#50C878',
    icon: '💚',
  },
  {
    id: 'void',
    type: 'void',
    name: 'Void Sack',
    description: 'Ein mysteriöser Sack aus dem Nichts mit legendären Belohnungen',
    priceCoins: 1500,
    priceMoney: 59.99,
    rarity: 6,
    color: '#4B0082',
    icon: '🌌',
  },
  {
    id: 'god',
    type: 'god',
    name: 'God Sack',
    description: 'Ein göttlicher Sack mit epischen Belohnungen',
    priceCoins: 3000,
    priceMoney: 99.99,
    rarity: 7,
    color: '#FFD700',
    icon: '⚡',
  },
  {
    id: 'sack-a-holic',
    type: 'sack-a-holic',
    name: 'Sack-a-holic',
    description: 'Der ultimative Sack - garantiert mindestens eine legendäre Belohnung!',
    priceCoins: 5000,
    priceMoney: 149.99,
    rarity: 8,
    color: '#FF1493',
    icon: '🎁',
  },
]

// Balance: 50% Chance auf gute Belohnungen, 50% auf schlechte (Nerfed)
// Mehr Nieten, weniger gute Belohnungen für bessere Balance
// Coin-Wert: 1 Coin = €0.01 (100 Coins = €1)

interface RewardTier {
  minValue: number // Mindestwert in €
  maxValue: number // Maximalwert in €
  weight: number // Gewichtung für Wahrscheinlichkeit
  isGood: boolean // Gute oder schlechte Belohnung
}

// Definiere Belohnungs-Tiers für jeden Sack (70/30 Verteilung)
const getRewardTiers = (sack: Sack): RewardTier[] => {
  const priceInEuros = sack.priceMoney
  
  // Erstelle Tiers basierend auf Sack-Rarity
  // 50% schlechte Belohnungen (mehr Nieten), 50% gute Belohnungen (Nerfed)
  const tiers: RewardTier[] = []
  
  if (sack.rarity === 1) {
    // Bronze: €2.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      // 50% schlechte Belohnungen (mehr Nieten)
      { minValue: 0, maxValue: 0, weight: 30, isGood: false }, // Niete (30%)
      { minValue: 0.10, maxValue: 0.40, weight: 20, isGood: false }, // Sehr kleine Coins (20%)
      // 50% gute Belohnungen (reduziert)
      { minValue: 0.40, maxValue: 0.80, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 0.80, maxValue: 1.20, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 1.20, maxValue: 1.80, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else if (sack.rarity === 2) {
    // Silver: €4.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 25, isGood: false }, // Niete (25%)
      { minValue: 0.20, maxValue: 0.60, weight: 25, isGood: false }, // Sehr kleine Coins (25%)
      { minValue: 0.60, maxValue: 1.20, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 1.20, maxValue: 2.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 2.00, maxValue: 3.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else if (sack.rarity === 3) {
    // Gold: €9.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 20, isGood: false }, // Niete (20%)
      { minValue: 0.40, maxValue: 1.20, weight: 30, isGood: false }, // Sehr kleine Coins (30%)
      { minValue: 1.20, maxValue: 2.50, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 2.50, maxValue: 4.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 4.00, maxValue: 6.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else if (sack.rarity === 4) {
    // Diamond: €19.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 15, isGood: false }, // Niete (15%)
      { minValue: 0.80, maxValue: 2.50, weight: 35, isGood: false }, // Sehr kleine Coins (35%)
      { minValue: 2.50, maxValue: 5.00, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 5.00, maxValue: 8.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 8.00, maxValue: 12.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else if (sack.rarity === 5) {
    // Emerald: €34.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 12, isGood: false }, // Niete (12%)
      { minValue: 1.50, maxValue: 4.00, weight: 38, isGood: false }, // Sehr kleine Coins (38%)
      { minValue: 4.00, maxValue: 10.00, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 10.00, maxValue: 16.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 16.00, maxValue: 24.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else if (sack.rarity === 6) {
    // Void: €59.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 10, isGood: false }, // Niete (10%)
      { minValue: 2.50, maxValue: 8.00, weight: 40, isGood: false }, // Sehr kleine Coins (40%)
      { minValue: 8.00, maxValue: 18.00, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 18.00, maxValue: 28.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 28.00, maxValue: 40.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else if (sack.rarity === 7) {
    // God: €99.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 8, isGood: false }, // Niete (8%)
      { minValue: 4.00, maxValue: 15.00, weight: 42, isGood: false }, // Sehr kleine Coins (42%)
      { minValue: 15.00, maxValue: 32.00, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 32.00, maxValue: 48.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 48.00, maxValue: 65.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  } else {
    // Sack-a-holic: €149.99 - Stark genervt: Mehr Nieten, weniger gute Belohnungen
    tiers.push(
      { minValue: 0, maxValue: 0, weight: 6, isGood: false }, // Niete (6%)
      { minValue: 6.00, maxValue: 25.00, weight: 44, isGood: false }, // Sehr kleine Coins (44%)
      { minValue: 25.00, maxValue: 50.00, weight: 30, isGood: true }, // Kleine Coins (30%)
      { minValue: 50.00, maxValue: 75.00, weight: 15, isGood: true }, // Mittlere Coins (15%)
      { minValue: 75.00, maxValue: 95.00, weight: 5, isGood: true } // Große Belohnungen (5%)
    )
  }
  
  return tiers
}

// Wähle ein Tier basierend auf Gewichtung
const selectTier = (tiers: RewardTier[]): RewardTier => {
  const totalWeight = tiers.reduce((sum, tier) => sum + tier.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const tier of tiers) {
    random -= tier.weight
    if (random <= 0) {
      return tier
    }
  }
  
  return tiers[tiers.length - 1]
}

// Generiere Belohnung basierend auf Tier
const generateRewardFromTier = (tier: RewardTier, sack: Sack): SackReward => {
  const value = tier.minValue + Math.random() * (tier.maxValue - tier.minValue)
  
  // Entscheide: Coins oder Produkt?
  // Bei höheren Werten eher Produkt, bei niedrigeren eher Coins
  const useProduct = value > 5 && Math.random() > 0.4
  
  if (useProduct) {
    // Suche Produkt im Wertbereich
    const product = getProductByValue(tier.minValue * 0.8, tier.maxValue * 1.2)
    if (product) {
      return {
        type: 'product',
        product,
        message: `Glückwunsch! Sie haben "${product.name}" (Wert: €${product.price.toFixed(2)}) gewonnen!`,
      }
    }
  }
  
  // Fallback: Coins (1 Coin = €0.01)
  const coins = Math.floor(value * 100)
  if (coins <= 0) {
    return {
      type: 'nothing',
      message: 'Leider eine Niete! Versuchen Sie es nochmal!',
    }
  }
  
  return {
    type: 'coins',
    coins,
    message: `Sie haben ${coins} GoofyCoins (Wert: €${value.toFixed(2)}) gewonnen!`,
  }
}

// Produkt-Wert-Kategorien
const getProductByValue = (minValue: number, maxValue: number): Product | null => {
  const availableProducts = mockProducts.filter(
    p => p.price >= minValue && p.price <= maxValue && p.inStock
  )
  if (availableProducts.length === 0) {
    // Fallback: Suche in erweitertem Bereich
    const extendedProducts = mockProducts.filter(
      p => p.price >= minValue * 0.7 && p.price <= maxValue * 1.3 && p.inStock
    )
    if (extendedProducts.length === 0) return null
    return extendedProducts[Math.floor(Math.random() * extendedProducts.length)]
  }
  return availableProducts[Math.floor(Math.random() * availableProducts.length)]
}

export const openSack = (sack: Sack): SackReward => {
  const tiers = getRewardTiers(sack)
  const selectedTier = selectTier(tiers)
  return generateRewardFromTier(selectedTier, sack)
}

// Generiere alle möglichen Belohnungen für einen Sack (für Animation)
export const generatePossibleRewards = (sack: Sack): Array<{ reward: SackReward; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' }> => {
  const tiers = getRewardTiers(sack)
  const rewards: Array<{ reward: SackReward; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' }> = []
  
  // Generiere Beispiel-Belohnungen für jedes Tier
  tiers.forEach((tier, index) => {
    const rarityMap: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    const rarity = rarityMap[Math.min(index, rarityMap.length - 1)]
    
    // Generiere 3-5 Beispiel-Belohnungen pro Tier
    for (let i = 0; i < 4; i++) {
      const reward = generateRewardFromTier(tier, sack)
      rewards.push({ reward, rarity })
    }
  })
  
  return rewards
}

export const getSackByType = (type: SackType): Sack | undefined => {
  return sackTypes.find(s => s.type === type)
}







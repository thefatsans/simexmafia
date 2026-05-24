export interface GoofyCoinsPackage {
  id: string
  name: string
  coins: number
  price: number // in Euro
  bonus?: number // Bonus-Coins
  popular?: boolean
  bestValue?: boolean
  description: string
  icon: string
}

export const goofyCoinsPackages: GoofyCoinsPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    price: 4.99,
    bonus: 0,
    description: 'Perfekt für den Einstieg',
    icon: '🪙',
  },
  {
    id: 'small',
    name: 'Small Pack',
    coins: 250,
    price: 9.99,
    bonus: 25,
    description: 'Guter Start mit Bonus',
    icon: '💰',
  },
  {
    id: 'medium',
    name: 'Medium Pack',
    coins: 500,
    price: 19.99,
    bonus: 75,
    popular: true,
    description: 'Meistverkauft - Bestes Preis-Leistungs-Verhältnis',
    icon: '💵',
  },
  {
    id: 'large',
    name: 'Large Pack',
    coins: 1000,
    price: 34.99,
    bonus: 200,
    description: 'Große Ersparnis',
    icon: '💸',
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    coins: 2500,
    price: 79.99,
    bonus: 750,
    bestValue: true,
    description: 'Maximaler Bonus - Bestes Angebot!',
    icon: '💎',
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    coins: 5000,
    price: 149.99,
    bonus: 2000,
    description: 'Der ultimative Pack für echte Fans',
    icon: '👑',
  },
]

export const getPackageById = (id: string): GoofyCoinsPackage | undefined => {
  return goofyCoinsPackages.find(pkg => pkg.id === id)
}

export const calculateTotalCoins = (pkg: GoofyCoinsPackage): number => {
  return pkg.coins + (pkg.bonus || 0)
}

export const calculatePricePerCoin = (pkg: GoofyCoinsPackage): number => {
  const totalCoins = calculateTotalCoins(pkg)
  return pkg.price / totalCoins
}
















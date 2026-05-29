/** Discord-Server-Produkt-Erkennung ohne schwere Katalog-Imports (vermeidet Zyklen). */
export const SIMEX_DISCORD_SERVER_NAME = 'Simex Geheimer Discord-Server'

export function isSimexDiscordServerProduct(product: { name: string }): boolean {
  const name = product.name.toLowerCase()
  return (
    name.includes('simex') &&
    name.includes('discord') &&
    (name.includes('server') || name.includes('geheim'))
  )
}

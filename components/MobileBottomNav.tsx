'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Gift, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

const HIDDEN_PREFIXES = ['/auth', '/checkout', '/admin']

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (path: string) => boolean
}

const ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Start',
    icon: Home,
    match: (p) => p === '/',
  },
  {
    href: '/products',
    label: 'Shop',
    icon: ShoppingBag,
    match: (p) => p.startsWith('/products') || p.startsWith('/categories') || p.startsWith('/search'),
  },
  {
    href: '/sacks',
    label: 'Säcke',
    icon: Gift,
    match: (p) => p.startsWith('/sacks'),
  },
  {
    href: '/cart',
    label: 'Korb',
    icon: ShoppingCart,
    match: (p) => p.startsWith('/cart'),
  },
  {
    href: '/account',
    label: 'Konto',
    icon: User,
    match: (p) => p.startsWith('/account') || p.startsWith('/inventory'),
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname() || '/'
  const { getTotalItems } = useCart()
  const cartCount = getTotalItems()

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-purple-500/30 bg-fortnite-darker/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Hauptnavigation Mobile"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          const showBadge = item.href === '/cart' && cartCount > 0
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 relative transition-colors touch-manipulation min-h-[56px] ${
                  active
                    ? 'text-purple-400'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 bg-purple-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-b" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

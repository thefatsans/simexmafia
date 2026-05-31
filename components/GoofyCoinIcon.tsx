import { GOOFYCOIN_ICON_SRC } from '@/lib/branding/goofycoin'

type GoofyCoinIconProps = {
  className?: string
  title?: string
}

/** Marken-Icon für GoofyCoins (ersetzt Lucide `Coins`). */
export default function GoofyCoinIcon({ className = 'w-5 h-5', title }: GoofyCoinIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={GOOFYCOIN_ICON_SRC}
      alt={title ?? 'GoofyCoin'}
      title={title}
      className={`inline-block shrink-0 object-contain ${className}`}
      draggable={false}
    />
  )
}

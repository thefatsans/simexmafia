'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  className?: string
  centered?: boolean
}

const SIZE_CLASS: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
}

export default function LoadingSpinner({
  size = 'md',
  label,
  className = '',
  centered = false,
}: LoadingSpinnerProps) {
  const inner = (
    <>
      <Loader2
        className={`${SIZE_CLASS[size]} animate-spin text-purple-400 ${className}`}
        aria-hidden="true"
      />
      {label && <span className="text-gray-300 text-sm">{label}</span>}
    </>
  )

  if (centered) {
    return (
      <div
        className="flex items-center justify-center gap-3 py-8"
        role="status"
        aria-live="polite"
      >
        {inner}
        {!label && <span className="sr-only">Lädt...</span>}
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      {inner}
      {!label && <span className="sr-only">Lädt...</span>}
    </span>
  )
}

export function LoadingPage({ label = 'Lädt...' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-400" aria-hidden="true" />
      <p className="text-gray-300 text-base sm:text-lg" role="status" aria-live="polite">
        {label}
      </p>
    </div>
  )
}

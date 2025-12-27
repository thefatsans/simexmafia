'use client'

import Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  width?: number
  height?: number
  showText?: boolean
  className?: string
}

export default function Logo({ width = 40, height = 40, showText = true, className = '' }: LogoProps) {
  const [logoError, setLogoError] = useState(false)

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {!logoError && (
        <div className="relative" style={{ width, height }}>
          <Image
            src="/logo.png"
            alt="SimexMafia Logo"
            fill
            className="object-contain"
            onError={() => setLogoError(true)}
            priority
          />
        </div>
      )}
      {showText && (
        <div className="relative -ml-6">
          <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 transition-opacity group-hover:opacity-70"></div>
          <span className="relative text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
            SimexMafia
          </span>
        </div>
      )}
    </div>
  )
}


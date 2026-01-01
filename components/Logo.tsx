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
        <div 
          className="relative logo-image-wrapper flex items-center justify-center"
          style={{ 
            width, 
            height,
          }}
        >
          <div 
            className="relative logo-image flex items-center justify-center" 
            style={{ 
              width, 
              height,
              animation: 'logoFloat 3s ease-in-out infinite',
            }}
          >
            <Image
              src="/logo.png"
              alt="SimexMafia Logo"
              fill
              className="object-contain transition-all duration-300 hover:scale-110"
              onError={() => setLogoError(true)}
              priority
              style={{
                filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.6)) drop-shadow(0 0 40px rgba(56, 189, 248, 0.3))',
                animation: 'logoGlow 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}
      {showText && (
        <div className="relative text-container flex items-center" style={{ animation: 'none !important', marginLeft: '-24px' }}>
          <span className="relative text-3xl font-bold bg-gradient-to-r from-winter-ice via-winter-blue-light to-winter-snow bg-clip-text text-transparent drop-shadow-lg leading-none" style={{ animation: 'none !important' }}>
            SimexMafia
          </span>
        </div>
      )}
    </div>
  )
}


'use client'

import { Facebook, Twitter, MessageCircle, Link2, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  image?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'horizontal' | 'vertical'
}

export default function SocialShare({
  url,
  title,
  description = '',
  image = '',
  size = 'md',
  variant = 'horizontal',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasShare, setHasShare] = useState(false)
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setHasShare('share' in navigator)
    }
  }, [])

  const shareData = {
    url: fullUrl,
    title,
    description,
    image,
  }

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size]

  const buttonSize = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }[size]

  const shareToFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const shareToTwitter = () => {
    const text = `${title}${description ? ` - ${description}` : ''}`
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const shareToWhatsApp = () => {
    const text = `${title}${description ? ` - ${description}` : ''} ${fullUrl}`
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        })
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed')
      }
    }
  }

  const containerClass = variant === 'horizontal' 
    ? 'flex items-center space-x-2' 
    : 'flex flex-col space-y-2'

  return (
    <div className={containerClass}>
      <span className="text-gray-400 text-sm mr-2 hidden sm:inline">
        Teilen:
      </span>
      
      {/* Native Share (Mobile) */}
      {mounted && hasShare && (
        <button
          onClick={shareNative}
          className={`${buttonSize} bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors group`}
          title="Teilen"
        >
          <Link2 className={`${iconSize} text-purple-400 group-hover:scale-110 transition-transform`} />
        </button>
      )}

      {/* Facebook */}
      <button
        onClick={shareToFacebook}
        className={`${buttonSize} bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors group`}
        title="Auf Facebook teilen"
      >
        <Facebook className={`${iconSize} text-blue-400 group-hover:scale-110 transition-transform`} />
      </button>

      {/* Twitter */}
      <button
        onClick={shareToTwitter}
        className={`${buttonSize} bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg transition-colors group`}
        title="Auf Twitter teilen"
      >
        <Twitter className={`${iconSize} text-sky-400 group-hover:scale-110 transition-transform`} />
      </button>

      {/* WhatsApp */}
      <button
        onClick={shareToWhatsApp}
        className={`${buttonSize} bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors group`}
        title="Auf WhatsApp teilen"
      >
        <MessageCircle className={`${iconSize} text-green-400 group-hover:scale-110 transition-transform`} />
      </button>

      {/* Copy Link */}
      <button
        onClick={copyToClipboard}
        className={`${buttonSize} bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg transition-colors group relative`}
        title="Link kopieren"
      >
        {copied ? (
          <Check className={`${iconSize} text-green-400`} />
        ) : (
          <Copy className={`${iconSize} text-gray-400 group-hover:scale-110 transition-transform`} />
        )}
      </button>
    </div>
  )
}


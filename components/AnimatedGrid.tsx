'use client'

import { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface AnimatedGridProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  threshold?: number
}

export default function AnimatedGrid({
  children,
  className = '',
  staggerDelay = 100,
  threshold = 0.1,
}: AnimatedGridProps) {
  const { elementRef, isVisible } = useScrollAnimation({ threshold })

  return (
    <div ref={elementRef} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={isVisible ? `animate-fade-in-scale animate-delay-${Math.min(index * staggerDelay, 600)}` : 'opacity-0'}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}







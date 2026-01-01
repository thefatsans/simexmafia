'use client'

import { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  animationType?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'fadeInScale' | 'slideInBottom'
  delay?: number
  threshold?: number
}

export default function AnimatedSection({
  children,
  className = '',
  animationType = 'fadeInUp',
  delay = 0,
  threshold = 0.1,
}: AnimatedSectionProps) {
  const { elementRef, isVisible } = useScrollAnimation({ threshold })

  const animationClasses = {
    fadeInUp: 'animate-fade-in-up',
    fadeInDown: 'animate-fade-in-down',
    fadeInLeft: 'animate-fade-in-left',
    fadeInRight: 'animate-fade-in-right',
    fadeInScale: 'animate-fade-in-scale',
    slideInBottom: 'animate-slide-in-bottom',
  }

  const delayClass = delay > 0 ? `animate-delay-${Math.min(delay, 600)}` : ''

  return (
    <div
      ref={elementRef}
      className={`${className} ${isVisible ? `${animationClasses[animationType]} ${delayClass}` : 'opacity-0'}`}
    >
      {children}
    </div>
  )
}







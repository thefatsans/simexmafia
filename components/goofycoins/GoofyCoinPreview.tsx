'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOFYCOIN_ICON_SRC } from '@/lib/branding/goofycoin'
import { GOOFYCOIN_PREVIEW } from '@/lib/branding/goofycoin-copy'
import { Sparkles } from 'lucide-react'

type Rotation = { x: number; y: number }

function GoofyCoinMesh({
  rotation,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  rotation: Rotation
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: () => void
}) {
  const coinRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(280)

  useEffect(() => {
    const el = coinRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const update = () => setSize(el.offsetWidth || 280)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const thickness = Math.max(22, size * 0.085)
  const halfThickness = thickness / 2

  const shadowScale = 0.55 + 0.45 * Math.cos((rotation.x * Math.PI) / 180)
  const shadowOpacity = 0.25 + 0.2 * Math.cos((rotation.x * Math.PI) / 180)

  return (
    <div
      className={`relative w-full flex-1 flex items-center justify-center select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ perspective: '900px', perspectiveOrigin: '50% 42%' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      role="img"
      aria-label="Interaktive GoofyCoin-Vorschau – halten und ziehen zum Drehen"
    >
      {/* Boden-Schatten */}
      <div
        className="pointer-events-none absolute left-1/2 rounded-full bg-black blur-2xl"
        style={{
          width: size * 0.88,
          height: size * 0.18,
          bottom: '8%',
          transform: `translateX(-50%) scale(${shadowScale})`,
          opacity: shadowOpacity,
        }}
        aria-hidden
      />

      <div
        ref={coinRef}
        className="relative aspect-square will-change-transform"
        style={{
          width: 'min(300px, 74vw)',
          height: 'min(300px, 74vw)',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging ? 'none' : 'transform 140ms ease-out',
        }}
      >
        {/* Vorderseite */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            transform: `translateZ(${halfThickness}px)`,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Erhabener Goldrand */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 210deg, #78350f, #fbbf24, #fde68a, #f59e0b, #92400e, #fcd34d, #78350f)',
              boxShadow:
                'inset 0 4px 12px rgba(255,255,255,0.35), inset 0 -6px 14px rgba(0,0,0,0.45), 0 8px 32px rgba(250,204,21,0.35)',
            }}
          />
          <div className="absolute inset-[5%] rounded-full overflow-hidden bg-[#1a1208]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GOOFYCOIN_ICON_SRC}
              alt=""
              draggable={false}
              className="h-full w-full object-contain pointer-events-none"
            />
            {/* Lichtreflex */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at ${32 + Math.sin((rotation.y * Math.PI) / 180) * 12}% ${28 + Math.sin((rotation.x * Math.PI) / 180) * 10}%, rgba(255,255,255,0.45) 0%, transparent 42%)`,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.35), inset 0 6px 16px rgba(255,255,255,0.12)',
              }}
              aria-hidden
            />
          </div>
        </div>

        {/* Rückseite */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            transform: `rotateY(180deg) translateZ(${halfThickness}px)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 30deg, #5c3a0a, #b45309, #d97706, #78350f, #a16207, #5c3a0a)',
              boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.55)',
            }}
          />
          <div className="absolute inset-[5%] rounded-full overflow-hidden brightness-[0.82] saturate-[0.9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GOOFYCOIN_ICON_SRC}
              alt=""
              draggable={false}
              className="h-full w-full object-contain scale-x-[-1] pointer-events-none"
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-black/25"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GoofyCoinPreview() {
  const [rotation, setRotation] = useState<Rotation>({ x: -22, y: 32 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number; rotX: number; rotY: number } | null>(null)
  const rotationRef = useRef(rotation)
  rotationRef.current = rotation

  useEffect(() => {
    let frame = 0
    let last = 0

    const tick = (time: number) => {
      if (!last) last = time
      const delta = Math.min(time - last, 32)
      last = time

      if (!dragRef.current) {
        setRotation((prev) => ({
          x: prev.x,
          y: prev.y + delta * 0.032,
        }))
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      rotX: rotationRef.current.x,
      rotY: rotationRef.current.y,
    }
    setIsDragging(true)
  }, [])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y

    setRotation({
      x: Math.max(-80, Math.min(80, dragRef.current.rotX - dy * 0.45)),
      y: dragRef.current.rotY + dx * 0.45,
    })
  }, [])

  const endDrag = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-950/40 via-fortnite-dark to-purple-950/50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="relative flex flex-col items-center justify-center px-4 py-8 sm:py-10 min-h-[340px] sm:min-h-[420px]">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(250,204,21,0.22),transparent_60%)] pointer-events-none"
            aria-hidden
          />

          <GoofyCoinMesh
            rotation={rotation}
            isDragging={isDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
          />

          <p className="relative z-10 mt-3 text-center text-xs sm:text-sm text-gray-400">
            {isDragging ? 'Loslassen zum Weiterdrehen' : 'Halten & ziehen — horizontal & vertikal drehen'}
          </p>
        </div>

        <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-yellow-500/15 px-6 py-8 sm:px-8 sm:py-10">
          <div className="inline-flex items-center gap-2 text-yellow-400 mb-3">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold uppercase tracking-wide">Währungs-Preview</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{GOOFYCOIN_PREVIEW.title}</h3>
          <p className="text-yellow-400/90 font-medium mb-4">{GOOFYCOIN_PREVIEW.tagline}</p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
            {GOOFYCOIN_PREVIEW.description}
          </p>
          <ul className="space-y-3">
            {GOOFYCOIN_PREVIEW.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-gray-200">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOFYCOIN_ICON_SRC } from '@/lib/branding/goofycoin'
import { GOOFYCOIN_PREVIEW } from '@/lib/branding/goofycoin-copy'
import { Sparkles } from 'lucide-react'

const COIN_SIZE = 'min(280px, 72vw)'
const COIN_DEPTH = 14

type Rotation = { x: number; y: number }

export default function GoofyCoinPreview() {
  const [rotation, setRotation] = useState<Rotation>({ x: -18, y: 24 })
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
          y: prev.y + delta * 0.035,
        }))
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        rotX: rotationRef.current.x,
        rotY: rotationRef.current.y,
      }
      setIsDragging(true)
    },
    []
  )

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
        {/* 3D Coin Stage */}
        <div className="relative flex flex-col items-center justify-center px-4 py-8 sm:py-10 min-h-[320px] sm:min-h-[380px]">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(250,204,21,0.18),transparent_65%)] pointer-events-none"
            aria-hidden
          />

          <div
            className={`relative w-full flex-1 flex items-center justify-center select-none touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ perspective: '1100px', perspectiveOrigin: '50% 50%' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            role="img"
            aria-label="Interaktive GoofyCoin-Vorschau – halten und ziehen zum Drehen"
          >
            <div
              className="relative will-change-transform"
              style={{
                width: COIN_SIZE,
                height: COIN_SIZE,
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transition: isDragging ? 'none' : 'transform 120ms ease-out',
              }}
            >
              {/* Coin edge (gold ring) */}
              <div
                className="absolute inset-[6%] rounded-full"
                style={{
                  transform: `translateZ(0px)`,
                  background:
                    'linear-gradient(135deg, #fde68a 0%, #f59e0b 35%, #b45309 70%, #92400e 100%)',
                  boxShadow: 'inset 0 0 24px rgba(0,0,0,0.35)',
                }}
                aria-hidden
              />

              {/* Front face */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  transform: `translateZ(${COIN_DEPTH}px)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  boxShadow: '0 12px 40px rgba(250, 204, 21, 0.35)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={GOOFYCOIN_ICON_SRC}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-contain drop-shadow-2xl pointer-events-none"
                />
              </div>

              {/* Back face */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden brightness-90"
                style={{
                  transform: `rotateY(180deg) translateZ(${COIN_DEPTH}px)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={GOOFYCOIN_ICON_SRC}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-contain scale-x-[-1] pointer-events-none"
                />
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-3 text-center text-xs sm:text-sm text-gray-400">
            {isDragging ? 'Loslassen zum Weiterdrehen' : 'Halten & ziehen — horizontal & vertikal drehen'}
          </p>
        </div>

        {/* Description */}
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

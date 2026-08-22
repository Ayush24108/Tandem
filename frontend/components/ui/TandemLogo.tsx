'use client'

import { useState } from 'react'
import Image from 'next/image'
import MetallicPaint from '@/components/ui/MetallicPaint'

interface TandemLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showText?: boolean
  withMetallic?: boolean
  className?: string
}

export default function TandemLogo({
  size = 'md',
  showText = true,
  withMetallic = false,
  className = ''
}: TandemLogoProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeDimensions = {
    sm: { icon: 28, text: 'text-xs', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-sm', sub: 'text-[10px]' },
    lg: { icon: 48, text: 'text-base', sub: 'text-xs' },
    hero: { icon: 72, text: 'text-2xl', sub: 'text-xs' },
  }

  const { icon, text, sub } = sizeDimensions[size]

  return (
    <div
      className={`flex items-center gap-3 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Emblem */}
      <div
        className="relative rounded-2xl overflow-hidden flex items-center justify-center bg-[#070b14] border border-blue-500/30 shadow-lg shadow-blue-500/20 group-hover:border-blue-400/60 transition-all flex-shrink-0"
        style={{ width: icon, height: icon }}
      >
        {withMetallic ? (
          <div className="absolute inset-0 w-full h-full p-0.5">
            <MetallicPaint
              imageSrc="/tandem-glyph.svg"
              seed={42}
              scale={3}
              patternSharpness={1.2}
              noiseScale={0.5}
              speed={0.4}
              liquid={0.65}
              mouseAnimation={false}
              brightness={1.8}
              contrast={0.6}
              refraction={0.015}
              blur={0.012}
              chromaticSpread={2}
              fresnel={1.2}
              angle={25}
              waveAmplitude={1}
              distortion={0.8}
              contour={0.3}
              lightColor="#ffffff"
              darkColor="#0b101d"
              tintColor="#3b82f6"
            />
          </div>
        ) : (
          <Image
            src="/tandem-logo.png"
            alt="Tandem Logo"
            width={icon}
            height={icon}
            className="w-full h-full object-cover rounded-xl"
            priority
          />
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-extrabold tracking-wider text-white leading-none ${text}`}>
              TANDEM
            </span>
            <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              v1.0
            </span>
          </div>
          <span className={`text-slate-400 font-medium tracking-wide block mt-0.5 ${sub}`}>
            Understand Together. Build Better.
          </span>
        </div>
      )}
    </div>
  )
}

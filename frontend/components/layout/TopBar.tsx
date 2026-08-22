'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Mic, Radio } from 'lucide-react'
import NfcTouchpointModal from '@/components/features/NfcTouchpointModal'
import TandemLogo from '@/components/ui/TandemLogo'

interface TopBarProps {
  title?: string
  subtitle?: string
  actionSlot?: React.ReactNode
}

export function TopBar({ title = 'Workspace', subtitle, actionSlot }: TopBarProps) {
  const [isNfcOpen, setIsNfcOpen] = useState(false)

  return (
    <>
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-md flex-shrink-0 sticky top-0 z-20">
        {/* Breadcrumbs with Tandem Emblem */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 font-medium transition-colors">
            <TandemLogo size="sm" showText={false} withMetallic={false} />
            <span>Tandem</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <span className="text-slate-200 font-semibold">{title}</span>
          {subtitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <span className="text-slate-400 font-medium">{subtitle}</span>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* NFC Hardware Sync Button */}
          <button
            onClick={() => setIsNfcOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all shadow-xs"
            title="NFC Hardware Badge & Room Touchpoint"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span className="hidden md:inline">NFC Sync</span>
          </button>

          {actionSlot ? (
            actionSlot
          ) : (
            <Link
              href="/meeting"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:bg-blue-700 transition-all"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>New Meeting</span>
            </Link>
          )}
        </div>
      </header>

      {/* NFC Modal */}
      <NfcTouchpointModal
        isOpen={isNfcOpen}
        onClose={() => setIsNfcOpen(false)}
        userName="Kangna (Lead Frontend)"
        projectName={subtitle || title}
      />
    </>
  )
}

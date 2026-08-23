'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Mic,
  Radio,
  User,
  Volume2,
  Sparkles,
  Video,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import NfcTouchpointModal from '@/components/features/NfcTouchpointModal'
import VoiceEnrollmentModal from '@/components/features/VoiceEnrollmentModal'
import TandemLogo from '@/components/ui/TandemLogo'
import { getCurrentUser, clearSession, AuthSession } from '@/lib/api/auth'
import { getActiveUser, VoiceProfile } from '@/lib/api/voiceProfiles'

interface TopBarProps {
  title?: string
  subtitle?: string
  actionSlot?: React.ReactNode
}

export function TopBar({ title = 'Workspace', subtitle, actionSlot }: TopBarProps) {
  const router = useRouter()
  const [isNfcOpen, setIsNfcOpen] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [activeVoice, setActiveVoice] = useState<VoiceProfile | null>(null)

  useEffect(() => {
    async function loadAuth() {
      const cur = await getCurrentUser()
      setSession(cur)
      setActiveVoice(getActiveUser())
    }
    loadAuth()
  }, [])

  const handleUserEnrolled = (profile: VoiceProfile) => {
    setActiveVoice(profile)
  }

  const handleLogout = () => {
    clearSession()
    router.push('/auth')
  }

  const userDisplayName = session?.user?.name || activeVoice?.name || 'Manit Sharma'
  const userInitials = session?.user?.initials || activeVoice?.initials || 'MS'
  const userNfc = session?.user?.nfc_id || activeVoice?.nfcToken || 'TDM-001'

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-white/[0.08] bg-[#070b14]/85 backdrop-blur-md shrink-0 sticky top-0 z-20">
        {/* Left: Brand + Navigation Breadcrumbs */}
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white font-bold transition-colors">
            <TandemLogo size="sm" showText={false} withMetallic={false} />
            <span className="hidden sm:inline">Tandem</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          
          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/dashboard"
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/meetings"
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Meetings
            </Link>
            <Link
              href="/workspace"
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors hidden md:inline"
            >
              Workspace
            </Link>
          </nav>
        </div>

        {/* Right: User Identity & Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Active User Voiceprint Badge */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-blue-500/40 hover:bg-white/[0.08] transition-all text-xs"
            title="Manage Registered Voiceprints & NFC Identity"
          >
            <div className={`w-5 h-5 rounded-full ${session?.user?.avatar_color || 'bg-purple-600 text-white'} flex items-center justify-center text-[10px] font-bold`}>
              {userInitials}
            </div>
            <span className="font-semibold text-slate-200 hidden sm:inline">
              {userDisplayName.split(' ')[0]}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              <span>{userNfc}</span>
            </div>
          </button>

          {/* Quick NFC hardware sync modal trigger */}
          <button
            onClick={() => setIsNfcOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all shadow-xs"
            title="NFC Hardware Badge & Touchpoint"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>NFC Tap</span>
          </button>

          {/* New Meeting CTA */}
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online Meeting</span>
          </Link>
        </div>
      </header>

      {/* NFC Modal */}
      <NfcTouchpointModal
        isOpen={isNfcOpen}
        onClose={() => setIsNfcOpen(false)}
        userName={userDisplayName}
        projectName={subtitle || title}
      />

      {/* Voice Enrollment Modal */}
      <VoiceEnrollmentModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onEnrolled={handleUserEnrolled}
      />
    </>
  )
}

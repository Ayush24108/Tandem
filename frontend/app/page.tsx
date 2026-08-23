import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Mic,
  ShieldCheck,
  Radio,
  Users,
} from 'lucide-react'
import FaultyTerminal from '@/components/ui/FaultyTerminal'
import InteractiveBentoGrid from '@/components/ui/InteractiveBentoGrid'
import TandemLogo from '@/components/ui/TandemLogo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* ── Background Faulty Terminal WebGL Canvas ─────────────────────────── */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-auto">
        <FaultyTerminal
          scale={1.4}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.8}
          pause={false}
          scanlineIntensity={0.6}
          glitchAmount={0.7}
          flickerAmount={0.5}
          noiseAmp={0.7}
          chromaticAberration={0}
          dither={0}
          curvature={0.08}
          tint="#3b82f6"
          mouseReact={true}
          mouseStrength={0.45}
          pageLoadAnimation={false}
          brightness={0.85}
        />
      </div>

      {/* Ambient Gradient Overlays for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/70 via-[#070b14]/85 to-[#070b14] pointer-events-none z-1" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-blue-600/15 blur-[120px] pointer-events-none z-1" />

      {/* ── Top Navigation with MetallicPaint Logo ──────────────────────────── */}
      <header className="h-20 border-b border-white/[0.08] px-8 flex items-center justify-between max-w-7xl w-full mx-auto backdrop-blur-md bg-[#070b14]/60 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3">
          <TandemLogo size="lg" withMetallic={true} showText={true} />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Enter Tandem</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-24 max-w-6xl mx-auto text-center relative z-10">
        {/* Top Hero Brand Tag */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-slate-200 text-xs font-semibold shadow-sm backdrop-blur-md hover:border-blue-400/50 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-white">Tandem is the shared AI memory layer for distributed teams.</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mb-6">
          Turn team conversations into{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            persistent project intelligence.
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed mb-10">
          NFC ID authentication, voice biometric verification, remote online meetings, and continuous architectural state synthesis for high-velocity engineering teams.
        </p>

        {/* CTA Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full justify-center">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-xl shadow-blue-600/35 hover:bg-blue-500 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/[0.07] border border-white/[0.15] text-slate-200 text-sm font-semibold shadow-sm hover:bg-white/[0.12] hover:border-white/30 backdrop-blur-md transition-all w-full sm:w-auto"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Open Team Dashboard</span>
          </Link>
        </div>

        {/* ── High-Density Interactive Bento Matrix with PixelSwap ───────────── */}
        <div className="w-full max-w-6xl mx-auto mb-20 text-left">
          <div className="flex items-center justify-between mb-5 px-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-blue-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTERACTIVE CAPABILITY MATRIX</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Live Intelligence Engine
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="hidden sm:inline">Hover cards for</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">PixelSwap</span>
            </div>
          </div>

          <InteractiveBentoGrid />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 px-6 text-center text-xs text-slate-500 bg-[#070b14] relative z-10">
        <p>Tandem — Understand Together. Build Better.</p>
      </footer>
    </div>
  )
}

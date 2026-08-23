'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Radio,
  Mic,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Lock,
  Sparkles,
  Volume2,
} from 'lucide-react'
import TandemLogo from '@/components/ui/TandemLogo'
import {
  identifyByNfc,
  verifyVoice,
  demoLogin,
  TandemUser,
  TandemTeam,
} from '@/lib/api/auth'
import { analyzeAudioFrequencies } from '@/lib/api/voiceProfiles'

type AuthStep = 'nfc' | 'voice' | 'authenticating' | 'success'

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<AuthStep>('nfc')
  const [nfcInput, setNfcInput] = useState('')
  const [isScanningNfc, setIsScanningNfc] = useState(false)
  const [identifiedUser, setIdentifiedUser] = useState<TandemUser | null>(null)
  const [identifiedTeam, setIdentifiedTeam] = useState<TandemTeam | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Voice Verification State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceCountdown, setVoiceCountdown] = useState(3)
  const [liveFreqHz, setLiveFreqHz] = useState(180)
  const [voiceConfidence, setVoiceConfidence] = useState<number | null>(null)
  const [liveBars, setLiveBars] = useState<number[]>([25, 45, 75, 30, 85, 50, 65, 90, 35, 55, 80, 40])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Web NFC Scanner Handler (if supported on Android/Chrome)
  const handleWebNfcScan = async () => {
    setErrorMsg(null)
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        setIsScanningNfc(true)
        const ndef = new (window as any).NDEFReader()
        await ndef.scan()
        ndef.onreading = async (event: any) => {
          const serialNumber = event.serialNumber || 'TDM-001'
          setIsScanningNfc(false)
          await handleIdentifyNfc(serialNumber)
        }
      } catch (err: any) {
        setIsScanningNfc(false)
        setErrorMsg('NFC scanning error or permission denied. Please select a Demo ID Card below.')
      }
    } else {
      setIsScanningNfc(false)
      setErrorMsg('Web NFC is not supported on this browser. Please use the simulated NFC ID Card selector below.')
    }
  }

  // Handle NFC Identification
  const handleIdentifyNfc = async (nfcIdToIdentify: string) => {
    setErrorMsg(null)
    const targetId = nfcIdToIdentify || nfcInput.trim()
    if (!targetId) {
      setErrorMsg('Please tap or select a valid Tandem ID Card.')
      return
    }

    const res = await identifyByNfc(targetId)
    if (res.success && res.user) {
      setIdentifiedUser(res.user)
      setIdentifiedTeam(res.team || { id: 'team-tandem-1', name: 'Tandem Development Team' })
      setStep('voice')
    } else {
      setErrorMsg(res.error || 'Tandem ID Card not recognized in enterprise registry.')
    }
  }

  // Start Voice Verification
  const handleStartVoiceVerification = async () => {
    if (!identifiedUser) return
    setErrorMsg(null)
    setIsRecordingVoice(true)
    setVoiceCountdown(3)

    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioCtxRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        let measuredF0 = 180

        const trackPitch = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          const analysis = analyzeAudioFrequencies(dataArray, audioCtx.sampleRate)
          if (analysis.energy > 10) {
            setLiveFreqHz(analysis.fundamentalFreq)
            measuredF0 = analysis.fundamentalFreq
          }

          const bars: number[] = []
          for (let i = 0; i < 12; i++) {
            bars.push(Math.min(100, Math.max(15, (dataArray[i * 2] || 20))))
          }
          setLiveBars(bars)
          animFrameRef.current = requestAnimationFrame(trackPitch)
        }

        trackPitch()

        // Countdown 3 seconds
        let count = 3
        const interval = setInterval(() => {
          count -= 1
          setVoiceCountdown(count)
          if (count <= 0) {
            clearInterval(interval)
            // Stop mic
            stream.getTracks().forEach(t => t.stop())
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
              audioCtxRef.current.close()
            }
            finishVoiceVerification(measuredF0)
          }
        }, 1000)
      } else {
        // Direct simulation
        setTimeout(() => {
          finishVoiceVerification(180)
        }, 2000)
      }
    } catch (err) {
      console.warn('[Tandem] Voice verification capture error:', err)
      // Fallback verification
      setTimeout(() => {
        finishVoiceVerification(180)
      }, 1500)
    }
  }

  const finishVoiceVerification = async (detectedF0: number) => {
    setIsRecordingVoice(false)
    setStep('authenticating')

    if (!identifiedUser) return
    const res = await verifyVoice(identifiedUser.id, detectedF0)
    if (res.success) {
      setVoiceConfidence(0.96)
      setStep('success')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } else {
      setErrorMsg(res.error || 'Voice verification failed.')
      setStep('voice')
    }
  }

  // 1-Click Demo Login Handler for Judges
  const handleQuickDemoLogin = async (userId: string) => {
    setErrorMsg(null)
    setStep('authenticating')
    const res = await demoLogin(userId)
    if (res.success && res.session) {
      setIdentifiedUser(res.session.user)
      setIdentifiedTeam(res.session.team)
      setStep('success')
      setTimeout(() => {
        router.push('/dashboard')
      }, 900)
    } else {
      setErrorMsg('Demo authentication failed.')
      setStep('nfc')
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="h-20 border-b border-white/[0.08] px-8 flex items-center justify-between max-w-6xl w-full mx-auto backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3">
          <TandemLogo size="md" withMetallic={true} showText={true} />
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:bg-white/[0.12] transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Register New Member</span>
        </Link>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full bg-[#0b101d]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              WELCOME TO TANDEM
            </h1>
            <p className="text-xs text-slate-400">
              Access your workspace using your Tandem ID Card &amp; Voice Verification.
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STEP 1: NFC IDENTITY CARD TAP / SELECTION
              ───────────────────────────────────────────────────────── */}
          {step === 'nfc' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto animate-pulse">
                  <Radio className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Tap Tandem ID Card</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hold your physical badge against your device reader.
                  </p>
                </div>

                <button
                  onClick={handleWebNfcScan}
                  disabled={isScanningNfc}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Radio className={`w-4 h-4 ${isScanningNfc ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>{isScanningNfc ? 'Listening for NFC Card...' : 'TAP ID CARD'}</span>
                </button>
              </div>

              {/* DEMO ID CARD FALLBACK FOR JUDGES */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>OR SELECT DEMO ID CARD:</span>
                  <span className="text-emerald-400 font-bold">1-Click</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleIdentifyNfc('TDM-001')}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-center group"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                      MS
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-purple-300">Manit</p>
                    <p className="text-[9px] font-mono text-slate-500">TDM-001</p>
                  </button>

                  <button
                    onClick={() => handleIdentifyNfc('TDM-002')}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-center group"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                      AY
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-cyan-300">Ayyush</p>
                    <p className="text-[9px] font-mono text-slate-500">TDM-002</p>
                  </button>

                  <button
                    onClick={() => handleIdentifyNfc('TDM-003')}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-center group"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                      KA
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-indigo-300">Kangna</p>
                    <p className="text-[9px] font-mono text-slate-500">TDM-003</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STEP 2: VOICE BIOMETRIC VERIFICATION
              ───────────────────────────────────────────────────────── */}
          {step === 'voice' && identifiedUser && (
            <div className="space-y-5 animate-in fade-in">
              {/* Identified User Badge */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${identifiedUser.avatar_color || 'bg-blue-600 text-white'} flex items-center justify-center font-bold text-sm shadow-md`}>
                    {identifiedUser.initials || 'TD'}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{identifiedUser.name}</h2>
                    <p className="text-[11px] text-slate-400">{identifiedUser.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded font-bold">
                    {identifiedUser.nfc_id}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{identifiedTeam?.name}</p>
                </div>
              </div>

              {/* Voice Verification Section */}
              <div className="p-6 rounded-2xl bg-[#070b14]/80 border border-blue-500/20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">VOICE VERIFICATION</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                    &ldquo;Verify your identity using your registered voice.&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Say: &ldquo;Hello, confirming my Tandem session.&rdquo;
                  </p>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-12 px-4">
                  {liveBars.map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-75"
                      style={{ height: isRecordingVoice ? `${height}%` : '20%' }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleStartVoiceVerification}
                  disabled={isRecordingVoice}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Mic className={`w-4 h-4 ${isRecordingVoice ? 'animate-ping' : ''}`} />
                  <span>
                    {isRecordingVoice
                      ? `Listening... (${voiceCountdown}s)`
                      : 'START VOICE VERIFICATION'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <button
                  onClick={() => setStep('nfc')}
                  className="hover:text-white transition-colors"
                >
                  ← Switch ID Card
                </button>
                <button
                  onClick={() => handleQuickDemoLogin(identifiedUser.id)}
                  className="text-blue-400 hover:underline font-mono text-[11px]"
                >
                  Bypass (Judge Demo Mode) →
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STATE 3: AUTHENTICATING SPINNER
              ───────────────────────────────────────────────────────── */}
          {step === 'authenticating' && (
            <div className="py-10 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
              <div>
                <h2 className="text-base font-extrabold text-white">Validating Voice Biometrics...</h2>
                <p className="text-xs text-slate-400 mt-1">Establishing authenticated enterprise session</p>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STATE 4: SUCCESS CONFIRMATION
              ───────────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Identity Verified</h2>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  Welcome, {identifiedUser?.name || 'Engineer'}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Redirecting to personalized workspace...</p>
            </div>
          )}

          {/* Bottom Register CTA */}
          <div className="pt-4 border-t border-white/[0.08] text-center">
            <p className="text-xs text-slate-400">
              Don&apos;t have an NFC badge yet?{' '}
              <Link href="/auth/signup" className="text-blue-400 font-bold hover:underline">
                Register Team Member
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

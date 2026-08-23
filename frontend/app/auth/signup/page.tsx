'use client'

import { useState, useRef } from 'react'
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
  User,
  Briefcase,
  Users,
  Sparkles,
} from 'lucide-react'
import TandemLogo from '@/components/ui/TandemLogo'
import { signupTeamMember } from '@/lib/api/auth'
import { analyzeAudioFrequencies } from '@/lib/api/voiceProfiles'

type SignupStep = 'details' | 'voice' | 'enrolling' | 'success'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>('details')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [teamName, setTeamName] = useState('Tandem Development Team')
  const [nfcId, setNfcId] = useState(`TDM-00${Math.floor(Math.random() * 90) + 10}`)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [voiceCountdown, setVoiceCountdown] = useState(3)
  const [liveFreqHz, setLiveFreqHz] = useState(200)
  const [liveBars, setLiveBars] = useState<number[]>([30, 50, 80, 40, 90, 60, 75, 95, 35, 65, 85, 45])
  const [enrolledVoiceProfile, setEnrolledVoiceProfile] = useState<any>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const handleProceedToVoice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) {
      setErrorMsg('Please enter your full name and engineering role.')
      return
    }
    setErrorMsg(null)
    setStep('voice')
  }

  // Voice Sample Capture
  const handleStartVoiceEnrollment = async () => {
    setErrorMsg(null)
    setIsRecording(true)
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

        let measuredF0 = 205
        let measuredCentroid = 2200

        const trackPitch = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          const analysis = analyzeAudioFrequencies(dataArray, audioCtx.sampleRate)
          if (analysis.energy > 10) {
            setLiveFreqHz(analysis.fundamentalFreq)
            measuredF0 = analysis.fundamentalFreq
            measuredCentroid = analysis.spectralCentroid
          }

          const bars: number[] = []
          for (let i = 0; i < 12; i++) {
            bars.push(Math.min(100, Math.max(15, (dataArray[i * 2] || 20))))
          }
          setLiveBars(bars)
          animFrameRef.current = requestAnimationFrame(trackPitch)
        }

        trackPitch()

        let count = 3
        const interval = setInterval(() => {
          count -= 1
          setVoiceCountdown(count)
          if (count <= 0) {
            clearInterval(interval)
            stream.getTracks().forEach(t => t.stop())
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
              audioCtxRef.current.close()
            }
            finishEnrollment({ f0: measuredF0, centroid: measuredCentroid })
          }
        }, 1000)
      } else {
        setTimeout(() => {
          finishEnrollment({ f0: 210, centroid: 2300 })
        }, 2500)
      }
    } catch (err) {
      console.warn('[Tandem] Microphone enrollment error:', err)
      setTimeout(() => {
        finishEnrollment({ f0: 210, centroid: 2300 })
      }, 1500)
    }
  }

  const finishEnrollment = async (voiceProfile: { f0: number; centroid: number }) => {
    setIsRecording(false)
    setEnrolledVoiceProfile(voiceProfile)
    setStep('enrolling')

    const res = await signupTeamMember({
      name: name.trim(),
      role: role.trim(),
      nfc_id: nfcId.trim(),
      voice_profile: voiceProfile,
    })

    if (res.success) {
      setStep('success')
    } else {
      setErrorMsg(res.error || 'Registration failed.')
      setStep('details')
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="h-20 border-b border-white/[0.08] px-8 flex items-center justify-between max-w-6xl w-full mx-auto backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3">
          <TandemLogo size="md" withMetallic={true} showText={true} />
        </Link>
        <Link
          href="/auth"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Already have an ID Card? <strong className="text-blue-400">Sign In →</strong>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full bg-[#0b101d]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Top Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-md shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              REGISTER TEAM MEMBER
            </h1>
            <p className="text-xs text-slate-400">
              Provision your enterprise NFC badge and enroll your vocal frequency print.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STEP 1: DETAILS & NFC BADGE ASSIGNMENT
              ───────────────────────────────────────────────────────── */}
          {step === 'details' && (
            <form onSubmit={handleProceedToVoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manit Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070b14] border border-white/[0.1] text-sm text-white focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Engineering Role</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Backend Lead"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070b14] border border-white/[0.1] text-sm text-white focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Team / Organization</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={teamName}
                  className="w-full px-4 py-3 rounded-xl bg-[#070b14]/50 border border-white/[0.06] text-xs font-mono text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* NFC Badge Token Auto-Assigned */}
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-white">NFC Hardware Token</p>
                    <p className="text-[10px] text-slate-400">Unique Identity Tag</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/30">
                  {nfcId}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Voice Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────
              STEP 2: VOICE REGISTRATION (Record Phrase)
              ───────────────────────────────────────────────────────── */}
          {step === 'voice' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-[#070b14]/80 border border-cyan-500/20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/30">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">VOICE REGISTRATION</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                    Please read aloud the verification phrase:
                  </p>
                  <div className="mt-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-cyan-300 italic">
                    &ldquo;Hello, I am registering my Tandem identity.&rdquo;
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-12 px-4">
                  {liveBars.map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-75"
                      style={{ height: isRecording ? `${height}%` : '20%' }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleStartVoiceEnrollment}
                  disabled={isRecording}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Mic className={`w-4 h-4 ${isRecording ? 'animate-ping' : ''}`} />
                  <span>
                    {isRecording ? `Recording Voice Sample (${voiceCountdown}s)...` : 'START VOICE REGISTRATION'}
                  </span>
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep('details')}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← Edit Details
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STATE 3: ENROLLING SPINNER
              ───────────────────────────────────────────────────────── */}
          {step === 'enrolling' && (
            <div className="py-10 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <div>
                <h2 className="text-base font-extrabold text-white">Creating Tandem User...</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Associating NFC ID + Voice representation + Team Workspace
                </p>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              STATE 4: SUCCESS
              ───────────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Registration Successful!</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Welcome to Tandem, <strong>{name}</strong>
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  NFC ID: {nfcId} • Role: {role}
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>ENTER TANDEM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

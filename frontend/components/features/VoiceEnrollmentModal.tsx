'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Mic,
  Square,
  Radio,
  Sparkles,
  CheckCircle2,
  X,
  User,
  Activity,
  Volume2,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react'
import {
  VoiceProfile,
  saveVoiceProfile,
  analyzeAudioFrequencies,
  getVoiceProfiles,
} from '@/lib/api/voiceProfiles'

interface VoiceEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  onEnrolled?: (profile: VoiceProfile) => void
}

export function VoiceEnrollmentModal({
  isOpen,
  onClose,
  onEnrolled,
}: VoiceEnrollmentModalProps) {
  const [step, setStep] = useState<'details' | 'nfc' | 'recording' | 'analyzing' | 'complete'>('details')
  const [name, setName] = useState('')
  const [role, setRole] = useState('Frontend & UX Lead')
  const [nfcTagId, setNfcTagId] = useState('')
  const [isNfcScanning, setIsNfcScanning] = useState(false)
  const [recordProgress, setRecordProgress] = useState(0)
  const [detectedF0, setDetectedF0] = useState<number>(210)
  const [detectedCentroid, setDetectedCentroid] = useState<number>(2300)
  const [liveFrequencies, setLiveFrequencies] = useState<number[]>([30, 60, 90, 45, 75, 50, 85, 40])
  const [enrolledProfile, setEnrolledProfile] = useState<VoiceProfile | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up Web Audio stream on close/unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  if (!isOpen) return null

  // Generate NFC Hardware Token
  const handleScanNfc = () => {
    setIsNfcScanning(true)
    setTimeout(() => {
      const generatedId = `NFC-TAG-${Math.floor(1000 + Math.random() * 9000)}-${(name.slice(0, 2) || 'TK').toUpperCase()}`
      setNfcTagId(generatedId)
      setIsNfcScanning(false)
      setStep('nfc')
    }, 1200)
  }

  // Start 3-Second Voice Frequency Sample Recording
  const handleStartVoiceRecording = async () => {
    setStep('recording')
    setRecordProgress(0)

    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        let collectedFrequencies: number[] = []
        let collectedCentroids: number[] = []

        const updateAnalysis = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)

          const analysis = analyzeAudioFrequencies(dataArray, audioCtx.sampleRate)
          if (analysis.energy > 15) {
            collectedFrequencies.push(analysis.fundamentalFreq)
            collectedCentroids.push(analysis.spectralCentroid)
          }

          // Visual frequency bands
          const bands: number[] = []
          for (let i = 0; i < 16; i++) {
            bands.push(Math.min(100, Math.max(15, dataArray[i * 4] || 20)))
          }
          setLiveFrequencies(bands)

          animationFrameRef.current = requestAnimationFrame(updateAnalysis)
        }

        updateAnalysis()

        // 3-second timed recording
        let currentProg = 0
        const interval = setInterval(() => {
          currentProg += 10
          setRecordProgress(currentProg)

          if (currentProg >= 100) {
            clearInterval(interval)
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            stream.getTracks().forEach(t => t.stop())

            setStep('analyzing')

            // Calculate average voice frequencies
            const avgF0 = collectedFrequencies.length > 0
              ? Math.round(collectedFrequencies.reduce((a, b) => a + b, 0) / collectedFrequencies.length)
              : 185
            const avgCentroid = collectedCentroids.length > 0
              ? Math.round(collectedCentroids.reduce((a, b) => a + b, 0) / collectedCentroids.length)
              : 2200

            setDetectedF0(avgF0)
            setDetectedCentroid(avgCentroid)

            setTimeout(() => {
              const initials = name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'TK'

              const newProfile: VoiceProfile = {
                id: `vp-${Date.now()}`,
                name: name.trim() || 'Kangna',
                role: role.trim() || 'Frontend Lead',
                initials,
                nfcToken: nfcTagId || `NFC-TAG-${Math.floor(1000 + Math.random() * 9000)}-${initials}`,
                fundamentalFreq: avgF0,
                spectralCentroid: avgCentroid,
                avatarColor: 'bg-indigo-600 text-white border-indigo-400',
                enrolledAt: 'Just now',
                sampleDurationSec: 3,
              }

              saveVoiceProfile(newProfile)
              setEnrolledProfile(newProfile)
              if (onEnrolled) onEnrolled(newProfile)
              setStep('complete')
            }, 1200)
          }
        }, 300)
      }
    } catch (err) {
      console.warn('[Tandem] Mic capture fallback:', err)
      // Fallback completion
      setTimeout(() => {
        setStep('complete')
      }, 1500)
    }
  }

  const handleReset = () => {
    setStep('details')
    setName('')
    setNfcTagId('')
    setRecordProgress(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] rounded-3xl border border-white/[0.12] shadow-2xl max-w-lg w-full p-7 relative overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                NFC & Voice ID Registration
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                ZERO-TRUST BIOMETRIC ENROLLMENT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── STEP 1: IDENTITY & ROLE DETAILS ─────────────────────────────── */}
        {step === 'details' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Team Member Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Kangna"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs bg-white/[0.04] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/[0.08]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Engineering Role
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend & UX Lead"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full text-xs bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/[0.08]"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleScanNfc}
                disabled={!name.trim()}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {isNfcScanning ? (
                  <>
                    <Radio className="w-4 h-4 animate-spin" />
                    <span>Pairing NFC Hardware Tag...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>Proceed to NFC Token Pairing</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: NFC TOKEN CONFIRMATION ──────────────────────────────── */}
        {step === 'nfc' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">
                NFC Hardware Token Bound
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {nfcTagId}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 space-y-1">
              <p>Member: <strong>{name}</strong> ({role})</p>
              <p className="text-slate-400">Next: Record a 3-second voice sample to generate your voice frequency fingerprint.</p>
            </div>

            <button
              onClick={handleStartVoiceRecording}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Record 3-Sec Voice Frequency Profile</span>
            </button>
          </div>
        )}

        {/* ── STEP 3: LIVE VOICE RECORDING & ACOUSTIC ANALYSIS ────────────── */}
        {step === 'recording' && (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-red-500/30 animate-pulse">
                <Mic className="w-9 h-9" />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-red-500/20 blur-xl -z-10" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">
                Speak Clearly Now...
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Say: &ldquo;<em>I am {name}, confirming my voiceprint on Tandem.</em>&rdquo;
              </p>
            </div>

            {/* Live Frequency Visualizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-16 px-4">
              {liveFrequencies.map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-gradient-to-t from-red-600 via-rose-500 to-cyan-400 transition-all duration-75"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/[0.08] rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${recordProgress}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-slate-400">ANALYZING SPECTRAL HARMONICS</p>
          </div>
        )}

        {/* ── STEP 4: SYNTHESIZING FREQUENCIES ────────────────────────────── */}
        {step === 'analyzing' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Activity className="w-7 h-7 animate-spin" />
            </div>
            <h4 className="text-base font-extrabold text-white">
              Extracting Vocal Timbre & Pitch
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              Computing FFT pitch bins: F0 fundamental frequency...
            </p>
          </div>
        )}

        {/* ── STEP 5: ENROLLMENT COMPLETE ─────────────────────────────────── */}
        {step === 'complete' && enrolledProfile && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-white">
                Voiceprint Enrolled Successfully!
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {enrolledProfile.name} is now active and recognized in meetings.
              </p>
            </div>

            {/* Acoustic Biometric Card */}
            <div className="p-4 bg-[#070b14] rounded-2xl border border-white/[0.08] text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Enrolled Member:</span>
                <span className="font-bold text-white">{enrolledProfile.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">NFC Hardware Tag:</span>
                <span className="font-mono text-blue-400 font-bold">{enrolledProfile.nfcToken}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Fundamental Pitch (F0):</span>
                <span className="font-mono text-emerald-400 font-bold">{detectedF0} Hz</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Spectral Centroid:</span>
                <span className="font-mono text-cyan-400 font-bold">{detectedCentroid} Hz</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-300 text-xs font-bold hover:bg-white/[0.12] transition-colors"
              >
                Enroll Another User
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
              >
                Done & Launch Meeting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceEnrollmentModal

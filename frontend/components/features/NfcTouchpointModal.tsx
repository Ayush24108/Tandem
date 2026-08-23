'use client'

import { useState } from 'react'
import { Wifi, Smartphone, CheckCircle2, ShieldCheck, Zap, X, Radio, ArrowRight } from 'lucide-react'

interface NfcTouchpointModalProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  projectName?: string
}

export function NfcTouchpointModal({
  isOpen,
  onClose,
  userName = 'Kangna (You)',
  projectName = 'Project Alpha'
}: NfcTouchpointModalProps) {
  const [scanning, setScanning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tapId, setTapId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSimulateNfcTap = () => {
    setScanning(true)
    setSuccess(false)
    setTimeout(() => {
      setScanning(false)
      setSuccess(true)
      setTapId(`NFC-TDM-8492-${Math.floor(1000 + Math.random() * 9000)}`)
    }, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-white/[0.12] rounded-3xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden text-slate-100">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] text-slate-400 flex items-center justify-center hover:bg-white/[0.12] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">
              NFC Physical Touchpoint
            </h3>
            <p className="text-xs text-slate-400">
              Hardware badge & meeting room tap-to-sync
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span>PROTOCOL: WebNFC NDEF / ISO 14443A</span>
            <span className="text-blue-400 font-bold">READY</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hold your mobile device or physical Tandem Smart Badge near an NFC checkpoint to instantaneously sync into <span className="font-semibold text-white">{projectName}</span>.
          </p>
        </div>

        {/* Interactive Tap Zone */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 mb-6">
          {success ? (
            <div className="text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-white mb-1">
                NFC Touchpoint Verified!
              </p>
              <p className="text-xs text-slate-400 font-mono mb-2">
                UID: {tapId}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>State synched to {userName}</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30 ${scanning ? 'animate-bounce' : ''}`}>
                <Smartphone className="w-7 h-7" />
              </div>
              <p className="text-xs font-semibold text-slate-300 mb-3">
                {scanning ? 'Reading NFC Card Tag...' : 'Ready for Physical Touch'}
              </p>
              <button
                onClick={handleSimulateNfcTap}
                disabled={scanning}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center gap-2 mx-auto active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                <span>{scanning ? 'Transmitting Data...' : 'Simulate NFC Tap'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-2 text-left mb-5">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px]">
            <span className="font-bold text-slate-200 block">Instant Presence</span>
            <span className="text-slate-400">Auto-marks attendance in audio stream</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px]">
            <span className="font-bold text-slate-200 block">Zero-Trust ID</span>
            <span className="text-slate-400">Hardware-bound cryptographic tag</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 text-white text-xs font-bold border border-white/[0.1] hover:bg-slate-700 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default NfcTouchpointModal


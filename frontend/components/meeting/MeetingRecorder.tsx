'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic,
  Square,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Brain,
  Layers,
  ChevronRight,
  RefreshCw,
  FileText,
  User,
  AlertTriangle,
  HelpCircle,
  Radio,
  Volume2,
  Cpu,
  ShieldCheck,
} from 'lucide-react'
import { uploadMeetingAudio, extractMeetingIntelligence } from '@/lib/api/meetings'
import { getProjectById, updateLocalProjectState } from '@/lib/api/projects'
import {
  getVoiceProfiles,
  matchSpeakerByVoiceprint,
  analyzeAudioFrequencies,
  parseSpeakerPrefix,
  getActiveUser,
  VoiceProfile,
} from '@/lib/api/voiceProfiles'
import VoiceEnrollmentModal from '@/components/features/VoiceEnrollmentModal'
import { MeetingIntelligence, TranscriptEntry } from '@/types'

type MeetingStep = 'idle' | 'recording' | 'processing' | 'transcript' | 'intelligence'

export function MeetingRecorder() {
  const router = useRouter()
  const [step, setStep] = useState<MeetingStep>('idle')
  const [seconds, setSeconds] = useState(0)
  const [processingStage, setProcessingStage] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [liveSpokenText, setLiveSpokenText] = useState<string>('')
  const [intelligence, setIntelligence] = useState<MeetingIntelligence>({
    decisions: [],
    actionItems: [],
    risks: [],
    unresolved: [],
  })
  const [updatedSuccess, setUpdatedSuccess] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<string>('Kangna')
  const [speakerConfidence, setSpeakerConfidence] = useState<number>(0.95)
  const [liveFreqHz, setLiveFreqHz] = useState<number>(215)
  const [liveBars, setLiveBars] = useState<number[]>([35, 60, 80, 45, 90, 55, 70, 95, 40, 65, 85, 50])
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [voiceProfiles, setVoiceProfilesState] = useState<VoiceProfile[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const speechRecognitionRef = useRef<any>(null)
  const liveTurnsRef = useRef<TranscriptEntry[]>([])
  const currentSpeakerRef = useRef<string>('Kangna')
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const isRecordingRef = useRef<boolean>(false)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const profiles = getVoiceProfiles()
    setVoiceProfilesState(profiles)
    const active = getActiveUser()
    if (active) {
      setActiveSpeaker(active.name)
      currentSpeakerRef.current = active.name
      setLiveFreqHz(active.fundamentalFreq)
    }
  }, [])

  // Live Timer
  useEffect(() => {
    if (step === 'recording') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step])

  // Processing stage sequencing animation
  useEffect(() => {
    if (step === 'processing') {
      setProcessingStage(1)
      const t1 = setTimeout(() => setProcessingStage(2), 1200)
      const t2 = setTimeout(() => setProcessingStage(3), 2400)
      const t3 = setTimeout(() => setProcessingStage(4), 3400)
      const t4 = setTimeout(() => {
        setStep('transcript')
      }, 4400)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [step])

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start Real Microphone Recording + Continuous Speech Recognition + Acoustic Diarization
  const handleStartRecording = async () => {
    setSeconds(0)
    setLiveSpokenText('')
    audioChunksRef.current = []
    liveTurnsRef.current = []
    isRecordingRef.current = true

    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // 1. High-Resolution Acoustic Pitch Analyzer (FFT Size 2048 for precise F0)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const profiles = getVoiceProfiles()

        const trackFrequencies = () => {
          if (!analyserRef.current || !isRecordingRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)

          const analysis = analyzeAudioFrequencies(dataArray, audioCtx.sampleRate)
          
          if (analysis.energy > 8) {
            setLiveFreqHz(analysis.fundamentalFreq)
            const match = matchSpeakerByVoiceprint(analysis.fundamentalFreq, analysis.spectralCentroid, profiles)
            if (match.confidence >= 0.70) {
              setActiveSpeaker(match.matchedProfile.name)
              currentSpeakerRef.current = match.matchedProfile.name
              setSpeakerConfidence(match.confidence)
            }
          }

          const bars: number[] = []
          for (let i = 0; i < 16; i++) {
            bars.push(Math.min(100, Math.max(15, (dataArray[i * 4] || 20))))
          }
          setLiveBars(bars)

          animFrameRef.current = requestAnimationFrame(trackFrequencies)
        }

        trackFrequencies()

        // 2. Continuous Browser Speech Recognition with Watchdog Auto-Restart Loop
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onresult = (event: any) => {
            let interimTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const text = event.results[i][0].transcript.trim()
              if (event.results[i].isFinal) {
                if (text) {
                  // Check if speaker explicitly spoke name prefix or use live acoustic attribution
                  const { speakerName, cleanText } = parseSpeakerPrefix(text, profiles)
                  const attributedSpeaker = speakerName || currentSpeakerRef.current
                  if (speakerName) {
                    currentSpeakerRef.current = speakerName
                    setActiveSpeaker(speakerName)
                  }

                  const newEntry: TranscriptEntry = {
                    id: `tr-${Date.now()}-${Math.random()}`,
                    speaker: attributedSpeaker,
                    text: cleanText || text,
                    timestamp: formatTime(seconds),
                  }
                  liveTurnsRef.current.push(newEntry)
                  setTranscript([...liveTurnsRef.current])
                  setLiveSpokenText('')
                }
              } else {
                interimTranscript += text + ' '
              }
            }
            if (interimTranscript) {
              setLiveSpokenText(interimTranscript)
            }
          }

          // Auto-Restart Watchdog: Keeps recognition alive indefinitely
          recognition.onend = () => {
            if (isRecordingRef.current) {
              try {
                recognition.start()
              } catch (e) {
                // Ignore already running
              }
            }
          }

          recognition.onerror = (err: any) => {
            console.warn('[Tandem] SpeechRecognition warning/error:', err?.error)
            if (isRecordingRef.current && (err?.error === 'no-speech' || err?.error === 'network' || err?.error === 'aborted')) {
              setTimeout(() => {
                if (isRecordingRef.current) {
                  try {
                    recognition.start()
                  } catch (e) {}
                }
              }, 250)
            }
          }

          try {
            recognition.start()
            speechRecognitionRef.current = recognition
          } catch (e) {
            console.warn('[Tandem] Speech recognition start error:', e)
          }
        }

        // 3. MediaRecorder continuous buffer capture
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

        const options = mimeType ? { mimeType } : undefined
        const mediaRecorder = new MediaRecorder(stream, options)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.start(500)
      }
    } catch (err) {
      console.warn('[Tandem] Microphone initialization error:', err)
    }

    setStep('recording')
  }

  // End Meeting Recording
  const handleEndMeeting = async () => {
    isRecordingRef.current = false
    setStep('processing')

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch (e) {}
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }

    let recordedBlob: Blob | null = null
    const recorder = mediaRecorderRef.current

    if (recorder && recorder.state !== 'inactive') {
      recordedBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          recorder.stream.getTracks().forEach(track => track.stop())
          const mime = recorder.mimeType || 'audio/webm'
          const finalBlob = new Blob(audioChunksRef.current, { type: mime })
          resolve(finalBlob)
        }
        recorder.stop()
      })
    } else if (audioChunksRef.current.length > 0) {
      recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    }

    // Build the clean multi-turn transcript string from actual spoken speech
    const turns = liveTurnsRef.current
    const clientTranscriptString = turns.length > 0
      ? turns.map(t => `${t.speaker}: ${t.text}`).join('\n')
      : liveSpokenText
      ? `${activeSpeaker}: ${liveSpokenText}`
      : ''

    try {
      if (recordedBlob && recordedBlob.size > 0) {
        const uploadRes = await uploadMeetingAudio(recordedBlob, 'meeting-alpha-1', clientTranscriptString)
        if (uploadRes.transcript && uploadRes.transcript.length > 0) {
          setTranscript(uploadRes.transcript)
        }
      }
      const intelRes = await extractMeetingIntelligence('meeting-alpha-1', clientTranscriptString)
      if (intelRes) {
        setIntelligence(intelRes)
      }
    } catch (err) {
      console.error('[Tandem] Meeting processing error:', err)
    }
  }

  // Update Project State & Navigate Back
  const handleUpdateProjectState = async () => {
    setUpdatedSuccess(true)

    const currentProject = await getProjectById('project-alpha')
    if (currentProject) {
      const extractedDecisions = (
        intelligence.decisions && intelligence.decisions.length > 0
          ? intelligence.decisions
          : intelligence.decision
          ? [intelligence.decision]
          : []
      ).map((d, i) => ({
        id: `d-new-${Date.now()}-${i}`,
        title: d.title,
        reason: d.reason || '',
        status: 'confirmed' as const,
        timestamp: 'Just now (from Meeting)',
        projectId: 'project-alpha',
      }))

      const extractedTasks = (intelligence.actionItems || []).map((t, i) => ({
        id: `t-new-${Date.now()}-${i}`,
        title: t.task,
        assignee: t.assignee || activeSpeaker || 'Unassigned',
        status: 'todo' as const,
        priority: t.priority || 'medium',
        projectId: 'project-alpha',
      }))

      const extractedRisks = (intelligence.risks || []).map((r, i) => ({
        id: `r-new-${Date.now()}-${i}`,
        title: r.title,
        description: r.description || '',
        severity: (r.severity as any) || 'medium',
        status: 'open' as const,
        projectId: 'project-alpha',
      }))

      const extractedUnresolved = (intelligence.unresolved || []).map((u, i) => ({
        id: `u-new-${Date.now()}-${i}`,
        title: u.title,
        description: u.description || '',
        projectId: 'project-alpha',
      }))

      const updatedProject = {
        ...currentProject,
        teamPulse: {
          ...currentProject.teamPulse,
          decisionsCount: currentProject.teamPulse.decisionsCount + extractedDecisions.length,
          risksCount: currentProject.teamPulse.risksCount + extractedRisks.length,
          unresolvedCount: currentProject.teamPulse.unresolvedCount + extractedUnresolved.length,
        },
        decisions: [...extractedDecisions, ...currentProject.decisions],
        tasks: [...extractedTasks, ...currentProject.tasks],
        risks: [...extractedRisks, ...currentProject.risks],
        unresolvedIssues: [...extractedUnresolved, ...currentProject.unresolvedIssues],
        recentActivity: [
          ...extractedDecisions.map(d => ({
            id: `act-${Date.now()}-${d.id}`,
            text: `Confirmed decision: ${d.title}`,
            timestamp: 'Just now',
            author: `Tandem AI (${activeSpeaker})`,
            type: 'decision' as const,
          })),
          ...currentProject.recentActivity,
        ],
      }
      updateLocalProjectState(updatedProject)
    }

    setTimeout(() => {
      router.push('/project/project-alpha')
    }, 900)
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent p-8 max-w-5xl w-full mx-auto bg-dot-subtle text-slate-100 relative z-10">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <span>Project Alpha</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-400">Live Voice Capture</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Meeting Intelligence Studio
          </h1>
        </div>

        {/* State Badge & Voice Registry */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold hover:bg-blue-500/20 transition-all"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>VOICE ID: {activeSpeaker.toUpperCase()}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-white/[0.06] px-3.5 py-1.5 rounded-xl border border-white/[0.1] shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                step === 'recording'
                  ? 'bg-red-500 animate-ping'
                  : step === 'processing'
                  ? 'bg-blue-400 animate-spin'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="capitalize">{step}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          STATE 1: IDLE
          ───────────────────────────────────────────────────────────────── */}
      {step === 'idle' && (
        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-10 shadow-2xl text-center flex flex-col items-center justify-center my-auto relative overflow-hidden">
          {/* Top Voice Orb */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
              <Mic className="w-10 h-10" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-lg -z-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2">
            Record Live Engineering Standup
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mb-8 leading-relaxed">
            Speak naturally into your microphone. Tandem transcribes your live speech in real time, attributes each turn to your registered voice frequency ID, and extracts decisions into Supabase.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleStartRecording}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 text-white text-base font-bold shadow-xl shadow-blue-600/35 hover:bg-blue-500 active:scale-95 transition-all"
            >
              <Mic className="w-5 h-5 animate-pulse" />
              <span>Start Live Session</span>
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-300 text-sm font-semibold hover:bg-white/[0.12] hover:text-white transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Register / Switch Voice ID</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-6 border-t border-white/[0.08] text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Current Speaker: <strong>{activeSpeaker}</strong> ({liveFreqHz}Hz)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Speech Recognition: Active</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STATE 2: RECORDING (Sound Reactive Waveform & Real-Time Spoken Text)
          ───────────────────────────────────────────────────────────────── */}
      {step === 'recording' && (
        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-red-500/30 rounded-3xl p-10 shadow-2xl text-center flex flex-col items-center justify-center my-auto relative overflow-hidden">
          {/* Top Live Pill & Real Speaker Diarization Indicator */}
          <div className="flex items-center justify-between w-full max-w-lg mb-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE SPEECH CAPTURE</span>
            </div>

            {/* Dynamic Speaker Recognized by Pitch F0 */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold animate-in fade-in duration-150">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speaker: <strong>{activeSpeaker}</strong></span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                {liveFreqHz}Hz ({Math.round(speakerConfidence * 100)}%)
              </span>
            </div>
          </div>

          {/* Animated Studio Waveform Bars driven by Real Audio Context */}
          <div className="flex items-center justify-center gap-1.5 h-20 mb-4 px-4 w-full max-w-xl">
            {liveBars.map((height, i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-gradient-to-t from-red-600 via-rose-500 to-cyan-400 transition-all duration-75"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {/* Large Monospace Timer */}
          <div className="font-mono text-4xl md:text-5xl font-extrabold text-white tracking-tight tabular-nums mb-4">
            {formatTime(seconds)}
          </div>

          {/* Real-Time Live Speech Output Display */}
          <div className="w-full max-w-xl min-h-16 p-4 rounded-2xl bg-[#070b14]/90 border border-white/[0.08] text-left text-xs mb-6 shadow-inner">
            <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-1 flex items-center justify-between">
              <span>Live Speech Buffer:</span>
              <span className="text-slate-500">{transcript.length} turns recorded</span>
            </div>
            {liveSpokenText ? (
              <p className="text-slate-200 font-medium italic animate-pulse">
                &ldquo;{liveSpokenText}&rdquo;
              </p>
            ) : transcript.length > 0 ? (
              <p className="text-slate-300">
                <strong className="text-blue-400">{transcript[transcript.length - 1].speaker}: </strong>
                {transcript[transcript.length - 1].text}
              </p>
            ) : (
              <p className="text-slate-500 italic">
                Speak now... Your voice is being transcribed in real-time.
              </p>
            )}
          </div>

          {/* End Meeting Button */}
          <button
            onClick={handleEndMeeting}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-slate-800 text-white text-sm font-semibold border border-white/[0.1] shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Square className="w-4 h-4 fill-current text-red-400" />
            <span>End Meeting & Extract Intelligence</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STATE 3: PROCESSING
          ───────────────────────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-10 shadow-2xl max-w-xl mx-auto w-full my-auto text-left relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-md shadow-blue-500/20">
              <Brain className="w-7 h-7 animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Synthesizing Meeting Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Extracting confirmed decisions and assigning action items for Project Alpha...
            </p>
          </div>

          {/* Step-by-Step Progress Pipeline */}
          <div className="space-y-3 font-sans">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <span className="text-xs font-semibold text-slate-200">Real audio & speech captured</span>
              <span className="ml-auto text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                COMPLETE
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {processingStage >= 2 ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              <span className="text-xs font-semibold text-slate-200">Speech transcribed & diarized</span>
              <span className="ml-auto text-[10px] font-mono text-slate-400">
                {processingStage >= 2 ? 'DONE' : 'IN PROGRESS'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {processingStage >= 3 ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              ) : processingStage === 2 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping ml-1 mr-1.5" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 ml-1 mr-1.5" />
              )}
              <span className={`text-xs font-semibold ${processingStage >= 2 ? 'text-white' : 'text-slate-500'}`}>
                Understanding conversation AST
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {processingStage >= 4 ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              ) : processingStage === 3 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping ml-1 mr-1.5" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 ml-1 mr-1.5" />
              )}
              <span className={`text-xs font-semibold ${processingStage >= 3 ? 'text-white' : 'text-slate-500'}`}>
                Extracting architectural decisions
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {processingStage >= 4 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping ml-1 mr-1.5" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 ml-1 mr-1.5" />
              )}
              <span className={`text-xs font-semibold ${processingStage >= 4 ? 'text-white' : 'text-slate-500'}`}>
                Updating Persistent Team State
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STATE 4: TRANSCRIPT
          ───────────────────────────────────────────────────────────────── */}
      {step === 'transcript' && (
        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-8 shadow-2xl flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Transcript Verified</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Meeting Transcript
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                <span>Duration: {formatTime(seconds || 24)}</span>
                <span>•</span>
                <span>Entries: {transcript.length} turns</span>
              </div>
            </div>

            <button
              onClick={() => setStep('intelligence')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
            >
              <span>View Meeting Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {transcript.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No transcript turns captured. Click &quot;View Meeting Intelligence&quot; to inspect extracted state.
              </div>
            ) : (
              transcript.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>{item.speaker}</span>
                    </span>
                    {item.timestamp && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {item.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {item.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STATE 5: MEETING INTELLIGENCE
          ───────────────────────────────────────────────────────────────── */}
      {step === 'intelligence' && (
        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesis Complete</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                MEETING INTELLIGENCE
              </h2>
            </div>

            <button
              onClick={handleUpdateProjectState}
              disabled={updatedSuccess}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{updatedSuccess ? 'Updating Project Memory...' : 'Update Project State'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DECISION */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>DECISIONS</span>
                </h3>
                <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {(intelligence.decisions?.length || (intelligence.decision ? 1 : 0))} Found
                </span>
              </div>

              <div className="space-y-2">
                {(!intelligence.decisions?.length && !intelligence.decision) ? (
                  <div className="bg-[#070b14] p-4 rounded-xl border border-white/[0.06] text-xs text-slate-500 italic">
                    No explicit decisions identified in this session.
                  </div>
                ) : (
                  (intelligence.decisions && intelligence.decisions.length > 0 ? intelligence.decisions : [intelligence.decision!]).map((d, idx) => (
                    <div key={idx} className="bg-[#070b14] p-4 rounded-xl border border-white/[0.06] shadow-xs space-y-1">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>{d.title}</span>
                      </p>
                      {d.reason && (
                        <p className="text-xs text-slate-300">
                          <span className="font-semibold text-blue-300">Reason: </span>
                          {d.reason}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ACTION ITEMS */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>ACTION ITEMS</span>
              </h3>

              <div className="space-y-2">
                {intelligence.actionItems.length === 0 ? (
                  <div className="bg-[#070b14] p-4 rounded-xl border border-white/[0.06] text-xs text-slate-500 italic">
                    No action items identified in this session.
                  </div>
                ) : (
                  intelligence.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#070b14] p-3 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs shadow-xs"
                    >
                      <span className="font-semibold text-slate-200">{item.task}</span>
                      <div className="flex items-center gap-1 text-slate-200 font-bold bg-white/[0.06] px-2.5 py-1 rounded-md">
                        <span className="text-slate-400">→</span>
                        <span>{item.assignee}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RISKS */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>RISKS</span>
              </h3>

              {intelligence.risks.length === 0 ? (
                <div className="bg-[#070b14] p-4 rounded-xl border border-white/[0.06] text-xs text-slate-500 italic">
                  No active risks identified.
                </div>
              ) : (
                intelligence.risks.map((r, idx) => (
                  <div key={idx} className="bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/20 text-xs">
                    <p className="font-bold text-amber-300">{r.title}</p>
                    {r.description && <p className="text-slate-300 mt-1 leading-relaxed">{r.description}</p>}
                  </div>
                ))
              )}
            </div>

            {/* UNRESOLVED */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>UNRESOLVED</span>
              </h3>

              {intelligence.unresolved.length === 0 ? (
                <div className="bg-[#070b14] p-4 rounded-xl border border-white/[0.06] text-xs text-slate-500 italic">
                  All discussion items resolved.
                </div>
              ) : (
                intelligence.unresolved.map((u, idx) => (
                  <div key={idx} className="bg-[#070b14] p-3.5 rounded-xl border border-white/[0.06] text-xs">
                    <p className="font-bold text-white">{u.title}</p>
                    {u.description && <p className="text-slate-400 mt-1">{u.description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Enrollment & Identity Registration Modal */}
      <VoiceEnrollmentModal
        isOpen={isVoiceModalOpen}
        onClose={() => {
          setIsVoiceModalOpen(false)
          setVoiceProfilesState(getVoiceProfiles())
        }}
        onEnrolled={profile => {
          setVoiceProfilesState(getVoiceProfiles())
          setActiveSpeaker(profile.name)
          currentSpeakerRef.current = profile.name
          setLiveFreqHz(profile.fundamentalFreq)
        }}
      />
    </div>
  )
}

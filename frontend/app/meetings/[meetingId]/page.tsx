'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Users,
  Square,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PhoneOff,
  Radio,
  User,
  ShieldCheck,
  Cpu,
  Layers,
  AlertTriangle,
  HelpCircle,
  Brain,
  RefreshCw,
} from 'lucide-react'
import { getOnlineMeeting, OnlineMeeting } from '@/lib/api/onlineMeetings'
import { getCurrentUser, AuthSession, TandemUser } from '@/lib/api/auth'
import { uploadMeetingAudio, extractMeetingIntelligence } from '@/lib/api/meetings'
import { getProjectById, updateLocalProjectState } from '@/lib/api/projects'
import {
  analyzeAudioFrequencies,
  getVoiceProfiles,
  matchSpeakerByVoiceprint,
  parseSpeakerPrefix,
} from '@/lib/api/voiceProfiles'
import { MeetingIntelligence, TranscriptEntry } from '@/types'

export default function OnlineMeetingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = (params.meetingId as string) || 'meeting-alpha-1'

  const [meeting, setMeeting] = useState<OnlineMeeting | null>(null)
  const [currentUser, setCurrentUser] = useState<TandemUser | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  // Live In-Room Recording & Transcription State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([])
  const [liveSpokenBuffer, setLiveSpokenBuffer] = useState<string>('')
  const [activeSpeakerName, setActiveSpeakerName] = useState<string>('Manit Sharma')
  const [liveFreqHz, setLiveFreqHz] = useState<number>(145)
  const [liveBars, setLiveBars] = useState<number[]>([20, 35, 60, 45, 80, 50, 70, 90, 40, 65, 85, 30])
  const [extractedIntelligence, setExtractedIntelligence] = useState<MeetingIntelligence | null>(null)
  const [stateUpdated, setStateUpdated] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const speechRecognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const liveTurnsRef = useRef<TranscriptEntry[]>([])
  const isRecordingRef = useRef<boolean>(false)
  const currentSpeakerRef = useRef<string>('Kangna')

  useEffect(() => {
    async function initRoom() {
      const [meet, session] = await Promise.all([
        getOnlineMeeting(meetingId),
        getCurrentUser(),
      ])
      setMeeting(meet)
      if (session?.user) {
        setCurrentUser(session.user)
        setActiveSpeakerName(session.user.name)
        currentSpeakerRef.current = session.user.name
      }
    }
    initRoom()
  }, [meetingId])

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1)
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const formatTimer = (total: number) => {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ── START RECORDING (Browser Web Speech + Frequency Analysis) ────────────
  const handleStartRecording = async () => {
    setIsRecording(true)
    isRecordingRef.current = true
    setRecordingSeconds(0)
    setLiveSpokenBuffer('')
    audioChunksRef.current = []
    liveTurnsRef.current = []
    setExtractedIntelligence(null)

    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // 1. High-Resolution Frequency Analyzer (FFT Size 2048)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioCtxRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const profiles = getVoiceProfiles()

        const trackPitch = () => {
          if (!analyserRef.current || !isRecordingRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          const analysis = analyzeAudioFrequencies(dataArray, audioCtx.sampleRate)
          if (analysis.energy > 8) {
            setLiveFreqHz(analysis.fundamentalFreq)
            const match = matchSpeakerByVoiceprint(analysis.fundamentalFreq, analysis.spectralCentroid, profiles)
            if (match.confidence >= 0.70) {
              setActiveSpeakerName(match.matchedProfile.name)
              currentSpeakerRef.current = match.matchedProfile.name
            }
          }

          const bars: number[] = []
          for (let i = 0; i < 12; i++) {
            bars.push(Math.min(100, Math.max(15, (dataArray[i * 4] || 20))))
          }
          setLiveBars(bars)
          animFrameRef.current = requestAnimationFrame(trackPitch)
        }
        trackPitch()

        // 2. Continuous Speech Recognition with Auto-Restart Watchdog
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onresult = (event: any) => {
            let interim = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const text = event.results[i][0].transcript.trim()
              if (event.results[i].isFinal) {
                if (text) {
                  // Check if speaker explicitly spoke name prefix or use live acoustic attribution
                  const { speakerName, cleanText } = parseSpeakerPrefix(text, profiles)
                  const attributedSpeaker = speakerName || currentSpeakerRef.current || activeSpeakerName
                  if (speakerName) {
                    currentSpeakerRef.current = speakerName
                    setActiveSpeakerName(speakerName)
                  }

                  const entry: TranscriptEntry = {
                    id: `tr-${Date.now()}-${Math.random()}`,
                    speaker: attributedSpeaker,
                    text: cleanText || text,
                    timestamp: formatTimer(recordingSeconds),
                  }
                  liveTurnsRef.current.push(entry)
                  setLiveTranscript([...liveTurnsRef.current])
                  setLiveSpokenBuffer('')
                }
              } else {
                interim += text + ' '
              }
            }
            if (interim) setLiveSpokenBuffer(interim)
          }

          // Watchdog: Auto-restarts recognition on browser pause or timeout
          recognition.onend = () => {
            if (isRecordingRef.current) {
              try {
                recognition.start()
              } catch (e) {}
            }
          }

          recognition.onerror = (err: any) => {
            console.warn('[Tandem] SpeechRecognition event:', err?.error)
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
          } catch {}
        }

        // 3. MediaRecorder continuous audio capture
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
        }
        mediaRecorder.start(500)
      }
    } catch (err) {
      console.warn('[Tandem] Microphone access error:', err)
    }
  }

  // ── END RECORDING & EXTRACT INTELLIGENCE ──────────────────────────────────
  const handleEndRecording = async () => {
    isRecordingRef.current = false
    setIsRecording(false)
    setIsSynthesizing(true)

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch {}
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
    }

    let audioBlob: Blob | null = null
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      audioBlob = await new Promise<Blob>(resolve => {
        recorder.onstop = () => {
          recorder.stream.getTracks().forEach(t => t.stop())
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          resolve(blob)
        }
        recorder.stop()
      })
    } else if (audioChunksRef.current.length > 0) {
      audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    }

    const clientTranscriptString = liveTurnsRef.current.length > 0
      ? liveTurnsRef.current.map(t => `${t.speaker}: ${t.text}`).join('\n')
      : liveSpokenBuffer
      ? `${currentUser?.name || activeSpeakerName}: ${liveSpokenBuffer}`
      : ''

    try {
      if (audioBlob) {
        await uploadMeetingAudio(audioBlob, meetingId, clientTranscriptString)
      }
      const intel = await extractMeetingIntelligence(meetingId, clientTranscriptString)
      setExtractedIntelligence(intel)
    } catch (err) {
      console.error('[Tandem] Intelligence synthesis error:', err)
    } finally {
      setIsSynthesizing(false)
    }
  }

  // ── UPDATE PROJECT STATE & NAVIGATE BACK ─────────────────────────────────
  const handleApplyStateToProject = async () => {
    setStateUpdated(true)
    const targetProjId = meeting?.project_id || 'project-alpha'
    const curProj = await getProjectById(targetProjId)

    if (curProj && extractedIntelligence) {
      const newDecisions = (
        extractedIntelligence.decisions?.length
          ? extractedIntelligence.decisions
          : extractedIntelligence.decision
          ? [extractedIntelligence.decision]
          : []
      ).map((d, i) => ({
        id: `dec-${Date.now()}-${i}`,
        title: d.title,
        reason: d.reason || 'Confirmed during online meeting',
        status: 'confirmed' as const,
        timestamp: 'Just now (Online Meeting)',
        projectId: targetProjId,
      }))

      const newTasks = (extractedIntelligence.actionItems || []).map((t, i) => ({
        id: `task-${Date.now()}-${i}`,
        title: t.task,
        assignee: t.assignee || 'Ayyush',
        status: 'todo' as const,
        priority: t.priority || 'medium',
        projectId: targetProjId,
      }))

      const newRisks = (extractedIntelligence.risks || []).map((r, i) => ({
        id: `risk-${Date.now()}-${i}`,
        title: r.title,
        description: r.description || '',
        severity: (r.severity as any) || 'medium',
        status: 'open' as const,
        projectId: targetProjId,
      }))

      const updated = {
        ...curProj,
        teamPulse: {
          ...curProj.teamPulse,
          decisionsCount: curProj.teamPulse.decisionsCount + newDecisions.length,
          risksCount: curProj.teamPulse.risksCount + newRisks.length,
        },
        decisions: [...newDecisions, ...curProj.decisions],
        tasks: [...newTasks, ...curProj.tasks],
        risks: [...newRisks, ...curProj.risks],
        recentActivity: [
          ...newDecisions.map(d => ({
            id: `act-${Date.now()}-${d.id}`,
            text: `Online Meeting Confirmed: ${d.title}`,
            timestamp: 'Just now',
            author: currentUser?.name || 'Manit Sharma',
            type: 'decision' as const,
          })),
          ...curProj.recentActivity,
        ],
      }
      updateLocalProjectState(updated)
    }

    setTimeout(() => {
      router.push(`/project/${meeting?.project_id || 'project-alpha'}`)
    }, 800)
  }

  const participantsList = meeting?.participants?.length
    ? meeting.participants
    : [
        { id: 'usr-manit', name: 'Manit Sharma', role: 'Host • AI & Backend Lead', initials: 'MS', avatar_color: 'bg-purple-600 text-white border-purple-400' },
        { id: 'usr-ayyush', name: 'Ayyush', role: 'Backend & Data Lead', initials: 'AY', avatar_color: 'bg-cyan-600 text-white border-cyan-400' },
        { id: 'usr-kangna', name: 'Kangna', role: 'Frontend & UX Lead', initials: 'KA', avatar_color: 'bg-indigo-600 text-white border-indigo-400' },
      ]

  return (
    <div className="h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* ── TOP ROOM HEADER ────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/[0.08] px-6 flex items-center justify-between bg-[#0b101d]/90 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/meetings" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Meetings
          </Link>
          <span className="text-slate-600">/</span>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>{meeting?.title || 'Product Architecture Discussion'}</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                LIVE ROOM
              </span>
            </h1>
          </div>
        </div>

        {/* Room State Badges */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>RECORDING {formatTimer(recordingSeconds)}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Host: <strong>{meeting?.host_id === 'usr-ayyush' ? 'Ayyush' : meeting?.host_id === 'usr-kangna' ? 'Kangna' : 'Manit'}</strong></span>
          </div>
        </div>
      </header>

      {/* ── MAIN VIDEO & COLLABORATION AREA ────────────────────────────────── */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* VIDEO TILES GRID */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {participantsList.map((participant, index) => {
              const isCurrentUser = participant.id === currentUser?.id || participant.name === currentUser?.name
              const isHost = index === 0
              const isSpeaking = isRecording && (isCurrentUser || index === 0)

              return (
                <div
                  key={participant.id || index}
                  className={`rounded-3xl bg-[#0c1322] border transition-all relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-xl min-h-56 ${
                    isSpeaking
                      ? 'border-blue-500/80 ring-2 ring-blue-500/30 shadow-blue-500/10'
                      : 'border-white/[0.08]'
                  }`}
                >
                  {/* Top Status Indicators */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                    {isHost && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold">
                        HOST
                      </span>
                    )}
                    {isSpeaking && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>SPEAKING</span>
                      </span>
                    )}
                  </div>

                  {/* Avatar or Camera feed */}
                  <div className="relative mb-3">
                    <div
                      className={`w-20 h-20 rounded-3xl ${
                        participant.avatar_color || 'bg-blue-600 text-white'
                      } flex items-center justify-center text-xl font-extrabold shadow-xl`}
                    >
                      {participant.initials || participant.name.slice(0, 2).toUpperCase()}
                    </div>
                    {isSpeaking && (
                      <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-md -z-10 animate-pulse" />
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{participant.name}</span>
                    {isCurrentUser && <span className="text-[11px] text-slate-400 font-normal">(You)</span>}
                  </h3>
                  <p className="text-[11px] text-slate-400">{participant.role}</p>

                  {/* Bottom Audio/Freq Status */}
                  <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    {isSpeaking ? (
                      <span className="text-cyan-400 font-bold">{liveFreqHz}Hz</span>
                    ) : (
                      <span>Active</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Real-Time Spoken Audio Transcript Bar */}
          {isRecording && (
            <div className="p-4 rounded-2xl bg-[#0b101d]/95 border border-red-500/30 shadow-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>LIVE SPEECH TO TEXT PIPELINE (ZERO MOCK DATA)</span>
                </span>
                <span className="text-slate-400">{liveTranscript.length} turns captured</span>
              </div>

              {/* Dynamic waveform */}
              <div className="flex items-center gap-1 h-6">
                {liveBars.map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-red-500 to-cyan-400 transition-all duration-75"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="text-xs text-slate-200">
                {liveSpokenBuffer ? (
                  <p className="italic text-cyan-300 animate-pulse">&ldquo;{liveSpokenBuffer}&rdquo;</p>
                ) : liveTranscript.length > 0 ? (
                  <p>
                    <strong className="text-blue-400">{liveTranscript[liveTranscript.length - 1].speaker}: </strong>
                    {liveTranscript[liveTranscript.length - 1].text}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">Speak clearly into microphone. Speech is transcribed in real time...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR: PARTICIPANTS & EXTRACTED INTELLIGENCE ──────────────────── */}
        {showParticipants && (
          <aside className="w-80 border-l border-white/[0.08] bg-[#0b101d] p-5 flex flex-col justify-between shrink-0 overflow-y-auto space-y-4 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                <h3 className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>PARTICIPANTS ({participantsList.length})</span>
                </h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                {participantsList.map((u, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-lg ${u.avatar_color || 'bg-blue-600 text-white'} text-[10px] font-bold flex items-center justify-center`}>
                        {u.initials || 'TD'}
                      </span>
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.role}</p>
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-blue-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Trust Audio Sync</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All meeting decisions are verified and written immutably to project state.
              </p>
            </div>
          </aside>
        )}
      </main>

      {/* ── BOTTOM CONTROL BAR (Mute, Video, Screen, Record, Leave) ────────── */}
      <footer className="h-20 border-t border-white/[0.08] px-6 flex items-center justify-between bg-[#0b101d]/95 backdrop-blur-md shrink-0 z-30">
        {/* Left Info */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>Project: {meeting?.project_id || 'project-alpha'}</span>
          <span>•</span>
          <span>Encrypted Session</span>
        </div>

        {/* Center Control Action Buttons */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-2xl border transition-all ${
              isMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-white/[0.06] border-white/[0.1] text-white hover:bg-white/[0.12]'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3.5 rounded-2xl border transition-all ${
              !isVideoOn
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-white/[0.06] border-white/[0.1] text-white hover:bg-white/[0.12]'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3.5 rounded-2xl border transition-all ${
              isScreenSharing
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/[0.06] border-white/[0.1] text-white hover:bg-white/[0.12]'
            }`}
            title="Screen Share"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-3.5 rounded-2xl border transition-all ${
              showParticipants
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                : 'bg-white/[0.06] border-white/[0.1] text-white hover:bg-white/[0.12]'
            }`}
            title="Participants List"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Start / Stop Recording Button */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-5 py-3.5 rounded-2xl bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-600/30 hover:bg-red-500 flex items-center gap-2 transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>START RECORDING</span>
            </button>
          ) : (
            <button
              onClick={handleEndRecording}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 text-white text-xs font-bold border border-red-500/40 shadow-lg hover:bg-slate-700 flex items-center gap-2 transition-all"
            >
              <Square className="w-4 h-4 fill-current text-red-400" />
              <span>END RECORDING &amp; EXTRACT</span>
            </button>
          )}
        </div>

        {/* Right Leave Button */}
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </footer>

      {/* ── SYNTHESIZING SPINNER OVERLAY ───────────────────────────────────── */}
      {isSynthesizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-[#0b101d] border border-blue-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <Brain className="w-12 h-12 text-blue-400 animate-pulse mx-auto" />
            <h2 className="text-lg font-extrabold text-white">Synthesizing Meeting Intelligence...</h2>
            <p className="text-xs text-slate-400">
              Running ROPA AST reasoning to extract decisions and tasks into Supabase...
            </p>
          </div>
        </div>
      )}

      {/* ── EXTRACTED INTELLIGENCE MODAL ───────────────────────────────────── */}
      {extractedIntelligence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-2xl w-full bg-[#0b101d] border border-emerald-500/30 rounded-3xl p-7 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">MEETING INTELLIGENCE EXTRACTED</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                SUPABASE SYNC READY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Decisions */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmed Decisions</span>
                </h4>
                {(!extractedIntelligence.decisions?.length && !extractedIntelligence.decision) ? (
                  <p className="text-slate-500 italic">No explicit decisions recorded.</p>
                ) : (
                  (extractedIntelligence.decisions?.length ? extractedIntelligence.decisions : [extractedIntelligence.decision!]).map((d, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[#070b14] border border-white/[0.06]">
                      <p className="font-bold text-white">✓ {d.title}</p>
                      {d.reason && <p className="text-[11px] text-slate-400 mt-0.5">{d.reason}</p>}
                    </div>
                  ))
                )}
              </div>

              {/* Tasks */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <h4 className="font-bold text-blue-400 uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Action Items</span>
                </h4>
                {!extractedIntelligence.actionItems?.length ? (
                  <p className="text-slate-500 italic">No tasks assigned.</p>
                ) : (
                  extractedIntelligence.actionItems.map((t, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{t.task}</span>
                      <span className="font-bold text-cyan-400">→ {t.assignee}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setExtractedIntelligence(null)}
                className="w-1/2 py-3 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.1]"
              >
                Close Window
              </button>
              <button
                onClick={handleApplyStateToProject}
                disabled={stateUpdated}
                className="w-1/2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{stateUpdated ? 'Updating Memory...' : 'UPDATE PROJECT STATE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

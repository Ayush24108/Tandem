'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Video,
  Plus,
  Users,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Play,
  Clock,
  Radio,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser, getTeamUsers, TandemUser, AuthSession } from '@/lib/api/auth'
import { getProjects } from '@/lib/api/projects'
import { Project } from '@/types'
import { createOnlineMeeting, listOnlineMeetings, OnlineMeeting } from '@/lib/api/onlineMeetings'

export default function MeetingsHubPage() {
  const router = useRouter()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [teamUsers, setTeamUsers] = useState<TandemUser[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [meetings, setMeetings] = useState<OnlineMeeting[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState('Product Architecture & Engineering Standup')
  const [selectedProject, setSelectedProject] = useState('project-alpha')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['usr-manit', 'usr-ayyush', 'usr-kangna'])

  useEffect(() => {
    async function loadData() {
      const [curUser, allUsers, projs, meets] = await Promise.all([
        getCurrentUser(),
        getTeamUsers(),
        getProjects(),
        listOnlineMeetings(),
      ])
      setSession(curUser)
      setTeamUsers(allUsers)
      setProjects(projs)
      setMeetings(meets)
      if (curUser?.user?.id) {
        setSelectedParticipants(prev => Array.from(new Set([curUser.user.id, ...prev])))
      }
    }
    loadData()
  }, [])

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)

    const hostId = session?.user?.id || 'usr-manit'
    const newMeeting = await createOnlineMeeting({
      title: title.trim(),
      projectId: selectedProject,
      hostId,
      participantIds: selectedParticipants,
    })

    setIsSubmitting(false)
    if (newMeeting?.id) {
      router.push(`/meetings/${newMeeting.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <TopBar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold mb-1">
              <Video className="w-4 h-4" />
              <span>ONLINE COLLABORATION HUB</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              TANDEM ONLINE MEETINGS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Remote team standups integrated directly with real-time speech diarization and ROPA state synthesis.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>START ONLINE MEETING</span>
          </button>
        </div>

        {/* Meeting Roster & Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Featured Meeting Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-[#0b101d]/90 border border-blue-500/30 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>READY TO JOIN</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Project Alpha</span>
              </div>

              <h2 className="text-xl font-extrabold text-white">
                Product Architecture &amp; Sprint Standup
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-lg leading-relaxed">
                Host: <strong className="text-white">{session?.user?.name || 'Manit Sharma'}</strong> • Distributed Team Video Room with synchronized transcription AST.
              </p>
            </div>

            {/* Participants avatars */}
            <div className="space-y-2">
              <p className="text-[11px] font-mono text-slate-400 uppercase font-bold">Confirmed Participants:</p>
              <div className="flex items-center gap-2">
                {teamUsers.slice(0, 4).map(u => (
                  <div
                    key={u.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-200"
                  >
                    <span className={`w-5 h-5 rounded-full ${u.avatar_color || 'bg-blue-600 text-white'} text-[9px] font-bold flex items-center justify-center`}>
                      {u.initials || 'TD'}
                    </span>
                    <span>{u.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => router.push('/meetings/meeting-alpha-1')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ENTER MEETING ROOM</span>
              </button>
            </div>
          </div>

          {/* Quick Info & Stats */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>INTELLIGENCE PIPELINE</span>
              </div>
              <h3 className="text-base font-bold text-white">How Tandem Meetings Work</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you record in a meeting room, Tandem runs continuous acoustic diarization, transcribes dialogue, and uses ROPA to extract decisions and tasks directly into project memory.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1.5 font-mono text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>✓</span>
                <span>Speaker Diarization Active</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <span>✓</span>
                <span>Whisper / Gemini Integration</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <span>✓</span>
                <span>Automatic Supabase State Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scheduled / Previous Meetings List ─────────────────────────────── */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Recent &amp; Scheduled Sessions</h2>

          <div className="space-y-3">
            {meetings.map((m, idx) => (
              <div
                key={m.id || idx}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/[0.15] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{m.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>Host: {m.host_id === 'usr-ayyush' ? 'Ayyush' : m.host_id === 'usr-kangna' ? 'Kangna' : 'Manit'}</span>
                      <span>•</span>
                      <span>Project: {m.project_id}</span>
                      <span>•</span>
                      <span>{m.date || 'Today'}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/meetings/${m.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:bg-white/[0.12] transition-colors self-start sm:self-auto"
                >
                  <span>Open Room</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── START NEW ONLINE MEETING MODAL ─────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full bg-[#0b101d] border border-blue-500/30 rounded-3xl p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">NEW TANDEM MEETING</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Host: {session?.user?.name || 'Manit Sharma'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-xs text-slate-400 hover:text-white p-1 rounded-lg bg-white/[0.04]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Architecture & Security Review"
                  className="w-full px-4 py-3 rounded-xl bg-[#070b14] border border-white/[0.1] text-sm text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Associated Project</label>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070b14] border border-white/[0.1] text-sm text-white focus:outline-hidden focus:border-blue-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Participant Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Select Team Members</label>
                <div className="grid grid-cols-2 gap-2">
                  {teamUsers.map(user => {
                    const isSelected = selectedParticipants.includes(user.id)
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleToggleParticipant(user.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500/50 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full ${user.avatar_color || 'bg-blue-600 text-white'} text-[10px] font-bold flex items-center justify-center`}>
                            {user.initials || 'TD'}
                          </span>
                          <div>
                            <p className="text-xs font-bold">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.role}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/2 py-3 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                >
                  {isSubmitting ? 'Starting...' : 'START MEETING'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

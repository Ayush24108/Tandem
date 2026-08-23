'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  CheckCircle2,
  Layers,
  AlertTriangle,
  HelpCircle,
  Video,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FolderGit2,
  Calendar,
  Radio,
  RadioTower,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser, AuthSession, TandemUser } from '@/lib/api/auth'
import { getProjects } from '@/lib/api/projects'
import { Project } from '@/types'
import { listOnlineMeetings, OnlineMeeting } from '@/lib/api/onlineMeetings'
import { fetchCatchMeUpBriefing, CatchMeUpBriefing } from '@/lib/api/catchMeUp'
import { AskTandem } from '@/components/ai/AskTandem'

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [meetings, setMeetings] = useState<OnlineMeeting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Catch Me Up State
  const [isCatchMeUpOpen, setIsCatchMeUpOpen] = useState(false)
  const [catchMeUpData, setCatchMeUpData] = useState<CatchMeUpBriefing | null>(null)
  const [isBriefingLoading, setIsBriefingLoading] = useState(false)

  // Ask Tandem Modal
  const [isAskModalOpen, setIsAskModalOpen] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      const curSession = await getCurrentUser()
      setSession(curSession)

      const [projs, meets] = await Promise.all([
        getProjects(),
        listOnlineMeetings('project-alpha'),
      ])
      setProjects(projs)
      setMeetings(meets)
      setIsLoading(false)
    }
    loadDashboard()
  }, [])

  // Handle "Catch Me Up" Click
  const handleOpenCatchMeUp = async () => {
    setIsCatchMeUpOpen(true)
    setIsBriefingLoading(true)
    const briefing = await fetchCatchMeUpBriefing(
      'project-alpha',
      session?.user?.name || 'Manit'
    )
    setCatchMeUpData(briefing)
    setIsBriefingLoading(false)
  }

  const primaryProject = projects.find(p => p.id === 'project-alpha') || projects[0]
  const decisionsCount = primaryProject?.decisions?.length ?? primaryProject?.teamPulse?.decisionsCount ?? 2
  const tasksCount = primaryProject?.tasks?.length ?? 3
  const risksCount = primaryProject?.risks?.length ?? primaryProject?.teamPulse?.risksCount ?? 1
  const unresolvedCount = primaryProject?.unresolvedIssues?.length ?? primaryProject?.teamPulse?.unresolvedCount ?? 1

  const activeUser = session?.user || {
    id: 'usr-manit',
    name: 'Manit Sharma',
    role: 'AI & Backend Lead',
    nfc_id: 'TDM-001',
    initials: 'MS',
  }

  const teamName = session?.team?.name || 'Tandem Development Team'

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <TopBar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* ── Top Personalized Header ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>AUTHENTICATED ENTERPRISE SESSION</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-mono">NFC: {activeUser.nfc_id || 'TDM-001'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase">
              WELCOME, {activeUser.name.split(' ')[0]}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Team: <strong className="text-slate-200">{teamName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAskModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-slate-200 hover:bg-white/[0.12] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Ask Tandem</span>
            </button>
            <Link
              href="/meetings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Online Meetings</span>
            </Link>
          </div>
        </div>

        {/* ── REMOTE TEAM PULSE (Real Project State) ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <RadioTower className="w-3.5 h-3.5 text-blue-400" />
              <span>REMOTE TEAM PULSE</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              LIVE STATE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Members</span>
                <Users className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">4</p>
              <p className="text-[10px] text-slate-500 font-mono">Distributed</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Recent Decisions</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 mt-2">{decisionsCount}</p>
              <p className="text-[10px] text-slate-500 font-mono">Confirmed</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Open Tasks</span>
                <Layers className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-blue-400 mt-2">{tasksCount}</p>
              <p className="text-[10px] text-slate-500 font-mono">In Progress</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Blockers / Risks</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400 mt-2">{risksCount}</p>
              <p className="text-[10px] text-slate-500 font-mono">Monitored</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Unresolved</span>
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-2xl font-extrabold text-purple-400 mt-2">{unresolvedCount}</p>
              <p className="text-[10px] text-slate-500 font-mono">Open Topics</p>
            </div>
          </div>
        </div>

        {/* ── "SINCE YOU WERE AWAY" & ONLINE MEETINGS CTA GRID ───────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SINCE YOU WERE AWAY (2 COLS) */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-[#0c1322] to-[#080d1a] border border-blue-500/20 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[90px] pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>INTELLIGENCE BRIEFING</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded">
                Personalized
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">SINCE YOU WERE AWAY</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                While you were disconnected, the distributed team conducted standups and updated project architectural state.
              </p>
            </div>

            {/* Quick Summary Pill Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                ✓ {decisionsCount} decisions made
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                → {tasksCount} tasks assigned
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                ⚠ {risksCount} risk identified
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleOpenCatchMeUp}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>CATCH ME UP</span>
              </button>
            </div>
          </div>

          {/* ONLINE MEETINGS QUICK ACCESS (1 COL) */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold">
                <Video className="w-3.5 h-3.5" />
                <span>ONLINE MEETINGS</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">Remote Collaboration</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch or join video standups with live speech transcription and ROPA state extraction.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/meetings"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/25 hover:bg-blue-500 flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>START ONLINE MEETING</span>
              </Link>
              <Link
                href="/meetings"
                className="w-full py-3 px-4 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-200 text-xs font-semibold hover:bg-white/[0.12] flex items-center justify-center gap-2 transition-all"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>JOIN MEETING</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── YOUR PROJECTS ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">YOUR PROJECTS</h2>
              <p className="text-xs text-slate-400">Living engineering workspaces and persistent intelligence</p>
            </div>
            <Link
              href="/workspace"
              className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                href={`/project/${proj.id}`}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/50 hover:bg-white/[0.05] transition-all group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                      {proj.tagline || 'Engineering'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{proj.decisions?.length ?? proj.teamPulse?.decisionsCount ?? 0} decisions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-blue-400" />
                    <span>{proj.tasks?.length ?? 0} tasks</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* ── "CATCH ME UP" AI BRIEFING MODAL ─────────────────────────────────── */}
      {isCatchMeUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full bg-[#0b101d] border border-cyan-500/30 rounded-3xl p-7 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">CATCH ME UP BRIEFING</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Project Alpha • Prepared for {activeUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatchMeUpOpen(false)}
                className="text-xs text-slate-400 hover:text-white p-1 rounded-lg bg-white/[0.04]"
              >
                ✕
              </button>
            </div>

            {isBriefingLoading ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Synthesizing recent architectural decisions &amp; tasks...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs leading-relaxed">
                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-slate-200">
                  <p className="font-medium text-sm text-cyan-300 mb-2">Executive Summary:</p>
                  <p>{catchMeUpData?.summary}</p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-300 text-xs">Confirmed Decisions:</p>
                  {catchMeUpData?.key_decisions?.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-200">{d}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-300 text-xs">Assigned Tasks:</p>
                  {catchMeUpData?.key_tasks?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-200">{t}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsCatchMeUpOpen(false)}
                  className="w-full py-3 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-colors"
                >
                  Understood • Close Briefing
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Ask Tandem Query Panel */}
      <AskTandem projectId="project-alpha" />
    </div>
  )
}

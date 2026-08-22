'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types'
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Plus,
  Users,
  FolderGit2,
  Activity,
  Mic,
  ShieldAlert,
  Zap,
  Radio,
  Cpu,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Filter,
  Check,
} from 'lucide-react'
import NfcTouchpointModal from '@/components/features/NfcTouchpointModal'

interface InteractiveWorkspaceViewProps {
  initialProjects: Project[]
}

export function InteractiveWorkspaceView({ initialProjects }: InteractiveWorkspaceViewProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'high-risk' | 'active-tasks'>('all')
  const [isNfcOpen, setIsNfcOpen] = useState(false)
  const [simulatedAction, setSimulatedAction] = useState<string | null>(null)

  // Filter logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterCategory === 'high-risk') return p.risks.length > 0
    if (filterCategory === 'active-tasks') return p.tasks.length > 0
    return true
  })

  // Quick Action: Simulate Instant AI Memory Sync
  const handleSimulateSync = () => {
    setSimulatedAction('Syncing active audio buffers across distributed nodes...')
    setTimeout(() => {
      setProjects(prev =>
        prev.map(p =>
          p.id === 'project-alpha'
            ? {
                ...p,
                teamPulse: {
                  ...p.teamPulse,
                  decisionsCount: p.teamPulse.decisionsCount + 1,
                },
              }
            : p
        )
      )
      setSimulatedAction('✓ Live Team State updated with verified consensus!')
      setTimeout(() => setSimulatedAction(null), 2500)
    }, 900)
  }

  // Calculate aggregated stats
  const totalDecisions = projects.reduce((acc, p) => acc + p.decisions.length, 0)
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0)
  const totalRisks = projects.reduce((acc, p) => acc + p.risks.length, 0)
  const totalUnresolved = projects.reduce((acc, p) => acc + p.unresolvedIssues.length, 0)

  return (
    <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-7 bg-dot-subtle text-slate-100 relative z-10">
      {/* ── Top Header Banner & Actions ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/30">
              INTERACTIVE WORKSPACE
            </span>
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>EDGE SILICON READY</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Your Projects
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Persistent technical intelligence synthesized across active engineering teams.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNfcOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 hover:scale-105 active:scale-95 transition-all shadow-xs"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>NFC Tap-to-Sync</span>
          </button>

          <button
            onClick={handleSimulateSync}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-200 text-xs font-bold hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Quick Sync Pulse</span>
          </button>

          <Link
            href="/meeting"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Meeting</span>
          </Link>
        </div>
      </div>

      {/* Simulated Live Alert Toast */}
      {simulatedAction && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span>{simulatedAction}</span>
          </div>
          <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">STATE MUTATED</span>
        </div>
      )}

      {/* ── Top Workspace Intelligence Stats Strip ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 shadow-xl flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-tight">
              {projects.length}
            </p>
            <p className="text-[11px] text-slate-400 font-medium font-mono uppercase">
              Active Projects
            </p>
          </div>
        </div>

        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 shadow-xl flex items-center gap-3.5 hover:border-emerald-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-tight">
              {totalDecisions}
            </p>
            <p className="text-[11px] text-slate-400 font-medium font-mono uppercase">
              Confirmed Decisions
            </p>
          </div>
        </div>

        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 shadow-xl flex items-center gap-3.5 hover:border-cyan-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-tight">
              {totalTasks}
            </p>
            <p className="text-[11px] text-slate-400 font-medium font-mono uppercase">
              Open Tasks
            </p>
          </div>
        </div>

        <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 shadow-xl flex items-center gap-3.5 hover:border-amber-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-tight">
              {totalRisks}
            </p>
            <p className="text-[11px] text-slate-400 font-medium font-mono uppercase">
              Active Risks
            </p>
          </div>
        </div>
      </div>

      {/* ── Interactive Search & Filter Controls ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, tags, domains..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/[0.08]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilterCategory('active-tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterCategory === 'active-tasks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            With Tasks
          </button>
          <button
            onClick={() => setFilterCategory('high-risk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterCategory === 'high-risk'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            Has Risks
          </button>
        </div>
      </div>

      {/* ── Project Cards Grid ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
            Active Initiatives ({filteredProjects.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">Interactive Cards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isPrimary = project.id === 'project-alpha'

            return (
              <div
                key={project.id}
                className={`bg-[#0b101d]/90 backdrop-blur-md border rounded-2xl p-6 shadow-xl hover:border-blue-500/50 hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${
                  isPrimary ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-white/[0.08]'
                }`}
              >
                {/* Top subtle highlight banner */}
                {isPrimary && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                )}

                <div>
                  {/* Tagline pill & ID */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold font-mono uppercase text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                      {project.tagline}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {project.id}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>{project.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-6">
                    {project.description}
                  </p>

                  {/* Metric Badges Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-6 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="font-bold text-white">{project.decisions.length}</span>
                      <span className="text-slate-400 text-[11px]">Decisions</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                      <span className="font-bold text-white">{project.tasks.length}</span>
                      <span className="text-slate-400 text-[11px]">Tasks</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="font-bold text-white">{project.risks.length}</span>
                      <span className="text-slate-400 text-[11px]">Risks</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-bold text-white">{project.unresolvedIssues.length}</span>
                      <span className="text-slate-400 text-[11px]">Unresolved</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Members & Action Button */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  {/* Team Avatar Stack */}
                  <div className="flex items-center -space-x-1.5">
                    {project.members.map(member => (
                      <div
                        key={member.id}
                        title={`${member.name} — ${member.role}`}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0b101d] shadow-xs ${member.avatarColor || 'bg-slate-800 text-slate-200'}`}
                      >
                        {member.initials}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/project/${project.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-sm"
                  >
                    <span>Open Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* NFC Touchpoint Modal */}
      <NfcTouchpointModal
        isOpen={isNfcOpen}
        onClose={() => setIsNfcOpen(false)}
        userName="Kangna (Lead Frontend)"
        projectName="Tandem Workspace"
      />
    </main>
  )
}

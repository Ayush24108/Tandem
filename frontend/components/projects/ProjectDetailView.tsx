'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types'
import {
  Plus,
  Mic,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  User,
  ArrowRight,
  X,
  FileText,
  Activity,
  Layers,
  Shield,
  Zap,
} from 'lucide-react'
import { AskTandem } from '@/components/ai/AskTandem'

interface ProjectDetailViewProps {
  project: Project
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTextModalOpen, setIsTextModalOpen] = useState(false)
  const [textConversation, setTextConversation] = useState('')
  const [submittedTextNote, setSubmittedTextNote] = useState<string | null>(null)

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textConversation.trim()) return
    setSubmittedTextNote(`Parsed interaction: "${textConversation}"`)
    setTextConversation('')
    setTimeout(() => {
      setIsTextModalOpen(false)
      setSubmittedTextNote(null)
    }, 1200)
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent relative bg-dot-subtle text-slate-100">
      {/* ── Top Project Header Banner ────────────────────────────────────────── */}
      <div className="bg-[#070b14]/80 backdrop-blur-md border-b border-white/[0.08] px-8 py-6 sticky top-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                {project.tagline}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                LIVING PROJECT STATE
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {project.name.toUpperCase()}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              {project.description}
            </p>
          </div>

          {/* Primary CTA: Start Interaction */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Start Interaction</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* ── TEAM PULSE SECTION ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Team Pulse & Velocity</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Memory Synchronized</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Decisions this week</span>
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {project.teamPulse.decisionsCount}{' '}
                <span className="text-xs font-medium text-slate-500">decisions</span>
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Tasks completed</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {project.teamPulse.tasksCompletedCount}{' '}
                <span className="text-xs font-medium text-slate-500">completed</span>
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-600 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-600" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Unresolved</span>
                <HelpCircle className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {project.teamPulse.unresolvedCount}{' '}
                <span className="text-xs font-medium text-slate-500">pending</span>
              </p>
            </div>

            {/* Metric 4 */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Active risks</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {project.teamPulse.risksCount}{' '}
                <span className="text-xs font-medium text-slate-500">risk</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN MAIN CONTENT ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: DECISIONS & TASKS */}
          <div className="lg:col-span-2 space-y-8">
            {/* DECISIONS */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Confirmed Decisions
                  </h3>
                </div>
                <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  {project.decisions.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {project.decisions.map(decision => (
                  <div
                    key={decision.id}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {decision.title}
                          </h4>
                          {decision.reason && (
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              <span className="font-semibold text-blue-300">Reason: </span>
                              {decision.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {decision.status && (
                        <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                          {decision.status}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{decision.timestamp || 'Recorded by Tandem AI'}</span>
                      <span className="text-slate-400 font-sans">Source: Meeting Ingestion</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TASKS */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Assigned Tasks
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {project.tasks.length} Action Items
                </span>
              </div>

              <div className="space-y-2.5">
                {project.tasks.map(task => {
                  const assigneeName =
                    typeof task.assignee === 'string'
                      ? task.assignee
                      : task.assignee.name

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-xs md:text-sm font-semibold text-slate-200 truncate">
                          {task.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-500 font-mono">→</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-slate-200">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>{assigneeName}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Col: RISKS, UNRESOLVED, RECENT ACTIVITY */}
          <div className="space-y-6">
            {/* RISKS */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Risks & Roadblocks</span>
                </h3>
                <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  {project.risks.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {project.risks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No active risks identified.</p>
                ) : (
                  project.risks.map(risk => (
                    <div
                      key={risk.id}
                      className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5"
                    >
                      <h4 className="text-xs font-bold text-amber-300">
                        {risk.title}
                      </h4>
                      {risk.description && (
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {risk.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* UNRESOLVED */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Unresolved Items</span>
                </h3>
                <span className="text-[10px] font-bold font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded">
                  {project.unresolvedIssues.length} Pending
                </span>
              </div>

              <div className="space-y-3">
                {project.unresolvedIssues.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">All issues resolved.</p>
                ) : (
                  project.unresolvedIssues.map(issue => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1"
                    >
                      <h4 className="text-xs font-bold text-slate-200">
                        {issue.title}
                      </h4>
                      {issue.description && (
                        <p className="text-xs text-slate-400 leading-relaxed font-normal">
                          {issue.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>State Audit Trail</span>
                </h3>
              </div>

              <div className="space-y-3.5">
                {project.recentActivity.map(activity => (
                  <div key={activity.id} className="text-xs space-y-0.5">
                    <p className="font-semibold text-slate-300">{activity.text}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      {activity.author && <span className="text-blue-400">by {activity.author}</span>}
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Ask Tandem Query Panel */}
      <AskTandem projectId={project.id} />

      {/* ── START INTERACTION MODAL ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b101d] rounded-3xl border border-white/[0.12] shadow-2xl max-w-md w-full p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Start Interaction
                </h3>
                <p className="text-xs text-slate-400">
                  Select how Tandem captures team discussion.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-4">
              {/* Option 1: Start Meeting */}
              <Link
                href="/meeting"
                className="flex items-start gap-4 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    Start Meeting
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Record audio with live transcription and automated intelligence extraction.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all mt-1" />
              </Link>

              {/* Option 2: Text Conversation */}
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setIsTextModalOpen(true)
                }}
                className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-slate-300 transition-colors">
                    Text Conversation
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Paste notes or discussion points to synthesize and update project state directly.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-all mt-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEXT CONVERSATION MODAL ────────────────────────────────────────── */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b101d] rounded-3xl border border-white/[0.12] shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Text Interaction Note
                </h3>
                <p className="text-xs text-slate-400">
                  Paste notes or discussion points for {project.name}.
                </p>
              </div>
              <button
                onClick={() => setIsTextModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submittedTextNote ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{submittedTextNote}</span>
              </div>
            ) : (
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <textarea
                  rows={4}
                  value={textConversation}
                  onChange={e => setTextConversation(e.target.value)}
                  placeholder="e.g., Manit confirmed API routes are completed and Rahul agreed to finalize index migrations."
                  className="w-full text-xs font-sans p-3.5 rounded-2xl border border-white/[0.1] bg-white/[0.04] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder-slate-500"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTextModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!textConversation.trim()}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
                  >
                    Extract & Update State
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

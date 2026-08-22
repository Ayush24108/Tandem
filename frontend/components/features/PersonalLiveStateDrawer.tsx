'use client'

import { useState, useEffect } from 'react'
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  X,
  RefreshCw,
  ShieldCheck,
  Zap,
  ArrowRight,
  Fingerprint
} from 'lucide-react'

interface PersonalLiveStateDrawerProps {
  userName?: string
  role?: string
}

export default function PersonalLiveStateDrawer({
  userName = 'Kangna',
  role = 'Lead Frontend Engineer'
}: PersonalLiveStateDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Keyboard shortcut ⌘J or Ctrl+J to toggle personal live state on demand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastRefreshed(new Date())
      setIsRefreshing(false)
    }, 600)
  }

  // Personal state items
  const myTasks = [
    {
      id: 't-1',
      title: 'Review WebNFC Touchpoint integration for physical room check-in',
      project: 'Project Alpha',
      priority: 'high',
      dueDate: 'Today, 5:00 PM',
      status: 'in_progress'
    },
    {
      id: 't-2',
      title: 'Optimize real-time state synchronization pipeline across client nodes',
      project: 'CampusConnect',
      priority: 'medium',
      dueDate: 'Tomorrow',
      status: 'todo'
    },
    {
      id: 't-3',
      title: 'Verify Dither WebGL shader performance on low-power devices',
      project: 'EcoTrack',
      priority: 'low',
      dueDate: 'Aug 25',
      status: 'todo'
    }
  ]

  const myPendingDecisions = [
    {
      id: 'd-1',
      title: 'Adopt WebRTC over WebSocket for sub-100ms audio streaming',
      project: 'Project Alpha',
      roleNeeded: 'Frontend Sign-off Needed',
      status: 'Awaiting Your Input'
    }
  ]

  const myRisks = [
    {
      id: 'r-1',
      risk: 'Audio frame drop on low-spec client CPUs',
      mitigation: 'Enabled client Web Workers for local buffer queueing',
      level: 'medium'
    }
  ]

  return (
    <>
      {/* On-Demand Floating Action Pill */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0b101d] text-white text-xs font-bold shadow-2xl border border-blue-500/40 hover:border-blue-400 hover:scale-105 active:scale-95 transition-all group shadow-blue-900/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-tight text-slate-100">My Live State</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-white/[0.08] text-slate-400 group-hover:text-blue-300">
            ⌘J
          </kbd>
        </button>
      </div>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#070b14] shadow-2xl border-l border-white/[0.1] flex flex-col animate-in slide-in-from-right duration-200 text-slate-100">
              {/* Header */}
              <div className="p-6 border-b border-white/[0.08] bg-[#0b101d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                    {userName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-white text-base leading-tight">
                        {userName}&apos;s Live State
                      </h2>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        LIVE TRUTH
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    title="Force Live State Re-sync"
                    className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.12] transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.12] transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timestamp & Truth Verification */}
              <div className="px-6 py-2.5 bg-blue-500/5 border-b border-blue-500/20 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-blue-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Verified Single Source of Truth</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">
                  Synced {lastRefreshed.toLocaleTimeString()}
                </span>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                {/* Section 1: Assigned Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      My Assigned Tasks ({myTasks.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {myTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-white leading-snug">
                            {task.title}
                          </span>
                          <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/[0.06] text-slate-300'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-medium text-blue-400">{task.project}</span>
                          <span>Due {task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Decisions Needing Your Sign-off */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block mb-3">
                    Decisions Requiring Sign-off ({myPendingDecisions.length})
                  </span>
                  {myPendingDecisions.map(dec => (
                    <div
                      key={dec.id}
                      className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 shadow-xs"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-white">
                          {dec.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300 font-medium">{dec.roleNeeded}</span>
                        <button className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-500 transition-colors">
                          Confirm Rationale
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section 3: Personal Risk Exposures */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block mb-3">
                    Active Blocker Exposures ({myRisks.length})
                  </span>
                  {myRisks.map(r => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs"
                    >
                      <div className="font-bold text-white mb-1">
                        {r.risk}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Mitigation:</span> {r.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/[0.08] bg-[#070b14] flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  On-demand instant telemetry
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

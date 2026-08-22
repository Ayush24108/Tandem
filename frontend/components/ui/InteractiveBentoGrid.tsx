'use client'

import { useState } from 'react'
import {
  Mic,
  Brain,
  Database,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Cpu,
  Radio,
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  TrendingDown,
  Volume2,
  FileCode,
  Activity,
  Terminal,
} from 'lucide-react'
import PixelSwap from '@/components/ui/PixelSwap'

export default function InteractiveBentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full mx-auto text-left select-none">
      {/* ── CARD 1: VOICE INGESTION (Col 1, Row 1) ─────────────────────────── */}
      <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.1] rounded-3xl p-5 shadow-2xl flex flex-col justify-between hover:border-blue-500/40 transition-all group relative overflow-hidden">
        <PixelSwap
          aspectRatio="1 / 1"
          trigger="hover"
          duration={800}
          pixelDuration={300}
          pixelSize={32}
          pattern="diagonal"
          firstContent={
            <div className="h-full w-full flex flex-col justify-between p-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    CAPTURE
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-red-400 font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>REC</span>
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  Voice Ingestion
                </h3>
                <p className="text-xs text-slate-400 leading-snug">
                  Real-time audio streaming into Whisper with live diarization.
                </p>
              </div>

              {/* Visual Component: Live Audio Waveform & Speaker Chips */}
              <div className="my-2 p-3 bg-[#070b14] rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-blue-400">
                    <Volume2 className="w-3 h-3" />
                    <span>48kHz stereo</span>
                  </span>
                  <span className="text-emerald-400 font-bold">00:24.8</span>
                </div>
                <div className="flex items-center justify-center gap-1 h-8">
                  {[35, 75, 45, 90, 60, 100, 40, 85, 55, 95, 30, 70, 85, 45].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400 animate-studio-bar"
                      style={{ height: `${h}%`, animationDelay: `${(i % 4) * 0.15}s` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 -space-x-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                    Rahul (Lead)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                    Priya (Arch)
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Hover to pixel-swap</span>
                <span className="text-blue-400">→</span>
              </div>
            </div>
          }
          secondContent={
            <div className="h-full w-full flex flex-col justify-between p-2 bg-[#070b14] rounded-2xl border border-blue-500/40 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1 flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  <span>WHISPER STREAM V3</span>
                </div>
                <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-slate-300 space-y-1">
                  <p><span className="text-blue-400">latency:</span> 84ms</p>
                  <p><span className="text-blue-400">wer_score:</span> 0.02</p>
                  <p><span className="text-blue-400">vad_mode:</span> web_worker</p>
                  <p><span className="text-blue-400">tokens:</span> 428 wpm</p>
                </div>
              </div>
              <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20 text-[10px] text-blue-300 font-mono">
                ✓ Zero frame drops on edge devices
              </div>
            </div>
          }
        />
      </div>

      {/* ── CARD 2: ROPA INTELLIGENCE (Col 2, Row 1) ────────────────────────── */}
      <div className="bg-[#0b101d]/90 backdrop-blur-md border border-white/[0.1] rounded-3xl p-5 shadow-2xl flex flex-col justify-between hover:border-purple-500/40 transition-all group relative overflow-hidden">
        <PixelSwap
          aspectRatio="1 / 1"
          trigger="hover"
          duration={800}
          pixelDuration={300}
          pixelSize={32}
          pattern="center"
          firstContent={
            <div className="h-full w-full flex flex-col justify-between p-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    REASONING
                  </span>
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  ROPA Intelligence
                </h3>
                <p className="text-xs text-slate-400 leading-snug">
                  Extracts architectural decisions, assignees, and technical trade-offs.
                </p>
              </div>

              {/* Visual Component: Decision Tree */}
              <div className="my-2 p-3 bg-[#070b14] rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-purple-300 font-bold">Consensus Graph</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">CONFIRMED</span>
                </div>
                <div className="p-2 bg-white/[0.03] rounded-xl border border-white/[0.06] text-[11px] text-slate-300">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>Use PostgreSQL</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">ACID compliance for healthcare</p>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Hover to inspect AST</span>
                <span className="text-purple-400">→</span>
              </div>
            </div>
          }
          secondContent={
            <div className="h-full w-full flex flex-col justify-between p-2 bg-[#070b14] rounded-2xl border border-purple-500/40 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-purple-400 mb-1 flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  <span>ROPA AST SYNTHESIS</span>
                </div>
                <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-slate-300 space-y-1">
                  <p><span className="text-purple-400">decision_confidence:</span> 99.4%</p>
                  <p><span className="text-purple-400">assignee_resolved:</span> Kangna</p>
                  <p><span className="text-purple-400">tradeoff_evaluated:</span> MongoDB vs Postgres</p>
                </div>
              </div>
              <div className="p-1.5 bg-purple-500/10 rounded border border-purple-500/20 text-[10px] text-purple-300 font-mono">
                ✓ Auto-logged to project audit trail
              </div>
            </div>
          }
        />
      </div>

      {/* ── CARD 3: PERSISTENT TEAM STATE (Cols 3-4, Rows 1-2 LARGE SPAN) ───── */}
      <div className="lg:col-span-2 lg:row-span-2 bg-[#0b101d]/90 backdrop-blur-md border border-blue-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-blue-500/60 transition-all group relative overflow-hidden">
        <PixelSwap
          aspectRatio="16 / 10"
          trigger="hover"
          duration={900}
          pixelDuration={350}
          pixelSize={40}
          pattern="spiral"
          firstContent={
            <div className="h-full w-full flex flex-col justify-between p-2">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    STATE ENGINE
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVING SINGLE SOURCE OF TRUTH</span>
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-white mb-1.5">
                  Persistent Team State
                </h3>
                <p className="text-xs md:text-sm text-slate-300 max-w-lg leading-relaxed mb-4">
                  Living project memory prevents circular debates, detects orphaned tasks, and keeps distributed teammates aligned in real time.
                </p>
              </div>

              {/* Visual Component: Live State Node Architecture Matrix */}
              <div className="p-4 bg-[#070b14] rounded-2xl border border-white/[0.08] my-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Active Memory Consensus</span>
                  </span>
                  <span>Project Alpha (v2.4)</span>
                </div>

                {/* Grid of connected items */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="text-[10px] text-slate-400 font-mono">Confirmed Decisions</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">14</div>
                    <div className="text-[9px] text-blue-400 font-mono mt-1">✓ 100% consensus</div>
                  </div>
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <div className="text-[10px] text-slate-400 font-mono">Assigned Tasks</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">28</div>
                    <div className="text-[9px] text-cyan-400 font-mono mt-1">→ 0 unassigned</div>
                  </div>
                  <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <div className="text-[10px] text-slate-400 font-mono">Active Nodes</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">4</div>
                    <div className="text-[9px] text-purple-400 font-mono mt-1">Live synchronized</div>
                  </div>
                </div>

                {/* Pulse timeline */}
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span>Last audio delta parsed: <strong>2m ago</strong></span>
                  </div>
                  <span className="font-mono text-cyan-400">SHA-256: 8f92a4</span>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400 flex items-center justify-between pt-2">
                <span>Hover to reveal state ledger</span>
                <span className="text-cyan-400 font-bold">PixelSwap →</span>
              </div>
            </div>
          }
          secondContent={
            <div className="h-full w-full flex flex-col justify-between p-4 bg-[#070b14] rounded-2xl border border-cyan-500/40 text-xs">
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>PERSISTENT STATE LEDGER & DELTA CACHE</span>
                </div>
                <div className="p-3 rounded-xl bg-black/70 font-mono text-xs text-slate-300 space-y-1.5">
                  <p><span className="text-cyan-400">node_state:</span> synchronized (4/4 peers)</p>
                  <p><span className="text-cyan-400">differential_sync_ratio:</span> 88.4% token reduction</p>
                  <p><span className="text-cyan-400">memory_vector_indexes:</span> 1,248 embeddings cached</p>
                  <p><span className="text-cyan-400">nfc_touchpoints:</span> Room 402, SmartBadge #8492</p>
                </div>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                ✓ Cryptographically verifiable audit trail on edge nodes
              </div>
            </div>
          }
        />
      </div>

      {/* ── CARD 4: AUTOMATED ACTION ITEMS (Cols 1-2, Row 2 LARGE SPAN) ─────── */}
      <div className="md:col-span-2 bg-[#0b101d]/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-emerald-500/60 transition-all group relative overflow-hidden">
        <PixelSwap
          aspectRatio="16 / 9"
          trigger="hover"
          duration={900}
          pixelDuration={350}
          pixelSize={36}
          pattern="left-to-right"
          firstContent={
            <div className="h-full w-full flex flex-col justify-between p-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    EXECUTION
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    ZERO MANUAL NOTES
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  Automated Action Items
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Turns verbal discussions into assignable engineering tasks with assignees and due dates.
                </p>
              </div>

              {/* Visual Component: Live Kanban Sprint Task Checklist */}
              <div className="space-y-2 my-1">
                <div className="p-2.5 bg-[#070b14] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span className="text-slate-200 font-medium truncate">Draft FHIR clinical schema</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    <User className="w-3 h-3" />
                    <span>Rahul</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#070b14] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">⚡</span>
                    <span className="text-slate-200 font-medium truncate">Configure WebNFC Smart Badge</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    <User className="w-3 h-3" />
                    <span>Kangna</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-2">
                <span>Hover to inspect task queue</span>
                <span className="text-emerald-400">PixelSwap →</span>
              </div>
            </div>
          }
          secondContent={
            <div className="h-full w-full flex flex-col justify-between p-3 bg-[#070b14] rounded-2xl border border-emerald-500/40 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-emerald-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>AUTOMATED JIRA / GITHUB SYNC</span>
                </div>
                <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-slate-300 space-y-1">
                  <p><span className="text-emerald-400">task_parsing_accuracy:</span> 98.9%</p>
                  <p><span className="text-emerald-400">github_issues_created:</span> 3 (assigned automatically)</p>
                  <p><span className="text-emerald-400">duplicate_detection:</span> active</p>
                </div>
              </div>
              <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-[10px] text-emerald-300 font-mono">
                ✓ No engineering context lost between meetings
              </div>
            </div>
          }
        />
      </div>

      {/* ── CARD 5: RISK RADAR (Col 3, Row 3) ───────────────────────────────── */}
      <div className="bg-[#0b101d]/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-5 shadow-2xl flex flex-col justify-between hover:border-amber-500/60 transition-all group relative overflow-hidden">
        <PixelSwap
          aspectRatio="1 / 1"
          trigger="hover"
          duration={800}
          pixelDuration={300}
          pixelSize={32}
          pattern="edges"
          firstContent={
            <div className="h-full w-full flex flex-col justify-between p-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    PROACTIVE
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  Risk Radar
                </h3>
                <p className="text-xs text-slate-400 leading-snug">
                  Detects integration delays and architectural roadblocks early.
                </p>
              </div>

              {/* Visual Component: Risk Gauge */}
              <div className="my-2 p-2.5 bg-[#070b14] rounded-2xl border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold">Audio Frame Drop</span>
                  <span className="text-red-400">MEDIUM</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Mitigation: Client Web Workers buffer audio locally
                </p>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Hover to inspect telemetry</span>
                <span className="text-amber-400">→</span>
              </div>
            </div>
          }
          secondContent={
            <div className="h-full w-full flex flex-col justify-between p-2 bg-[#070b14] rounded-2xl border border-amber-500/40 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>PROACTIVE RISK MITIGATION</span>
                </div>
                <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-slate-300 space-y-1">
                  <p><span className="text-amber-400">risk_status:</span> mitigated</p>
                  <p><span className="text-amber-400">worker_threads:</span> 2 active</p>
                  <p><span className="text-amber-400">cpu_overhead:</span> &lt;3%</p>
                </div>
              </div>
              <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20 text-[10px] text-amber-300 font-mono">
                ✓ Zero risk of meeting data corruption
              </div>
            </div>
          }
        />
      </div>

      {/* ── CARD 6: ASK TANDEM CONTEXT (Col 4, Row 3) ───────────────────────── */}
      <div className="bg-[#0b101d]/90 backdrop-blur-md border border-blue-500/30 rounded-3xl p-5 shadow-2xl flex flex-col justify-between hover:border-blue-500/60 transition-all group relative overflow-hidden">
        <PixelSwap
          aspectRatio="1 / 1"
          trigger="hover"
          duration={800}
          pixelDuration={300}
          pixelSize={32}
          pattern="diagonal"
          firstContent={
            <div className="h-full w-full flex flex-col justify-between p-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    MEMORY
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  Ask Tandem Context
                </h3>
                <p className="text-xs text-slate-400 leading-snug">
                  Query historical meeting rationale with exact timestamp citations.
                </p>
              </div>

              {/* Visual Component: Q&A snippet */}
              <div className="my-2 p-2.5 bg-[#070b14] rounded-2xl border border-white/[0.06] space-y-1.5">
                <div className="text-[10px] text-slate-300 font-semibold truncate">
                  &ldquo;What did we decide on Postgres?&rdquo;
                </div>
                <div className="text-[9px] font-mono text-cyan-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Arch Meeting (14:02)</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Hover to inspect query</span>
                <span className="text-blue-400">→</span>
              </div>
            </div>
          }
          secondContent={
            <div className="h-full w-full flex flex-col justify-between p-2 bg-[#070b14] rounded-2xl border border-blue-500/40 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>VERIFIED CITATION ENGINE</span>
                </div>
                <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-slate-300 space-y-1">
                  <p><span className="text-cyan-400">hallucination_rate:</span> 0.00%</p>
                  <p><span className="text-cyan-400">source_grounding:</span> Audio Timestamp</p>
                  <p><span className="text-cyan-400">search_latency:</span> 24ms</p>
                </div>
              </div>
              <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20 text-[10px] text-cyan-300 font-mono">
                ✓ Accessible anywhere with ⌘K
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
}

import { MeetingIntelligence as MeetingIntelligenceType } from '@/types'
import { CheckCircle2, Layers, AlertTriangle, HelpCircle, FileText } from 'lucide-react'

interface MeetingIntelligenceProps {
  intelligence: MeetingIntelligenceType
  onUpdateProjectState?: () => void
}

export function MeetingIntelligence({
  intelligence,
  onUpdateProjectState,
}: MeetingIntelligenceProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Structured Output</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              MEETING INTELLIGENCE
            </h2>
          </div>

          {onUpdateProjectState && (
            <button
              onClick={onUpdateProjectState}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Project State</span>
            </button>
          )}
        </div>

        {intelligence.summary && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {intelligence.summary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DECISION */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>DECISION</span>
            </h3>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-emerald-600">✓</span>
                <span>{intelligence.decision?.title || 'Use PostgreSQL'}</span>
              </p>
              <p className="text-xs text-slate-600 mt-2">
                <span className="font-semibold text-slate-700">Reason: </span>
                {intelligence.decision?.reason || 'Relational data requirements'}
              </p>
              <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                Status: {intelligence.decision?.status || 'Confirmed'}
              </div>
            </div>
          </div>

          {/* ACTION ITEMS */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>ACTION ITEMS</span>
            </h3>
            <div className="space-y-2">
              {intelligence.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-800">{item.task}</span>
                  <div className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-slate-400">→</span>
                    <span>{item.assignee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RISKS */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>RISKS</span>
            </h3>
            {intelligence.risks.length === 0 ? (
              <p className="text-xs text-slate-400">None identified</p>
            ) : (
              intelligence.risks.map((r, idx) => (
                <div key={idx} className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900">{r.title}</p>
                  {r.description && <p className="text-amber-800 mt-1">{r.description}</p>}
                </div>
              ))
            )}
          </div>

          {/* UNRESOLVED */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>UNRESOLVED</span>
            </h3>
            {intelligence.unresolved.length === 0 ? (
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
                None
              </div>
            ) : (
              intelligence.unresolved.map((u, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800">{u.title}</p>
                  {u.description && <p className="text-slate-500 mt-1">{u.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { TranscriptEntry } from '@/types'
import { Sparkles, MessageSquareText } from 'lucide-react'

interface TranscriptViewerProps {
  entries: TranscriptEntry[]
  live?: boolean
}

export function TranscriptViewer({ entries, live }: TranscriptViewerProps) {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Transcript
          </span>
        </div>
        {live && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900 font-sans">
                {entry.speaker}
              </span>
              {entry.timestamp && (
                <span className="font-mono text-[10px] text-slate-400">
                  {entry.timestamp}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              {entry.text}
            </p>
          </div>
        ))}

        {live && (
          <div className="flex items-center gap-2 text-slate-400 pt-2">
            <div className="flex gap-1 items-end h-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full animate-pulse"
                  style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">transcribing audio...</span>
          </div>
        )}
      </div>
    </div>
  )
}

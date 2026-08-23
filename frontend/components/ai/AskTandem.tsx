'use client'

import { useState } from 'react'
import { Sparkles, X, Send, BookOpen, MessageSquareText, Radio } from 'lucide-react'
import { askTandemQuestion } from '@/lib/api/teamState'

interface AskTandemProps {
  projectId?: string
}

export function AskTandem({ projectId }: AskTandemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<
    Array<{
      question: string
      answer: string
      source: string
    }>
  >([])

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim()
    if (!q) return

    setInputQuery('')
    setLoading(true)

    try {
      const res = await askTandemQuestion(q, projectId)
      setConversation(prev => [
        ...prev,
        {
          question: q,
          answer: res.answer,
          source: res.source,
        },
      ])
    } catch {
      setConversation(prev => [
        ...prev,
        {
          question: q,
          answer: 'Unable to connect to intelligence API. Using cached team state answer.',
          source: 'Project Alpha State',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all group border border-blue-400/30"
      >
        <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
        <span>Ask Tandem</span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white/90">
          ⌘K
        </kbd>
      </button>

      {/* Floating Lightweight Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-[#0b101d]/95 backdrop-blur-xl rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150 text-slate-100">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.08] bg-[#070b14] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider leading-none">
                  Ask Tandem
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Persistent Memory Query
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Answers & Citations */}
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {conversation.length === 0 && !loading && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center space-y-1.5">
                <p className="text-xs font-semibold text-slate-300">Ready for questions</p>
                <p className="text-[11px] text-slate-500">
                  Ask any question about your live meeting decisions, assigned tasks, or engineering state.
                </p>
              </div>
            )}

            {conversation.map((item, idx) => (
              <div key={idx} className="space-y-2 text-xs">
                {/* User query */}
                <div className="p-3 rounded-2xl bg-white/[0.06] text-slate-200 font-semibold text-right">
                  &ldquo;{item.question}&rdquo;
                </div>

                {/* AI Answer & Source */}
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-xs space-y-2.5 text-left">
                  <p className="text-slate-200 leading-relaxed font-normal">
                    {item.answer}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 pt-2 border-t border-blue-500/20">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Source: {item.source}</span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="p-3.5 rounded-2xl bg-white/[0.04] text-slate-400 text-xs flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Searching team decisions and standup transcripts...</span>
              </div>
            )}
          </div>

          {/* Quick Query Suggestion Chip */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#070b14]/50">
            <button
              onClick={() => handleAsk('What did we decide about the database?')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline text-left block truncate"
            >
              💡 &quot;What did we decide about the database?&quot;
            </button>
          </div>

          {/* Input */}
          <div className="p-3.5 border-t border-white/[0.08] bg-[#0b101d] flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Ask about team decisions or tasks..."
              className="flex-1 text-xs font-sans px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white placeholder-slate-500"
            />
            <button
              onClick={() => handleAsk()}
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 active:scale-95 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

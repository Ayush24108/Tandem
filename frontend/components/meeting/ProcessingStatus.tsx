import { Brain, RefreshCw, CheckCircle2, Layers } from 'lucide-react'

interface ProcessingStatusProps {
  stage?: number
}

const steps = [
  { label: 'Audio captured', stage: 1 },
  { label: 'Transcribing conversation', stage: 2 },
  { label: 'Understanding context', stage: 3 },
  { label: 'Extracting decisions & tasks', stage: 4 },
  { label: 'Updating Team State', stage: 5 },
]

export function ProcessingStatus({ stage = 2 }: ProcessingStatusProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card max-w-md w-full mx-auto text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4 shadow-sm">
        <Brain className="w-7 h-7 animate-pulse" />
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1">
        Processing Meeting Intelligence
      </h3>
      <p className="text-xs text-slate-500 mb-6">
        Extracting persistent architectural decisions and tasks...
      </p>

      <div className="space-y-2.5 text-left">
        {steps.map(step => {
          const isDone = stage > step.stage
          const isCurrent = stage === step.stage

          return (
            <div
              key={step.stage}
              className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-colors ${
                isDone
                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                  : isCurrent
                    ? 'bg-blue-50/50 border-blue-200 text-blue-900 font-semibold'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : isCurrent ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
              )}
              <span>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

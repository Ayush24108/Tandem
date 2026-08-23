const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface CatchMeUpBriefing {
  user_name: string
  summary: string
  metrics: {
    decisions_count: number
    tasks_count: number
    risks_count: number
    unresolved_count: number
    user_tasks_count: number
  }
  key_decisions: string[]
  key_tasks: string[]
}

export async function fetchCatchMeUpBriefing(
  projectId: string = 'project-alpha',
  userName: string = 'Manit'
): Promise<CatchMeUpBriefing> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/catch-me-up?user_name=${encodeURIComponent(userName)}`, {
      method: 'POST',
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('[Tandem] Catch-me-up API error:', err)
  }

  return {
    user_name: userName,
    summary: `While you were away, the team confirmed PostgreSQL as the primary database, assigned schema design to Ayyush, and identified authentication integration as the key risk.`,
    metrics: {
      decisions_count: 2,
      tasks_count: 3,
      risks_count: 1,
      unresolved_count: 1,
      user_tasks_count: 1,
    },
    key_decisions: ['Selected PostgreSQL for architectural state', 'Enabled Web Audio frequency diarization'],
    key_tasks: ['Build database schema → Ayyush', 'Complete frontend auth & meeting UI → Kangna'],
  }
}

import { mockAskTandemAnswers } from '@/data/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AskTandemResponse {
  answer: string
  source: string
  sources?: Array<{ type: string; id: string; title: string }>
}

/**
 * Ask Tandem a natural-language question about the project.
 * Backend endpoint: POST /api/intelligence/ask
 * Request body: { query, project_id, team_state, recent_transcripts }
 */
export async function askTandemQuestion(
  question: string,
  projectId?: string,
  teamState?: Record<string, unknown>
): Promise<AskTandemResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/intelligence/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: question,
        project_id: projectId,
        team_state: teamState || {},
        recent_transcripts: [],
      }),
    })

    if (!res.ok) {
      console.warn(`[Tandem] Ask Tandem failed (${res.status}), using local fallback`)
      return _localFallback(question)
    }

    const data = await res.json()
    return {
      answer: data.answer || 'No answer returned.',
      source: (data.sources?.[0]?.title) || 'Tandem AI',
      sources: data.sources || [],
    }
  } catch (err) {
    console.warn('[Tandem] Ask Tandem error, using local fallback:', err)
    return _localFallback(question)
  }
}

function _localFallback(question: string): AskTandemResponse {
  const qLower = question.toLowerCase()
  if (qLower.includes('database') || qLower.includes('db') || qLower.includes('postgres')) {
    return { ...mockAskTandemAnswers['database'], sources: [] }
  }
  return { ...mockAskTandemAnswers['default'], sources: [] }
}

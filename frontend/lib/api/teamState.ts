import { mockAskTandemAnswers } from '@/data/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AskTandemResponse {
  answer: string
  source: string
}

export async function askTandemQuestion(
  question: string,
  projectId?: string
): Promise<AskTandemResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/team-state/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, projectId }),
    })
    if (!res.ok) throw new Error('Query failed')
    return await res.json()
  } catch {
    const qLower = question.toLowerCase()
    if (qLower.includes('database') || qLower.includes('db') || qLower.includes('postgres')) {
      return mockAskTandemAnswers['database']
    }
    return mockAskTandemAnswers['default']
  }
}

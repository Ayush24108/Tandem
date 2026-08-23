import { MeetingIntelligence, TranscriptEntry } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Upload real recorded audio and high-fidelity live speech transcript to the backend.
 * Backend endpoint: POST /meetings/{meetingId}/audio
 */
export async function uploadMeetingAudio(
  audioBlob: Blob,
  meetingId: string,
  clientTranscript?: string
): Promise<{ success: boolean; url?: string; transcript?: TranscriptEntry[] }> {
  try {
    const ext = audioBlob.type.includes('webm') ? '.webm' : audioBlob.type.includes('mp4') ? '.mp4' : '.wav'
    const formData = new FormData()
    formData.append('audio', audioBlob, `meeting_${meetingId}${ext}`)
    if (clientTranscript) {
      formData.append('client_transcript', clientTranscript)
    }

    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/audio`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      console.warn(`[Tandem] Audio upload returned status ${res.status}`)
      return { success: false, transcript: [] }
    }

    const data = await res.json()

    // Parse transcript lines into structured TranscriptEntry items
    const rawTranscript = data.transcript || clientTranscript || ''
    const transcriptEntries: TranscriptEntry[] = rawTranscript
      .split('\n')
      .filter(Boolean)
      .map((line: string, idx: number) => {
        const colonIdx = line.indexOf(':')
        const speaker = colonIdx > 0 ? line.slice(0, colonIdx).trim() : `Speaker`
        const text = colonIdx > 0 ? line.slice(colonIdx + 1).trim() : line.trim()
        return { id: `tr-${Date.now()}-${idx}`, speaker, text }
      })

    return { success: true, url: data.meeting_id, transcript: transcriptEntries }
  } catch (err) {
    console.warn('[Tandem] Audio upload network error:', err)
    if (clientTranscript) {
      const fallbackEntries: TranscriptEntry[] = clientTranscript
        .split('\n')
        .filter(Boolean)
        .map((line: string, idx: number) => {
          const colonIdx = line.indexOf(':')
          const speaker = colonIdx > 0 ? line.slice(0, colonIdx).trim() : `Speaker`
          const text = colonIdx > 0 ? line.slice(colonIdx + 1).trim() : line.trim()
          return { id: `tr-${Date.now()}-${idx}`, speaker, text }
        })
      return { success: true, transcript: fallbackEntries }
    }
    return { success: false, transcript: [] }
  }
}

/**
 * Trigger ROPA analysis on the uploaded transcript.
 * Backend endpoint: POST /meetings/{meetingId}/process
 */
export async function extractMeetingIntelligence(
  meetingId: string,
  clientTranscript?: string
): Promise<MeetingIntelligence> {
  try {
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (clientTranscript && clientTranscript.trim()) {
      options.body = JSON.stringify({ transcript: clientTranscript.trim() })
    }

    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/process`, options)

    if (res.ok) {
      const data = await res.json()

      const decisions = (data.decisions || []).map(
        (d: { title?: string; content?: string; reason?: string; status?: string }) => ({
          title: d.title || d.content || '',
          reason: d.reason || '',
          status: d.status || 'confirmed',
        })
      )

      const actionItems = (data.tasks || []).map(
        (t: { title?: string; owner?: string; assignee?: string; status?: string; priority?: string }) => ({
          task: t.title || '',
          assignee: t.owner || t.assignee || 'Unassigned',
          priority: (t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium') as 'low' | 'medium' | 'high',
        })
      )

      const risks = (data.risks || []).map(
        (r: { title?: string; description?: string; severity?: string }) => ({
          title: r.title || r.description || '',
          severity: r.severity || 'medium',
          description: r.description || '',
        })
      )

      const unresolved = (data.unresolved || []).map(
        (u: { title?: string; description?: string }) => ({
          title: u.title || u.description || '',
          description: u.description || '',
        })
      )

      if (decisions.length > 0 || actionItems.length > 0 || risks.length > 0) {
        return {
          decision: decisions[0],
          decisions,
          actionItems,
          risks,
          unresolved,
          summary: `Meeting synthesized: ${decisions.length} decision(s), ${actionItems.length} task(s), ${risks.length} risk(s).`,
        }
      }
    }
  } catch (err) {
    console.warn('[Tandem] Backend intelligence extraction error, using client extraction:', err)
  }

  // Client-side extraction fallback if transcript was captured
  if (clientTranscript && clientTranscript.trim()) {
    const lines = clientTranscript.split('\n').filter(Boolean)
    const decisions: Array<{ title: string; reason: string; status: string }> = []
    const actionItems: Array<{ task: string; assignee: string; priority: 'low' | 'medium' | 'high' }> = []
    const risks: Array<{ title: string; severity: string; description: string }> = []
    const unresolved: Array<{ title: string; description: string }> = []

    for (const line of lines) {
      const lower = line.toLowerCase()
      const colonIdx = line.indexOf(':')
      const speaker = colonIdx > 0 ? line.slice(0, colonIdx).trim() : 'Team Member'
      const utterance = colonIdx > 0 ? line.slice(colonIdx + 1).trim() : line.trim()

      if (lower.includes('decide') || lower.includes("let's use") || lower.includes('agree') || lower.includes('confirmed')) {
        decisions.push({
          title: utterance,
          reason: `Confirmed by ${speaker} during standup.`,
          status: 'confirmed',
        })
      } else if (lower.includes('i will') || lower.includes("i'll") || lower.includes('task') || lower.includes('handle') || lower.includes('implement')) {
        actionItems.push({
          task: utterance,
          assignee: speaker,
          priority: 'medium',
        })
      } else if (lower.includes('risk') || lower.includes('blocker') || lower.includes('delay') || lower.includes('spike') || lower.includes('latency')) {
        risks.push({
          title: utterance,
          severity: 'medium',
          description: `Identified by ${speaker}: ${utterance}`,
        })
      } else if (lower.includes('maybe') || lower.includes('not sure') || lower.includes('discuss tomorrow')) {
        unresolved.push({
          title: utterance,
          description: `Open topic flagged by ${speaker}`,
        })
      }
    }

    if (decisions.length > 0 || actionItems.length > 0 || risks.length > 0) {
      return {
        decision: decisions[0],
        decisions,
        actionItems,
        risks,
        unresolved,
        summary: `Meeting synthesized: ${decisions.length} decision(s), ${actionItems.length} task(s), ${risks.length} risk(s).`,
      }
    }
  }

  return {
    decisions: [],
    actionItems: [],
    risks: [],
    unresolved: [],
    summary: 'No actionable entities identified in transcript.',
  }
}

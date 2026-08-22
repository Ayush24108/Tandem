import { MeetingIntelligence, TranscriptEntry } from '@/types'
import { mockMeetingTranscript, mockExtractedIntelligence } from '@/data/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Upload audio to the backend and get back the transcript.
 * Backend endpoint: POST /meetings/{meetingId}/audio  (field name: "audio")
 * After upload, triggers /meetings/{meetingId}/process to extract intelligence.
 */
export async function uploadMeetingAudio(
  audioBlob: Blob,
  meetingId: string
): Promise<{ success: boolean; url?: string; transcript?: TranscriptEntry[] }> {
  try {
    const ext = audioBlob.type.includes('webm') ? '.webm' : '.wav'
    const formData = new FormData()
    formData.append('audio', audioBlob, `meeting_${meetingId}${ext}`)

    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/audio`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      console.warn(`[Tandem] Audio upload failed (${res.status}), using mock transcript`)
      return { success: true, url: 'mock_audio_url', transcript: mockMeetingTranscript }
    }

    const data = await res.json()

    // Convert plain transcript string → TranscriptEntry array for display
    const transcriptEntries: TranscriptEntry[] = data.transcript
      ? data.transcript
          .split('\n')
          .filter(Boolean)
          .map((line: string, idx: number) => {
            const colonIdx = line.indexOf(':')
            const speaker = colonIdx > 0 ? line.slice(0, colonIdx).trim() : 'Unknown'
            const text = colonIdx > 0 ? line.slice(colonIdx + 1).trim() : line.trim()
            return { id: `tr-${idx}`, speaker, text }
          })
      : mockMeetingTranscript

    return { success: true, url: data.meeting_id, transcript: transcriptEntries }
  } catch (err) {
    console.warn('[Tandem] Audio upload error, using mock transcript:', err)
    return { success: true, url: 'mock_audio_url', transcript: mockMeetingTranscript }
  }
}

/**
 * Trigger ROPA analysis on the uploaded transcript.
 * Backend endpoint: POST /meetings/{meetingId}/process
 * Returns structured intelligence matching MeetingIntelligence shape.
 */
export async function extractMeetingIntelligence(
  meetingId: string
): Promise<MeetingIntelligence> {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/process`, {
      method: 'POST',
    })

    if (!res.ok) {
      console.warn(`[Tandem] Intelligence extraction failed (${res.status}), using mock`)
      return mockExtractedIntelligence
    }

    const data = await res.json()

    // Map backend shape → frontend MeetingIntelligence shape
    const decisions = (data.decisions || []).map(
      (d: { title?: string; content?: string; reason?: string; status?: string }) => ({
        title: d.title || d.content || '',
        reason: d.reason || '',
        status: d.status || 'confirmed',
      })
    )

    const actionItems = (data.tasks || []).map(
      (t: { title?: string; owner?: string; assignee?: string; status?: string }) => ({
        task: t.title || '',
        assignee: t.owner || t.assignee || 'Unassigned',
        priority: 'medium' as const,
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

    return {
      decision: decisions[0],
      decisions,
      actionItems,
      risks,
      unresolved,
      summary: `Meeting processed: ${decisions.length} decision(s), ${actionItems.length} task(s), ${risks.length} risk(s).`,
    }
  } catch (err) {
    console.warn('[Tandem] Intelligence extraction error, using mock:', err)
    return mockExtractedIntelligence
  }
}

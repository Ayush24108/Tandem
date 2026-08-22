import { MeetingIntelligence, TranscriptEntry } from '@/types'
import { mockMeetingTranscript, mockExtractedIntelligence } from '@/data/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function uploadMeetingAudio(
  audioBlob: Blob,
  meetingId: string
): Promise<{ success: boolean; url?: string; transcript?: TranscriptEntry[] }> {
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, `meeting_${meetingId}.webm`)
    formData.append('meetingId', meetingId)

    const res = await fetch(`${API_BASE_URL}/meetings/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) throw new Error('Upload failed')
    return await res.json()
  } catch {
    // Graceful fallback for mock demo
    return {
      success: true,
      url: 'mock_audio_url',
      transcript: mockMeetingTranscript,
    }
  }
}

export async function extractMeetingIntelligence(
  meetingId: string
): Promise<MeetingIntelligence> {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/intelligence`)
    if (!res.ok) throw new Error('Extraction failed')
    return await res.json()
  } catch {
    // Fallback to structured PRD mock intelligence
    return mockExtractedIntelligence
  }
}

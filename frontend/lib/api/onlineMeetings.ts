import { TandemUser } from './auth'

export interface OnlineMeeting {
  id: string
  title: string
  project_id: string
  host_id: string
  status?: string
  participants: TandemUser[]
  date?: string
  created_at?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function createOnlineMeeting(payload: {
  title: string
  projectId: string
  hostId?: string
  participantIds?: string[]
}): Promise<OnlineMeeting | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        project_id: payload.projectId,
        host_id: payload.hostId || 'usr-manit',
        participant_ids: payload.participantIds || [],
      }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('[Tandem] Create online meeting error:', err)
  }

  // Fallback local meeting creation
  const fallbackId = `meeting-${Date.now()}`
  return {
    id: fallbackId,
    title: payload.title,
    project_id: payload.projectId,
    host_id: payload.hostId || 'usr-manit',
    status: 'live',
    participants: [
      { id: 'usr-manit', name: 'Manit Sharma', role: 'AI & Backend Lead', initials: 'MS', avatar_color: 'bg-purple-600 text-white border-purple-400' },
      { id: 'usr-ayyush', name: 'Ayyush', role: 'Backend & Data Lead', initials: 'AY', avatar_color: 'bg-cyan-600 text-white border-cyan-400' },
      { id: 'usr-kangna', name: 'Kangna', role: 'Frontend & UX Lead', initials: 'KA', avatar_color: 'bg-indigo-600 text-white border-indigo-400' },
    ],
    date: new Date().toISOString(),
  }
}

export async function getOnlineMeeting(meetingId: string): Promise<OnlineMeeting | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('[Tandem] Fetch meeting error:', err)
  }

  return {
    id: meetingId,
    title: 'Product Architecture & Sprint Sync',
    project_id: 'project-alpha',
    host_id: 'usr-manit',
    status: 'live',
    participants: [
      { id: 'usr-manit', name: 'Manit Sharma', role: 'Host • AI & Backend Lead', initials: 'MS', avatar_color: 'bg-purple-600 text-white border-purple-400' },
      { id: 'usr-ayyush', name: 'Ayyush', role: 'Backend & Data Lead', initials: 'AY', avatar_color: 'bg-cyan-600 text-white border-cyan-400' },
      { id: 'usr-kangna', name: 'Kangna', role: 'Frontend & UX Lead', initials: 'KA', avatar_color: 'bg-indigo-600 text-white border-indigo-400' },
    ],
    date: new Date().toISOString(),
  }
}

export async function listOnlineMeetings(projectId?: string): Promise<OnlineMeeting[]> {
  try {
    const url = projectId ? `${API_BASE_URL}/meetings?project_id=${projectId}` : `${API_BASE_URL}/meetings`
    const res = await fetch(url)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('[Tandem] List meetings error:', err)
  }

  return [
    {
      id: 'meeting-alpha-1',
      title: 'Product Architecture Discussion',
      project_id: 'project-alpha',
      host_id: 'usr-manit',
      status: 'ended',
      participants: [
        { id: 'usr-manit', name: 'Manit Sharma', role: 'Host', initials: 'MS' },
        { id: 'usr-ayyush', name: 'Ayyush', role: 'Engineer', initials: 'AY' },
        { id: 'usr-kangna', name: 'Kangna', role: 'Engineer', initials: 'KA' },
      ],
      date: 'Today',
    }
  ]
}

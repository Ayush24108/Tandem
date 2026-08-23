export interface TandemUser {
  id: string
  name: string
  role: string
  team_id?: string
  nfc_id?: string
  avatar_color?: string
  initials?: string
  created_at?: string
}

export interface TandemTeam {
  id: string
  name: string
  created_at?: string
}

export interface AuthSession {
  token: string
  user: TandemUser
  team: TandemTeam
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SESSION_STORAGE_KEY = 'tandem_auth_session'

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {}
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {}
}

export async function identifyByNfc(nfcId: string): Promise<{
  success: boolean
  user?: TandemUser
  team?: TandemTeam
  requiresVoice?: boolean
  error?: string
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/nfc/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfc_id: nfcId }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { success: false, error: errData.detail || 'NFC Identification failed.' }
    }
    const data = await res.json()
    return {
      success: true,
      user: data.user,
      team: data.team,
      requiresVoice: data.requires_voice_verification,
    }
  } catch (err) {
    // Fallback demo matching
    const mockUsers: Record<string, TandemUser> = {
      'TDM-001': { id: 'usr-manit', name: 'Manit Sharma', role: 'AI & Backend Lead', nfc_id: 'TDM-001', initials: 'MS', avatar_color: 'bg-purple-600 text-white border-purple-400' },
      'TDM-002': { id: 'usr-ayyush', name: 'Ayyush', role: 'Backend & Data Lead', nfc_id: 'TDM-002', initials: 'AY', avatar_color: 'bg-cyan-600 text-white border-cyan-400' },
      'TDM-003': { id: 'usr-kangna', name: 'Kangna', role: 'Frontend & UX Lead', nfc_id: 'TDM-003', initials: 'KA', avatar_color: 'bg-indigo-600 text-white border-indigo-400' },
    }
    const matched = mockUsers[nfcId]
    if (matched) {
      return {
        success: true,
        user: matched,
        team: { id: 'team-tandem-1', name: 'Tandem Development Team' },
        requiresVoice: true,
      }
    }
    return { success: false, error: 'Network error communicating with Tandem Auth server.' }
  }
}

export async function verifyVoice(
  userId: string,
  detectedF0?: number
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/voice/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, detected_f0: detectedF0 }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { success: false, error: errData.detail || 'Voice verification failed.' }
    }
    const data = await res.json()
    const session: AuthSession = {
      token: data.token,
      user: data.user,
      team: data.team,
    }
    saveSession(session)
    return { success: true, session }
  } catch (err) {
    // Fallback demo verification
    const session: AuthSession = {
      token: `tdm_sess_fallback_${userId}`,
      user: { id: userId, name: userId === 'usr-ayyush' ? 'Ayyush' : userId === 'usr-kangna' ? 'Kangna' : 'Manit Sharma', role: 'Engineer', initials: 'TD' },
      team: { id: 'team-tandem-1', name: 'Tandem Development Team' },
    }
    saveSession(session)
    return { success: true, session }
  }
}

export async function signupTeamMember(payload: {
  name: string
  role: string
  nfc_id: string
  voice_profile?: any
}): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { success: false, error: errData.detail || 'Registration failed.' }
    }
    const data = await res.json()
    const session: AuthSession = {
      token: data.token,
      user: data.user,
      team: data.team,
    }
    saveSession(session)
    return { success: true, session }
  } catch (err) {
    const initials = payload.name.slice(0, 2).toUpperCase()
    const session: AuthSession = {
      token: `tdm_sess_local_${Date.now()}`,
      user: { id: `usr-${Date.now()}`, name: payload.name, role: payload.role, nfc_id: payload.nfc_id, initials },
      team: { id: 'team-tandem-1', name: 'Tandem Development Team' },
    }
    saveSession(session)
    return { success: true, session }
  }
}

export async function demoLogin(userId: string): Promise<{ success: boolean; session?: AuthSession }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) {
      const data = await res.json()
      const session: AuthSession = {
        token: data.token,
        user: data.user,
        team: data.team,
      }
      saveSession(session)
      return { success: true, session }
    }
  } catch {}

  const mockUsers: Record<string, TandemUser> = {
    'usr-manit': { id: 'usr-manit', name: 'Manit Sharma', role: 'AI & Backend Lead', nfc_id: 'TDM-001', initials: 'MS', avatar_color: 'bg-purple-600 text-white border-purple-400' },
    'usr-ayyush': { id: 'usr-ayyush', name: 'Ayyush', role: 'Backend & Data Lead', nfc_id: 'TDM-002', initials: 'AY', avatar_color: 'bg-cyan-600 text-white border-cyan-400' },
    'usr-kangna': { id: 'usr-kangna', name: 'Kangna', role: 'Frontend & UX Lead', nfc_id: 'TDM-003', initials: 'KA', avatar_color: 'bg-indigo-600 text-white border-indigo-400' },
  }
  const user = mockUsers[userId] || mockUsers['usr-manit']
  const session: AuthSession = {
    token: `tdm_sess_demo_${user.id}`,
    user,
    team: { id: 'team-tandem-1', name: 'Tandem Development Team' },
  }
  saveSession(session)
  return { success: true, session }
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  const existing = getStoredSession()
  try {
    const headers: Record<string, string> = {}
    if (existing?.token) {
      headers['Authorization'] = `Bearer ${existing.token}`
    }
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers })
    if (res.ok) {
      const data = await res.json()
      const session: AuthSession = {
        token: existing?.token || `tdm_sess_${data.user.id}`,
        user: data.user,
        team: data.team,
      }
      saveSession(session)
      return session
    }
  } catch {}
  return existing
}

export async function getTeamUsers(): Promise<TandemUser[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`)
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  return [
    { id: 'usr-manit', name: 'Manit Sharma', role: 'AI & Backend Lead', nfc_id: 'TDM-001', initials: 'MS', avatar_color: 'bg-purple-600 text-white border-purple-400' },
    { id: 'usr-ayyush', name: 'Ayyush', role: 'Backend & Data Lead', nfc_id: 'TDM-002', initials: 'AY', avatar_color: 'bg-cyan-600 text-white border-cyan-400' },
    { id: 'usr-kangna', name: 'Kangna', role: 'Frontend & UX Lead', nfc_id: 'TDM-003', initials: 'KA', avatar_color: 'bg-indigo-600 text-white border-indigo-400' },
    { id: 'usr-rahul', name: 'Rahul', role: 'Architect & DB Lead', nfc_id: 'TDM-004', initials: 'RH', avatar_color: 'bg-blue-600 text-white border-blue-400' },
  ]
}

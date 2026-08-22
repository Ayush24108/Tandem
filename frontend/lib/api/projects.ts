import { Project } from '@/types'
import { initialProjects } from '@/data/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// In-memory cache used when Supabase is unavailable (demo/fallback mode)
let projectsCache: Project[] = [...initialProjects]

/**
 * List all projects.
 * Backend endpoint: GET /projects
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`API responded ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data
    return projectsCache // fall back if Supabase is empty
  } catch (err) {
    console.warn('[Tandem] getProjects fallback to mock:', err)
    return projectsCache
  }
}

/**
 * Fetch a single project with its full intelligence (decisions/tasks/risks/unresolved).
 * Backend endpoint: GET /projects/{id}/full  → merges state into Project shape.
 * Falls back to GET /projects/{id} (plain row) and then to in-memory mock.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  // 1. Try /projects/{id}/full — returns Project shape with all intelligence
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}/full`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data && data.id) return data as Project
    }
  } catch {
    // fall through
  }

  // 2. Try /projects/{id} — plain project row, no intelligence
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data && data.id) {
        // Hydrate missing fields with safe defaults so ProjectDetailView doesn't crash
        return {
          ...data,
          tagline: data.tagline || data.description?.slice(0, 60) || '',
          members: data.members || [],
          teamPulse: data.teamPulse || {
            decisionsCount: 0,
            tasksCompletedCount: 0,
            unresolvedCount: 0,
            risksCount: 0,
          },
          decisions: data.decisions || [],
          tasks: data.tasks || [],
          risks: data.risks || [],
          unresolvedIssues: data.unresolvedIssues || [],
          recentActivity: data.recentActivity || [],
        } as Project
      }
    }
  } catch {
    // fall through
  }

  // 3. In-memory mock fallback
  console.warn(`[Tandem] getProjectById(${id}) using local mock`)
  return projectsCache.find(p => p.id === id) || null
}

/**
 * Update local in-memory project state (optimistic update for demo flow).
 * NOTE: In production, changes are persisted to Supabase via the meeting /process endpoint.
 * This function is intentionally kept for local UI optimism during demo.
 */
export function updateLocalProjectState(updatedProject: Project): void {
  projectsCache = projectsCache.map(p => (p.id === updatedProject.id ? updatedProject : p))
}

export function getCachedProject(id: string): Project | null {
  return projectsCache.find(p => p.id === id) || null
}

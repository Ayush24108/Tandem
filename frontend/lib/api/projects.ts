import { Project } from '@/types'
import { initialProjects } from '@/data/mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// In-memory state cache for local mutations across the session
let projectsCache: Project[] = [...initialProjects]

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, { cache: 'no-store' })
    if (!res.ok) throw new Error('API failed')
    return await res.json()
  } catch {
    // Fallback to local mock data
    return projectsCache
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('API failed')
    return await res.json()
  } catch {
    return projectsCache.find(p => p.id === id) || null
  }
}

export function updateLocalProjectState(updatedProject: Project): void {
  projectsCache = projectsCache.map(p => (p.id === updatedProject.id ? updatedProject : p))
}

export function getCachedProject(id: string): Project | null {
  return projectsCache.find(p => p.id === id) || null
}

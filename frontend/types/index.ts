export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface TeamMember {
  id: string
  name: string
  initials: string
  role: string
  avatarColor?: string
}

export interface Task {
  id: string
  title: string
  assignee: TeamMember | string
  status: 'todo' | 'in-progress' | 'completed' | 'done' | 'blocked'
  priority?: Priority
  projectId?: string
}

export interface Decision {
  id: string
  title: string
  reason?: string
  status?: 'confirmed' | 'proposed' | 'superseded'
  madeBy?: TeamMember[] | string[]
  timestamp?: string
  madeAt?: string
  projectId?: string
}

export interface Risk {
  id: string
  title: string
  description?: string
  severity?: RiskSeverity
  status?: 'open' | 'mitigated' | 'resolved'
  projectId?: string
}

export interface UnresolvedIssue {
  id: string
  title: string
  description?: string
  raisedBy?: TeamMember | string
  raisedAt?: string
  projectId?: string
}

export interface RecentActivityItem {
  id: string
  text: string
  timestamp: string
  author?: string
  type?: 'decision' | 'task' | 'meeting' | 'risk'
}

export interface TeamPulse {
  decisionsCount: number
  tasksCompletedCount: number
  unresolvedCount: number
  risksCount: number
}

export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  members: TeamMember[]
  teamPulse: TeamPulse
  decisions: Decision[]
  tasks: Task[]
  risks: Risk[]
  unresolvedIssues: UnresolvedIssue[]
  recentActivity: RecentActivityItem[]
}

export interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp?: string
  timeInSeconds?: number
}

export interface MeetingIntelligence {
  decision?: {
    title: string
    reason: string
    status: string
  }
  decisions?: Array<{
    title: string
    reason: string
    status: string
  }>
  actionItems: Array<{
    task: string
    assignee: string
    priority?: Priority
  }>
  risks: Array<{
    title: string
    severity?: string
    description?: string
  }>
  unresolved: Array<{
    title: string
    description?: string
  }>
  summary?: string
}

export interface Meeting {
  id: string
  title: string
  projectId: string
  projectName?: string
  duration?: string
  participants: string[] | TeamMember[]
  transcript: TranscriptEntry[]
  intelligence?: MeetingIntelligence
  status: 'idle' | 'recording' | 'processing' | 'complete'
}

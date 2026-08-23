import { Project, TeamMember, MeetingIntelligence, TranscriptEntry } from '@/types'

// Dynamic Initial Team Members (enrolled via NFC + Voiceprint)
export const mockTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Kangna', initials: 'KA', role: 'Frontend & UX Lead', avatarColor: 'bg-indigo-600 text-white border-indigo-400' },
  { id: 'u2', name: 'Rahul', initials: 'RH', role: 'Architect & DB Lead', avatarColor: 'bg-blue-600 text-white border-blue-400' },
  { id: 'u3', name: 'Manit', initials: 'MA', role: 'AI & Backend Lead', avatarColor: 'bg-purple-600 text-white border-purple-400' },
  { id: 'u4', name: 'Priya', initials: 'PR', role: 'Security & Auth Lead', avatarColor: 'bg-emerald-600 text-white border-emerald-400' },
]

// Clean initial projects ready for live test runs (0 pre-populated decisions/tasks)
export const initialProjects: Project[] = [
  {
    id: 'project-alpha',
    name: 'Project Alpha',
    tagline: 'Living Engineering Sync',
    description: 'Real-time engineering intelligence workspace capturing technical decisions, tasks, and risks from live standups.',
    members: [...mockTeamMembers],
    teamPulse: {
      decisionsCount: 0,
      tasksCompletedCount: 0,
      unresolvedCount: 0,
      risksCount: 0,
    },
    decisions: [],
    tasks: [],
    risks: [],
    unresolvedIssues: [],
    recentActivity: [
      {
        id: 'act-init',
        text: 'Project Alpha workspace initialized. Ready for live meeting audio capture.',
        timestamp: 'Just now',
        author: 'Tandem System',
        type: 'decision',
      },
    ],
  },
  {
    id: 'project-beta',
    name: 'Infrastructure & Edge AI',
    tagline: 'Edge Speech Cluster',
    description: 'Sub-second audio ingestion and Whisper/Gemini transcription microservices on distributed nodes.',
    members: [mockTeamMembers[0], mockTeamMembers[1]],
    teamPulse: {
      decisionsCount: 0,
      tasksCompletedCount: 0,
      unresolvedCount: 0,
      risksCount: 0,
    },
    decisions: [],
    tasks: [],
    risks: [],
    unresolvedIssues: [],
    recentActivity: [],
  },
]

export const mockMeetingTranscript: TranscriptEntry[] = []

export const mockExtractedIntelligence: MeetingIntelligence = {
  decisions: [],
  actionItems: [],
  risks: [],
  unresolved: [],
  summary: 'No active meeting intelligence synthesized yet.',
}

import { Project, TeamMember, Meeting, MeetingIntelligence } from '@/types'

export const mockTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Rahul', initials: 'RH', role: 'Database Engineer', avatarColor: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'u2', name: 'Manit', initials: 'MA', role: 'AI & Backend Lead', avatarColor: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'u3', name: 'Priya', initials: 'PR', role: 'Full Stack Engineer', avatarColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'u4', name: 'Kangna', initials: 'KA', role: 'Frontend & UX Lead', avatarColor: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'u5', name: 'Ayyush', initials: 'AY', role: 'Backend / Whisper', avatarColor: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
]

export const initialProjects: Project[] = [
  {
    id: 'project-alpha',
    name: 'Project Alpha',
    tagline: 'AI Healthcare Assistant',
    description: 'Clinical documentation intelligence system assisting physicians with real-time audio analysis and medical summary generation.',
    members: [mockTeamMembers[0], mockTeamMembers[1], mockTeamMembers[2], mockTeamMembers[3]],
    teamPulse: {
      decisionsCount: 3,
      tasksCompletedCount: 5,
      unresolvedCount: 2,
      risksCount: 1,
    },
    decisions: [
      {
        id: 'd-1',
        title: 'PostgreSQL selected',
        reason: 'Relational data requirements and ACID compliance for clinical records',
        status: 'confirmed',
        madeBy: [mockTeamMembers[0], mockTeamMembers[1]],
        timestamp: 'Yesterday',
        projectId: 'project-alpha',
      },
      {
        id: 'd-2',
        title: 'FastAPI microservice architecture',
        reason: 'High-performance asynchronous request handling for Whisper streaming',
        status: 'confirmed',
        madeBy: [mockTeamMembers[1]],
        timestamp: '3 days ago',
        projectId: 'project-alpha',
      },
      {
        id: 'd-3',
        title: 'HIPAA compliance audit checklist established',
        reason: 'Legal requirement before clinical test cohort deployment',
        status: 'confirmed',
        madeBy: [mockTeamMembers[2]],
        timestamp: '5 days ago',
        projectId: 'project-alpha',
      },
    ],
    tasks: [
      {
        id: 't-1',
        title: 'Database schema design & migrations',
        assignee: mockTeamMembers[0],
        status: 'in-progress',
        priority: 'high',
        projectId: 'project-alpha',
      },
      {
        id: 't-2',
        title: 'API implementation & routes',
        assignee: mockTeamMembers[1],
        status: 'in-progress',
        priority: 'high',
        projectId: 'project-alpha',
      },
      {
        id: 't-3',
        title: 'Authentication & role-based access',
        assignee: mockTeamMembers[2],
        status: 'todo',
        priority: 'medium',
        projectId: 'project-alpha',
      },
    ],
    risks: [
      {
        id: 'r-1',
        title: 'Backend integration delay',
        description: 'Whisper audio ingestion pipeline needs latency validation with long audio recordings.',
        severity: 'high',
        status: 'open',
        projectId: 'project-alpha',
      },
    ],
    unresolvedIssues: [
      {
        id: 'u-1',
        title: 'Authentication provider',
        description: 'Decide between Supabase Auth or custom JWT token provider.',
        raisedBy: mockTeamMembers[2],
        raisedAt: 'Yesterday',
        projectId: 'project-alpha',
      },
      {
        id: 'u-2',
        title: 'Real-time sync protocol threshold',
        description: 'Evaluate WebSocket overhead vs 15s state polling.',
        raisedBy: mockTeamMembers[1],
        raisedAt: '2 days ago',
        projectId: 'project-alpha',
      },
    ],
    recentActivity: [
      {
        id: 'a-1',
        text: 'PostgreSQL architecture decision confirmed',
        timestamp: '1 hour ago',
        author: 'Rahul',
        type: 'decision',
      },
      {
        id: 'a-2',
        text: 'Assigned Database schema task to Rahul',
        timestamp: '3 hours ago',
        author: 'Manit',
        type: 'task',
      },
      {
        id: 'a-3',
        text: 'Flagged Backend integration delay risk',
        timestamp: 'Yesterday',
        author: 'Priya',
        type: 'risk',
      },
    ],
  },
  {
    id: 'campus-connect',
    name: 'CampusConnect',
    tagline: 'Student Collaboration Platform',
    description: 'Peer-to-peer learning network facilitating project matchmaking, study groups, and cross-department collaboration.',
    members: [mockTeamMembers[2], mockTeamMembers[3], mockTeamMembers[4]],
    teamPulse: {
      decisionsCount: 2,
      tasksCompletedCount: 4,
      unresolvedCount: 1,
      risksCount: 0,
    },
    decisions: [
      {
        id: 'd-cc-1',
        title: 'Next.js App Router for server rendering',
        reason: 'Fast student dashboard initial loads and SEO indexing',
        status: 'confirmed',
        timestamp: '2 days ago',
        projectId: 'campus-connect',
      },
      {
        id: 'd-cc-2',
        title: 'Tailwind CSS design tokens established',
        reason: 'Standardized design language for campus branding',
        status: 'confirmed',
        timestamp: '4 days ago',
        projectId: 'campus-connect',
      },
    ],
    tasks: [
      {
        id: 't-cc-1',
        title: 'User profile onboarding wizard',
        assignee: mockTeamMembers[3],
        status: 'in-progress',
        priority: 'high',
        projectId: 'campus-connect',
      },
      {
        id: 't-cc-2',
        title: 'Student directory search filter',
        assignee: mockTeamMembers[2],
        status: 'todo',
        priority: 'medium',
        projectId: 'campus-connect',
      },
    ],
    risks: [],
    unresolvedIssues: [
      {
        id: 'u-cc-1',
        title: 'SSO provider integration with university domains',
        description: 'Awaiting IT approval on OAuth client credentials',
        raisedBy: mockTeamMembers[4],
        raisedAt: '3 days ago',
        projectId: 'campus-connect',
      },
    ],
    recentActivity: [
      {
        id: 'a-cc-1',
        text: 'Tailwind design tokens merged to main',
        timestamp: 'Yesterday',
        author: 'Kangna',
        type: 'task',
      },
    ],
  },
  {
    id: 'eco-track',
    name: 'EcoTrack',
    tagline: 'Supply Chain Carbon Platform',
    description: 'Automated ESG reporting and carbon footprint tracking across Tier 1 and Tier 2 manufacturing partners.',
    members: [mockTeamMembers[0], mockTeamMembers[1], mockTeamMembers[4]],
    teamPulse: {
      decisionsCount: 1,
      tasksCompletedCount: 3,
      unresolvedCount: 1,
      risksCount: 2,
    },
    decisions: [
      {
        id: 'd-et-1',
        title: 'Emission coefficient standard v4.2 adopted',
        reason: 'Aligns with GHG Protocol Corporate Standard',
        status: 'confirmed',
        timestamp: '1 week ago',
        projectId: 'eco-track',
      },
    ],
    tasks: [
      {
        id: 't-et-1',
        title: 'Supplier CSV upload parser & validation',
        assignee: mockTeamMembers[4],
        status: 'in-progress',
        priority: 'high',
        projectId: 'eco-track',
      },
      {
        id: 't-et-2',
        title: 'Scope 1 & 2 automated calculation engine',
        assignee: mockTeamMembers[1],
        status: 'todo',
        priority: 'critical',
        projectId: 'eco-track',
      },
    ],
    risks: [
      {
        id: 'r-et-1',
        title: 'Supplier data formatting discrepancies',
        description: 'Varied non-standard Excel sheets from vendors',
        severity: 'high',
        status: 'open',
        projectId: 'eco-track',
      },
      {
        id: 'r-et-2',
        title: 'Carbon offset API rate limits',
        description: 'Third-party calculation API limits daily calls',
        severity: 'medium',
        status: 'open',
        projectId: 'eco-track',
      },
    ],
    unresolvedIssues: [
      {
        id: 'u-et-1',
        title: 'Historical baseline year definition',
        description: 'Pending client executive confirmation (2022 vs 2023 baseline)',
        raisedBy: mockTeamMembers[0],
        raisedAt: '4 days ago',
        projectId: 'eco-track',
      },
    ],
    recentActivity: [
      {
        id: 'a-et-1',
        text: 'Emission calculation formulas verified',
        timestamp: '2 days ago',
        author: 'Manit',
        type: 'task',
      },
    ],
  },
]

export const mockMeetingTranscript = [
  {
    id: 'tr-1',
    speaker: 'Manit',
    text: "Let's align on the core technical decisions for Project Alpha before we start implementation.",
    timestamp: '00:02',
  },
  {
    id: 'tr-2',
    speaker: 'Rahul',
    text: "We evaluated PostgreSQL versus MongoDB. Given our relational data requirements and strict ACID transactions for healthcare records, PostgreSQL is the clear choice.",
    timestamp: '00:08',
  },
  {
    id: 'tr-3',
    speaker: 'Manit',
    text: "Agreed. Let's lock in PostgreSQL. Rahul, can you take ownership of designing the database schema?",
    timestamp: '00:15',
  },
  {
    id: 'tr-4',
    speaker: 'Rahul',
    text: "Yes, I will finalize the database schema and migration scripts today.",
    timestamp: '00:18',
  },
  {
    id: 'tr-5',
    speaker: 'Manit',
    text: "I will handle the FastAPI API implementation. Priya, could you lead the Authentication module?",
    timestamp: '00:21',
  },
  {
    id: 'tr-6',
    speaker: 'Priya',
    text: "Sounds good, I'll take authentication. One risk to note: backend integration delay might occur if Whisper latency tests take longer.",
    timestamp: '00:24',
  },
]

export const mockExtractedIntelligence: MeetingIntelligence = {
  decision: {
    title: 'Use PostgreSQL',
    reason: 'Relational data requirements and ACID compliance for clinical records',
    status: 'Confirmed',
  },
  decisions: [
    {
      title: 'Use PostgreSQL',
      reason: 'Relational data requirements and ACID compliance for clinical records',
      status: 'Confirmed',
    },
  ],
  actionItems: [
    {
      task: 'Database schema',
      assignee: 'Rahul',
      priority: 'high',
    },
    {
      task: 'API implementation',
      assignee: 'Manit',
      priority: 'high',
    },
    {
      task: 'Authentication',
      assignee: 'Priya',
      priority: 'medium',
    },
  ],
  risks: [
    {
      title: 'Backend integration delay',
      severity: 'high',
      description: 'Audio transcription pipeline latency needs benchmarking before production release.',
    },
  ],
  unresolved: [
    {
      title: 'Authentication provider',
      description: 'Choice between Supabase Auth or custom JWT solution pending security review.',
    },
  ],
  summary: 'The team confirmed PostgreSQL as the primary database for Project Alpha. Action items were assigned to Rahul (Database Schema), Manit (API Implementation), and Priya (Authentication). A potential backend integration risk was identified.',
}

export const mockAskTandemAnswers: Record<string, { answer: string; source: string }> = {
  'database': {
    answer: 'The team selected PostgreSQL because the project requires relational data relationships and strict transaction compliance for healthcare records.',
    source: 'Architecture Meeting (Project Alpha)',
  },
  'default': {
    answer: 'The team confirmed PostgreSQL for data storage, assigned the database schema to Rahul, API routes to Manit, and Authentication to Priya.',
    source: 'Project Alpha Team State',
  },
}

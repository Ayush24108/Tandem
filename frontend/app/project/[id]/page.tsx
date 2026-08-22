import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { getProjectById } from '@/lib/api/projects'
import { notFound } from 'next/navigation'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'
import Dither from '@/components/ui/Dither'
import PersonalLiveStateDrawer from '@/components/features/PersonalLiveStateDrawer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const project = await getProjectById(id)
  if (!project) notFound()

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden relative">
      {/* ── Background Interactive Dither Canvas in Electric Blue ─────────── */}
      <div className="absolute inset-0 z-0 opacity-35 overflow-hidden">
        <Dither
          waveSpeed={0.05}
          waveFrequency={3}
          waveAmplitude={0.3}
          waveColor={[0.15, 0.45, 0.95]}
          colorNum={4}
          pixelSize={2}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.35}
        />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar title="Project State" subtitle={project.name} />
        <ProjectDetailView project={project} />
      </div>

      <PersonalLiveStateDrawer userName="Kangna" role="Lead Frontend Engineer" />
    </div>
  )
}

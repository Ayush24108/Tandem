import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { getProjects } from '@/lib/api/projects'
import { AskTandem } from '@/components/ai/AskTandem'
import Dither from '@/components/ui/Dither'
import PersonalLiveStateDrawer from '@/components/features/PersonalLiveStateDrawer'
import { InteractiveWorkspaceView } from '@/components/workspace/InteractiveWorkspaceView'

export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  const projects = await getProjects()

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
        <TopBar title="Workspace" subtitle="All Initiatives" />
        <InteractiveWorkspaceView initialProjects={projects} />
      </div>

      <AskTandem />
      <PersonalLiveStateDrawer userName="Kangna" role="Lead Frontend Engineer" />
    </div>
  )
}

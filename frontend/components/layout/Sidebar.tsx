'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderGit2,
  Mic,
  Sparkles,
  Layers,
  Activity,
  Radio,
} from 'lucide-react'
import TandemLogo from '@/components/ui/TandemLogo'

const navItems = [
  { label: 'Workspace', href: '/workspace', icon: LayoutDashboard, badge: '3' },
  { label: 'Project Alpha', href: '/project/project-alpha', icon: FolderGit2, isProject: true },
  { label: 'Live Meeting', href: '/meeting', icon: Mic, live: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen border-r border-white/[0.08] bg-[#070b14]/90 backdrop-blur-md select-none relative z-30">
      {/* Brand Header with Tandem Logo & Metallic Paint */}
      <div className="flex items-center gap-3 px-4 h-20 border-b border-white/[0.08] bg-[#070b14]">
        <Link href="/" className="flex items-center gap-2.5 group w-full">
          <TandemLogo size="md" withMetallic={true} showText={true} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono">
            Navigation
          </span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>sync active</span>
          </div>
        </div>

        {navItems.map(({ label, href, icon: Icon, badge, live }) => {
          const isActive = pathname === href || (href !== '/workspace' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 shadow-sm border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white/[0.06] text-slate-400 group-hover:bg-white/[0.12] group-hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <span className="truncate flex-1">{label}</span>

              {live && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  REC
                </span>
              )}

              {badge && (
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Persistent Concept Callout */}
      <div className="p-3.5 mx-3 mb-2 rounded-2xl bg-gradient-to-br from-white/[0.04] via-blue-950/20 to-white/[0.02] border border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Living Team State</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
          Audio conversations automatically synthesize into decisions and assigned tasks.
        </p>
      </div>

      {/* User Profile Footer (with padding for floating pill) */}
      <div className="p-3 border-t border-white/[0.08] bg-[#070b14] pb-6">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            KA
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-slate-200 truncate">Kangna</p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate font-mono">Frontend / UX</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, Workflow, ShieldCheck, Package, Skull, Send, Radar,
  Trophy, Settings as SettingsIcon, Cpu, Globe2, Megaphone, FileCode, History,
  Bot, KeyRound, Users, CalendarClock, Rocket, LayoutDashboard, Plus, ChevronDown, DollarSign,
  Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> }

const home: Item = { to: '/', label: 'Home', icon: LayoutDashboard }

const sections: { title: string; items: Item[]; collapsible?: boolean }[] = [
  {
    title: 'Operate',
    items: [
      { to: '/create', label: 'Build a product', icon: Plus },
      { to: '/ceo', label: 'CEO', icon: Bot },
      { to: '/team', label: 'AI Team', icon: Users },
      { to: '/autopilot', label: 'Autopilot', icon: Rocket },
      { to: '/marketing', label: 'Marketing', icon: Megaphone },
      { to: '/browser', label: 'Browser', icon: Globe2 },
      { to: '/products', label: 'Products', icon: Package },
      { to: '/review', label: 'Review queue', icon: ShieldCheck },
      { to: '/publish', label: 'Publish center', icon: Send },
      { to: '/schedules', label: 'Scheduler', icon: CalendarClock },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/revenue', label: 'Revenue', icon: DollarSign },
      { to: '/trends', label: 'Trend radar', icon: Radar },
      { to: '/winners', label: 'Winner patterns', icon: Trophy },
      { to: '/graveyard', label: 'Graveyard', icon: Skull },
      { to: '/history', label: 'Run history', icon: History },
    ],
  },
  {
    title: 'Manage',
    collapsible: true,
    items: [
      { to: '/manager/domains', label: 'Domains & categories', icon: LayoutGrid },
      { to: '/manager/platforms', label: 'Platforms', icon: Globe2 },
      { to: '/manager/social', label: 'Social channels', icon: Megaphone },
      { to: '/manager/prompts', label: 'Prompts', icon: FileCode },
      { to: '/manager/ai', label: 'AI models', icon: Cpu },
      { to: '/settings/keys', label: 'API keys', icon: KeyRound },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center">
        <Workflow className="h-4 w-4 text-primary-foreground" />
      </div>
      <div>
        <div className="font-bold tracking-tight text-base">NEXUS</div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Personal AI Engine</div>
      </div>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || '/'
  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(to))
  const [manageOpen, setManageOpen] = useState(
    sections.find((s) => s.collapsible)?.items.some((i) => isActive(i.to)) ?? false
  )

  const renderItem = (item: Item) => {
    const Icon = item.icon
    return (
      <li key={item.to}>
        <Link
          href={item.to}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
            isActive(item.to)
              ? 'bg-sidebar-accent text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      </li>
    )
  }

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
      <ul className="space-y-0.5">{renderItem(home)}</ul>
      {sections.map((sec) => (
        <div key={sec.title}>
          {sec.collapsible ? (
            <button
              onClick={() => setManageOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              {sec.title}
              <ChevronDown className={cn('h-3 w-3 transition-transform', manageOpen ? '' : '-rotate-90')} />
            </button>
          ) : (
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{sec.title}</div>
          )}
          {(!sec.collapsible || manageOpen) && (
            <ul className="space-y-0.5">{sec.items.map(renderItem)}</ul>
          )}
        </div>
      ))}
    </nav>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
              v4.0 · CF $5 plan
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Brand />
        </div>
        <NavList />
        <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
          v4.0 · CF $5 plan
        </div>
      </aside>
    </>
  )
}

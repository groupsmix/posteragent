'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Package, ShieldCheck,
  Settings as SettingsIcon, Globe2, Megaphone, History,
  Bot, CalendarClock, Rocket, LayoutDashboard, ChevronDown, DollarSign,
  Menu, X, LayoutGrid, Workflow, Brain, Sunrise, Shirt,
  ShoppingCart, Briefcase, Link2, FileText, PenLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> }

const topItems: Item[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/ceo', label: 'AI Assistant', icon: Bot },
]

const sections: { title: string; items: Item[]; collapsible?: boolean }[] = [
  {
    title: 'Domains',
    items: [
      { to: '/digital', label: 'Digital Products', icon: Package },
      { to: '/print-on-demand', label: 'Print on Demand', icon: Shirt },
      { to: '/content', label: 'Content & Media', icon: FileText },
      { to: '/freelance-services', label: 'Freelance Services', icon: Briefcase },
      { to: '/affiliate-marketing', label: 'Affiliate Marketing', icon: Link2 },
      { to: '/ecommerce-retail', label: 'E-Commerce & Retail', icon: ShoppingCart },
    ],
  },
  {
    title: 'Engine',
    items: [
      { to: '/autopilot', label: 'Autopilot', icon: Rocket },
      { to: '/review', label: 'Review Queue', icon: ShieldCheck },
      { to: '/revenue', label: 'Revenue', icon: DollarSign },
      { to: '/learning', label: 'Learning Loop', icon: Brain },
      { to: '/blog', label: 'Blog Engine', icon: PenLine },
    ],
  },
  {
    title: 'System',
    collapsible: true,
    items: [
      { to: '/digest', label: 'Digest', icon: Sunrise },
      { to: '/platforms', label: 'Platforms', icon: Globe2 },
      { to: '/schedules', label: 'Schedules', icon: CalendarClock },
      { to: '/history', label: 'History', icon: History },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
        <Workflow className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="font-semibold tracking-tight text-sm text-foreground">NEXUS</div>
        <div className="text-[10px] text-muted-foreground leading-none">AI Engine</div>
      </div>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || '/'
  const isActive = (to: string) =>
    to === '/' ? pathname === '/' :
    to === '/settings' ? pathname === '/settings' :
    pathname === to || (to !== '/' && to !== '/settings' && pathname.startsWith(to))
  const [systemOpen, setSystemOpen] = useState(
    sections.find((s) => s.collapsible)?.items.some((i) => isActive(i.to)) ?? false
  )

  const renderItem = (item: Item) => {
    const Icon = item.icon
    const active = isActive(item.to)
    return (
      <li key={item.to}>
        <Link
          href={item.to}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-150',
            active
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : '')} />
          {item.label}
        </Link>
      </li>
    )
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      <ul className="space-y-0.5">{topItems.map(renderItem)}</ul>
      {sections.map((sec) => (
        <div key={sec.title}>
          {sec.collapsible ? (
            <button
              onClick={() => setSystemOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              {sec.title}
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', systemOpen ? '' : '-rotate-90')} />
            </button>
          ) : (
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {sec.title}
            </div>
          )}
          {(!sec.collapsible || systemOpen) && (
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
      <header className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-4 text-sidebar-foreground">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-sidebar text-sidebar-foreground shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
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
            <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground/60">
              NEXUS v4.0
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-border">
          <Brand />
        </div>
        <NavList />
        <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground/60">
          NEXUS v4.0
        </div>
      </aside>
    </>
  )
}

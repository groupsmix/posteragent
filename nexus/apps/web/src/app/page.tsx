'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Bot, Package, ShieldCheck, DollarSign, Rocket, Activity, ArrowRight,
} from 'lucide-react'
import { api, type AutopilotStatus } from '@/lib/api'
import type { Product } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

interface Counts { total: number; pending: number; approved: number; published: number }

export default function HomePage() {
  const [auto, setAuto] = useState<AutopilotStatus | null>(null)
  const [spend, setSpend] = useState<{ today: number; cap: number } | null>(null)
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getAutopilot().then(setAuto).catch(() => setAuto(null))
    api.getSpend().then(setSpend).catch(() => setSpend(null))
    api.getProducts({ limit: 200 })
      .then((r) => {
        const p: Product[] = r.products || []
        setCounts({
          total: p.length,
          pending: p.filter((x) => x.status === 'pending_review').length,
          approved: p.filter((x) => x.status === 'approved').length,
          published: p.filter((x) => x.status === 'published').length,
        })
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <>
      <PageHeader
        title={<span>Welcome back to <span className="text-gradient">NEXUS</span></span>}
        subtitle="Your AI product engine at a glance — what's running, what needs you, and what it's costing."
      />
      <PageBody className="space-y-6">
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <div className="text-sm font-semibold text-destructive">Connection error</div>
            <div className="text-xs text-muted-foreground mt-1">{error}</div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/create" className="group flex items-center justify-between rounded-xl border border-border bg-gradient-card p-5 hover:border-primary/40 hover:shadow-glow transition-all">
            <span className="flex items-center gap-3 font-semibold"><Plus className="h-5 w-5 text-primary" /> Build a product</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/ceo" className="group flex items-center justify-between rounded-xl border border-border bg-gradient-card p-5 hover:border-primary/40 hover:shadow-glow transition-all">
            <span className="flex items-center gap-3 font-semibold"><Bot className="h-5 w-5 text-primary" /> Talk to the CEO</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/review" className="group flex items-center justify-between rounded-xl border border-border bg-gradient-card p-5 hover:border-primary/40 hover:shadow-glow transition-all">
            <span className="flex items-center gap-3 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> Review queue</span>
            <span className="flex items-center gap-2">
              {counts && counts.pending > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{counts.pending}</span>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Stat tiles */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Package className="h-5 w-5" />} label="Products" value={counts ? String(counts.total) : '—'}
            sub={counts ? `${counts.published} published · ${counts.approved} approved` : ''} href="/products" />
          <Stat icon={<ShieldCheck className="h-5 w-5" />} label="Pending review" value={counts ? String(counts.pending) : '—'}
            sub={counts && counts.pending > 0 ? 'Waiting for your call' : 'All caught up'} href="/review" />
          <Stat icon={<Rocket className="h-5 w-5" />} label="Autopilot"
            value={auto ? (auto.enabled ? 'ON' : 'OFF') : '—'}
            valueClass={auto?.enabled ? 'text-emerald-500' : 'text-muted-foreground'}
            sub={auto ? `${auto.products_built} built automatically` : ''} href="/autopilot" />
          <Stat icon={<DollarSign className="h-5 w-5" />} label="AI spend today"
            value={spend ? `$${spend.today.toFixed(2)}` : '$0.00'}
            sub={spend && spend.cap > 0 ? `of $${spend.cap.toFixed(2)} cap` : 'free models · no cap'} href="/settings/keys" />
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-3"><Activity className="h-4 w-4" /> Recent activity</h2>
          {auto && auto.recent && auto.recent.length > 0 ? (
            <ul className="divide-y divide-border">
              {auto.recent.slice(0, 8).map((r, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">{r.note}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet — build a product or flip on Autopilot to get started.</p>
          )}
        </div>
      </PageBody>
    </>
  )
}

function Stat({ icon, label, value, sub, href, valueClass }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; href: string; valueClass?: string
}) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <div className={`mt-2 text-2xl font-bold ${valueClass ?? ''}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </Link>
  )
}

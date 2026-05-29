'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package, ShieldCheck, DollarSign, Rocket, Activity, ArrowRight, Bot, Plus,
} from 'lucide-react'
import { api, type AutopilotStatus } from '@/lib/api'
import type { Product } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'
import { SetupBanner } from '@/components/shared/SetupBanner'
import { DigestCard } from '@/components/shared/DigestCard'

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
        title="Command Center"
        subtitle="Your AI product engine at a glance."
      />
      <PageBody className="space-y-6 max-w-6xl">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Connection error</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        <SetupBanner />
        <DigestCard />

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Package className="h-4 w-4" />}
            label="Products"
            value={counts ? String(counts.total) : '—'}
            sub={counts ? `${counts.published} published · ${counts.approved} approved` : ''}
            href="/products"
          />
          <StatCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Pending Review"
            value={counts ? String(counts.pending) : '—'}
            sub={counts && counts.pending > 0 ? 'Waiting for your call' : 'All caught up'}
            href="/review"
            accent={counts && counts.pending > 0}
          />
          <StatCard
            icon={<Rocket className="h-4 w-4" />}
            label="Autopilot"
            value={auto ? (auto.enabled ? 'ON' : 'OFF') : '—'}
            valueClass={auto?.enabled ? 'text-emerald-400' : ''}
            sub={auto ? `${auto.products_built} built automatically` : ''}
            href="/autopilot"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="AI Spend Today"
            value={spend ? `$${spend.today.toFixed(2)}` : '$0.00'}
            sub={spend && spend.cap > 0 ? `of $${spend.cap.toFixed(2)} cap` : 'Free models · no cap'}
            href="/settings/keys"
          />
        </div>

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction href="/create" icon={<Plus className="h-4 w-4" />} label="Build a product" />
          <QuickAction href="/ceo" icon={<Bot className="h-4 w-4" />} label="Talk to the CEO" />
          <QuickAction href="/review" icon={<ShieldCheck className="h-4 w-4" />} label="Review queue" badge={counts?.pending} />
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium mb-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </h2>
          {auto && auto.recent && auto.recent.length > 0 ? (
            <ul className="divide-y divide-border">
              {auto.recent.slice(0, 8).map((r, i) => (
                <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">{r.note}</span>
                  <span className="text-xs text-muted-foreground ml-4 shrink-0">{new Date(r.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activity yet — build a product or enable Autopilot to get started.
            </p>
          )}
        </div>
      </PageBody>
    </>
  )
}

function StatCard({ icon, label, value, sub, href, valueClass, accent }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; href: string; valueClass?: string; accent?: boolean | null
}) {
  return (
    <Link href={href} className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`mt-2.5 text-2xl font-semibold tabular-nums ${valueClass ?? ''}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      {accent && <div className="mt-2 h-0.5 w-8 rounded-full bg-primary" />}
    </Link>
  )
}

function QuickAction({ href, icon, label, badge }: {
  href: string; icon: React.ReactNode; label: string; badge?: number | null
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <span className="flex items-center gap-2">
        {badge != null && badge > 0 && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{badge}</span>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  )
}

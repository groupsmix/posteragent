'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DollarSign, ShoppingBag, Trophy, ExternalLink, Loader2, Plug } from 'lucide-react'
import { api, type RevenueResponse } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function RevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRevenue().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><DollarSign className="h-6 w-6" /> Revenue</span>}
        subtitle="Real sales pulled from Gumroad — not estimates."
      />
      <PageBody className="space-y-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sales…
          </div>
        )}

        {!loading && data && !data.configured && (
          <div className="rounded-xl border border-border bg-gradient-card p-6">
            <div className="flex items-center gap-2 text-sm font-semibold"><Plug className="h-4 w-4" /> Connect Gumroad</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.message || 'Add a Gumroad access token to track real sales.'}
            </p>
            <Link href="/settings/keys" className="mt-4 inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Add Gumroad token
            </Link>
          </div>
        )}

        {!loading && data?.configured && data.error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <div className="text-sm font-semibold text-destructive">Couldn’t reach Gumroad</div>
            <div className="mt-1 text-xs text-muted-foreground">{data.error}</div>
          </div>
        )}

        {!loading && data?.configured && !data.error && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={<DollarSign className="h-5 w-5 text-emerald-500" />} label="Total revenue"
                value={`$${(data.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <Stat icon={<ShoppingBag className="h-5 w-5 text-primary" />} label="Total sales"
                value={String(data.total_sales ?? 0)} />
              <Stat icon={<Trophy className="h-5 w-5 text-amber-500" />} label="Best seller"
                value={data.best_seller || '—'} small />
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-3 text-sm font-semibold">Products ({data.product_count ?? 0})</div>
              {(!data.products || data.products.length === 0) ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No products listed on Gumroad yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {data.products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.sales} sale{p.sales === 1 ? '' : 's'}
                          {!p.published && <span className="ml-2 rounded bg-muted px-1.5 py-0.5">draft</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-semibold text-emerald-500">
                          ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </PageBody>
    </>
  )
}

function Stat({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className={`mt-2 font-bold ${small ? 'text-base truncate' : 'text-2xl'}`}>{value}</div>
    </div>
  )
}

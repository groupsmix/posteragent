'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { History as HistoryIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function HistoryPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getHistory()
      .then((r) => setRuns(r.runs || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><HistoryIcon className="h-6 w-6" /> Run history</span>}
        subtitle="Every workflow run with cost, duration, and outcome."
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No runs yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2">Product</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Cost</th>
                  <th className="text-right px-4 py-2">Started</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2">{r.product_name || r.product_id}</td>
                    <td className="px-4 py-2 text-xs uppercase">{r.status}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      ${Number(r.total_cost_usd ?? 0).toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {r.started_at || '—'}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/workflow/${r.id}`} className="text-xs text-primary hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  )
}

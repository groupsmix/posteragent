'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { History as HistoryIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

function StatusPill({ status, failedStep }: { status: string; failedStep?: string | null }) {
  const cls =
    status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
    status === 'running' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
    status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
    'bg-muted text-muted-foreground'
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cls}`}>
        {status}
      </span>
      {status === 'failed' && failedStep && (
        <span className="text-[10px] text-red-500">at {failedStep}</span>
      )}
    </span>
  )
}

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
          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2">Product</th>
                  <th className="text-left px-4 py-2">Health</th>
                  <th className="text-left px-4 py-2">Steps</th>
                  <th className="text-right px-4 py-2">Tokens</th>
                  <th className="text-right px-4 py-2">Cost</th>
                  <th className="text-right px-4 py-2">Started</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2">{r.product_name || r.product_id}</td>
                    <td className="px-4 py-2"><StatusPill status={r.status} failedStep={r.failed_step} /></td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {Number(r.steps_completed ?? 0)}/{Number(r.step_count ?? 0)}
                      {Number(r.steps_failed ?? 0) > 0 && (
                        <span className="ml-1 text-red-500">({Number(r.steps_failed)} failed)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-muted-foreground">
                      {Number(r.run_tokens ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      ${Number(r.run_cost_usd ?? 0).toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {r.started_at ? new Date(r.started_at).toLocaleString() : '—'}
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

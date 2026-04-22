'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Skull } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default function GraveyardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getGraveyard()
      .then((r) => setProducts(r.products || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><Skull className="h-6 w-6" /> Graveyard</span>}
        subtitle="Rejected and expired products. Approve to resurface."
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            The graveyard is empty.
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.name || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.graveyard_reason ?? 'No reason recorded'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <button
                    onClick={() => api.restoreProduct(p.id)}
                    className="text-xs rounded-md border border-border px-2.5 py-1 hover:border-primary/40"
                  >
                    Restore
                  </button>
                  <Link
                    href={`/review/${p.id}`}
                    className="text-xs rounded-md border border-border px-2.5 py-1 hover:border-primary/40"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  )
}

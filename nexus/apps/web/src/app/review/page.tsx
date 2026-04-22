'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default function ReviewQueuePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProducts({ status: 'pending_review' })
      .then((r) => setProducts(r.products || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Review queue</span>}
        subtitle="Products awaiting CEO approval."
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Queue is clear. All workflows have been reviewed.
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.name || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground">{p.niche ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <Link
                    href={`/review/${p.id}`}
                    className="rounded-md bg-gradient-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-glow"
                  >
                    Review →
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

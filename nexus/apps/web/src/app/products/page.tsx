'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    api
      .getProducts({ limit: 100 })
      .then((r) => setProducts(r.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name || 'Untitled'}"? This removes the product and its files for good.`)) return
    setDeletingId(p.id)
    const prev = products
    setProducts((list) => list.filter((x) => x.id !== p.id))
    try {
      await api.deleteProduct(p.id)
    } catch {
      setProducts(prev)
      alert('Failed to delete. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Package className="h-6 w-6" /> Products
          </span>
        }
        subtitle="Everything NEXUS has generated, across all domains."
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No products yet. Pick a domain to start your first workflow.
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{p.name || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.niche ?? '—'}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {typeof p.ai_score === 'number' && (
                    <span className="text-xs text-muted-foreground">{p.ai_score.toFixed(1)}/10</span>
                  )}
                  <StatusBadge status={p.status} />
                  <Link
                    href={`/review/${p.id}`}
                    className="rounded-md bg-gradient-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-glow"
                  >
                    View →
                  </Link>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                    title="Delete product"
                    className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500/40 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  )
}

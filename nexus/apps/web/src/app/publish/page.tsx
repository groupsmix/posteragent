'use client'

import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function PublishPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPublishQueue()
      .then((r) => setItems(r.items || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><Send className="h-6 w-6" /> Publish center</span>}
        subtitle="Approved products ready to go live on their platforms."
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nothing queued. Approve products to populate this list.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{item.product_name || item.title || item.id}</div>
                  <div className="text-xs text-muted-foreground">{item.platform_name ?? '—'}</div>
                </div>
                <button
                  onClick={() => api.publishItem(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow"
                >
                  <Send className="h-4 w-4" /> Publish
                </button>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import type { Domain } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function HomePage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getDomains()
      .then(setDomains)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title={
          <span>
            Welcome back to <span className="text-gradient">NEXUS</span>
          </span>
        }
        subtitle="Pick a domain to start a new product. Every workflow is reviewed before it ships."
      />
      <PageBody>
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 mb-6">
            <div className="text-sm font-semibold text-destructive">Connection error</div>
            <div className="text-xs text-muted-foreground mt-1">{error}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Make sure the NEXUS API is running at {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'}.
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {domains.map((d) => (
              <Link
                key={d.id}
                href={`/${d.slug}`}
                className="group relative h-44 rounded-2xl border border-border bg-gradient-card p-5 flex flex-col justify-between overflow-hidden hover:border-primary/40 hover:shadow-glow transition-all"
              >
                {d.color && (
                  <div
                    className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ background: d.color }}
                  />
                )}
                <div className="relative">
                  <div className="text-3xl">{d.icon}</div>
                  <div className="mt-3 font-semibold leading-tight">{d.name}</div>
                </div>
                <div className="relative text-xs text-muted-foreground line-clamp-2">
                  {d.description}
                </div>
              </Link>
            ))}
            <Link
              href="/manager/domains"
              className="h-44 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <Plus className="h-7 w-7" />
              <span className="text-sm font-medium">Add Domain</span>
            </Link>
          </div>
        )}
      </PageBody>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Domain } from '@nexus/types'

function DomainCardSkeleton() {
  return (
    <div className="h-40 rounded-2xl bg-muted animate-pulse" />
  )
}

function DomainCard({ domain }: { domain: Domain }) {
  return (
    <Link href={`/${domain.slug}`}>
      <Card className="h-40 hover:border-primary/50 transition-all cursor-pointer group">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
            {domain.icon || '📦'}
          </div>
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {domain.name}
          </h3>
          {domain.description && (
            <p className="text-sm text-muted-foreground text-center mt-1 line-clamp-2">
              {domain.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Connection Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure the NEXUS API is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground">NEXUS</h1>
          <p className="text-muted-foreground mt-2">Select a domain to start creating</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <DomainCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {domains.map((domain) => (
              <DomainCard key={domain.id} domain={domain} />
            ))}

            {/* Add New Domain */}
            <Link href="/manager/domains?action=new">
              <div className="h-40 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all cursor-pointer">
                <Plus className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Add Domain</span>
              </div>
            </Link>
          </div>
        )}

        {domains.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              No domains configured yet.
            </p>
            <Link 
              href="/manager/domains?action=new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Domain
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

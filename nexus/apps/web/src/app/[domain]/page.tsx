'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Category, Platform, SocialChannel } from '@nexus/types'

function CategoryCard({ category, domainSlug }: { category: Category; domainSlug: string }) {
  return (
    <Link href={`/${domainSlug}/${category.slug}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer group">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{category.icon || '📁'}</div>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DomainPage() {
  const params = useParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get domain first, then its categories
    api.getDomains().then((domains) => {
      const domain = domains.find((d: any) => d.slug === params.domain)
      if (domain) {
        api.getCategories(domain.id).then(setCategories)
      }
    }).finally(() => setLoading(false))
  }, [params.domain])

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">›</span>
          <span className="capitalize">{params.domain}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold capitalize">{params.domain}</h1>
          <p className="text-muted-foreground mt-2">Choose a category to create your product</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} domainSlug={params.domain as string} />
            ))}

            <Link href={`/manager/categories?action=new&domain=${params.domain}`}>
              <Card className="border-dashed hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="flex items-center justify-center gap-2 p-4 text-muted-foreground hover:text-primary">
                  <Plus className="w-5 h-5" />
                  <span>Add Category</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

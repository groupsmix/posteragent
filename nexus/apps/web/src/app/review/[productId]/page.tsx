'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Navbar } from '@/components/shared/Navbar'
import { Check, X, Edit, Send, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    api.getProduct(params.productId as string)
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [params.productId])

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      await api.approveProduct(params.productId as string)
      router.push('/products')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    const feedback = prompt('Reason for rejection:')
    if (!feedback) return
    setActionLoading('reject')
    try {
      await api.rejectProduct(params.productId as string, feedback)
      router.push('/products')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <Link href="/products" className="text-primary hover:underline">Back to Products</Link>
        </div>
      </div>
    )
  }

  // Get the main content from workflow steps
  const contentStep = product.workflow_runs?.[0]?.steps?.find((s: any) => 
    s.step_name === 'generate_content' && s.status === 'completed'
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span className="mx-2">›</span>
          <span>Review</span>
        </nav>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {product.name || product.niche || 'Untitled Product'}
            </h1>
            <div className="flex items-center gap-4">
              <StatusBadge status={product.status} />
              <span className="text-sm text-muted-foreground">
                {product.domain_name} • {product.category_name}
              </span>
              {product.ai_score && (
                <span className="text-sm font-medium">
                  AI Score: {product.ai_score}/10
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Content */}
        {contentStep?.output_data && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Generated Content</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                try {
                  const output = JSON.parse(contentStep.output_data)
                  return (
                    <div className="space-y-4">
                      {output.title && (
                        <div>
                          <h3 className="font-semibold mb-1">Title</h3>
                          <p className="text-lg">{output.title}</p>
                        </div>
                      )}
                      {output.description && (
                        <div>
                          <h3 className="font-semibold mb-1">Description</h3>
                          <p className="whitespace-pre-wrap">{output.description}</p>
                        </div>
                      )}
                      {output.tags && output.tags.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-1">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {output.tags.map((tag: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-muted rounded text-sm">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                } catch {
                  return <p className="text-muted-foreground">Content preview unavailable</p>
                }
              })()}
            </CardContent>
          </Card>
        )}

        {/* Platform Variants */}
        {product.platform_variants?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Platform Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.platform_variants.map((variant: any) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{variant.platform_name}</h4>
                      <StatusBadge status={variant.status} />
                    </div>
                    {variant.title && <p className="text-sm mb-1"><strong>Title:</strong> {variant.title}</p>}
                    {variant.description && <p className="text-sm text-muted-foreground">{variant.description}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {product.reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium capitalize">{review.reviewer_type}</span>
                      <StatusBadge status={review.approved ? 'approved' : 'rejected'} />
                    </div>
                    <p className="text-sm">{review.feedback}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {product.status === 'pending_review' && (
          <div className="flex gap-4">
            <Button
              onClick={handleApprove}
              disabled={actionLoading !== null}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {actionLoading === 'approve' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Approve & Publish
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading !== null}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              {actionLoading === 'reject' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <X className="w-5 h-5 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

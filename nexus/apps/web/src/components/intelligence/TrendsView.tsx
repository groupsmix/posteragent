'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Plus } from 'lucide-react'

export function TrendsView() {
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTrends()
      .then(setTrends)
      .finally(() => setLoading(false))
  }, [])

  const handleDismiss = async (id: string) => {
    await api.dismissTrend(id)
    setTrends(trends.filter((t) => t.id !== id))
  }

  const handleStartWorkflow = async (id: string) => {
    const result = await api.startTrendWorkflow(id)
    window.location.href = `/workflow/${result.workflow_id}`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (trends.length === 0) {
    return (
      <Card className="p-16 text-center">
        <p className="text-muted-foreground">No trends detected yet</p>
        <p className="text-sm text-muted-foreground mt-2">Trends are checked daily at 6 AM UTC</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {trends.map((trend) => (
        <Card key={trend.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-lg">{trend.keyword}</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full capitalize">
                  {trend.trend_type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Source: {trend.source}</span>
                <span>Score: {trend.engagement_score}</span>
                <span>{new Date(trend.detected_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDismiss(trend.id)}>
                Dismiss
              </Button>
              <Button size="sm" onClick={() => handleStartWorkflow(trend.id)}>
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

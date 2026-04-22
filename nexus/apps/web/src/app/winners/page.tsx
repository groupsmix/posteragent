'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Navbar } from '@/components/shared/Navbar'
import Link from 'next/link'

export default function WinnersPage() {
  const [patterns, setPatterns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWinnerPatterns()
      .then((data: any) => setPatterns(data.patterns || data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Winner Patterns</h1>
          <p className="text-muted-foreground mt-1">Learned from approved products</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : patterns.length === 0 ? (
          <Card className="p-16 text-center">
            <p className="text-muted-foreground">No patterns detected yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Patterns are learned from approved products
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.map((pattern: any) => (
              <Card key={pattern.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{pattern.pattern_type || 'Unknown'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {pattern.description || pattern.pattern_text}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Detected in {pattern.detection_count || 0} products
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {pattern.success_rate || 0}% success
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

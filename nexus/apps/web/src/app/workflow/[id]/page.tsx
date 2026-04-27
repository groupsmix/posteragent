'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const STEP_LABELS: Record<string, string> = {
  research_market: '① Market Research',
  research_psychology: '② Buyer Psychology',
  research_keywords: '③ Keyword Research',
  generate_content: '④ Content Generation',
  generate_assets: '⑤ Asset Creation',
  generate_seo: '⑥ SEO Optimization',
  generate_title_variants: '⑦ Title Variants',
  quality_editor: '⑧ Quality Edit',
  quality_buyer_sim: '⑨ Buyer Sim',
  quality_competitor: '⑩ Competitor',
  humanize: '⑪ Humanizer',
  revenue_estimate: '⑫ Revenue',
  generate_platform_variants: '⑬ Platform Vars',
  generate_social_content: '⑭ Social Content',
  quality_ceo: '⑮ CEO Review',
}

function StepItem({ step, index }: { step: any; index: number }) {
  const icons = {
    waiting: <Clock className="w-5 h-5 text-muted-foreground" />,
    running: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
    completed: <Check className="w-5 h-5 text-green-500" />,
    failed: <X className="w-5 h-5 text-red-500" />,
    skipped: <span className="w-5 h-5 text-center text-muted-foreground">-</span>,
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
      <div className="flex-shrink-0">{icons[step.status as keyof typeof icons] || icons.waiting}</div>
      <div className="flex-1">
        <p className={`font-medium ${step.status === 'completed' ? 'text-green-600' : step.status === 'failed' ? 'text-red-600' : ''}`}>
          {STEP_LABELS[step.step_name] || step.step_name}
        </p>
        {step.started_at && (
          <p className="text-xs text-muted-foreground">
            Started: {new Date(step.started_at).toLocaleTimeString()}
          </p>
        )}
        {step.error && (
          <p className="text-xs text-red-500 mt-1">{step.error}</p>
        )}
      </div>
      {step.ai_model_used && step.status === 'completed' && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {step.ai_model_used}
        </span>
      )}
    </div>
  )
}

export default function WorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)

  const fetchWorkflow = async () => {
    try {
      const data = await api.getWorkflowStatus(params.id as string)
      setWorkflow(data)
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        setPolling(false)
      }
    } catch (err) {
      console.error('Error fetching workflow:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkflow()
    if (polling) {
      const interval = setInterval(fetchWorkflow, 3000)
      return () => clearInterval(interval)
    }
  }, [params.id, polling])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workflow Not Found</h2>
          <Link href="/" className="text-primary hover:underline">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">›</span>
          <span>Workflow</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Workflow Progress</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              workflow.status === 'completed' ? 'bg-green-100 text-green-700' :
              workflow.status === 'running' ? 'bg-blue-100 text-blue-700' :
              workflow.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
            </span>
            {workflow.current_step && (
              <span className="text-sm text-muted-foreground">
                Current: {STEP_LABELS[workflow.current_step] || workflow.current_step}
              </span>
            )}
          </div>
        </div>

        {workflow.error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">Error</p>
                  <p className="text-sm text-red-600">{workflow.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {workflow.steps?.map((step: any, index: number) => (
            <StepItem key={step.id || index} step={step} index={index} />
          ))}
        </div>

        {workflow.status === 'completed' && (
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-700 mb-2">Workflow Complete!</h2>
              <p className="text-green-600 mb-4">Your product is ready for review.</p>
              <Link href={`/review/${workflow.product_id}`}>
                <Button className="bg-green-600 hover:bg-green-700">
                  Review Product
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {workflow.status === 'failed' && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

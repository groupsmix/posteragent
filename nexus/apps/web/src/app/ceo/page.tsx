'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bot, Send, Loader2, CheckCircle2, XCircle, ExternalLink, Wrench,
  ChevronDown, ChevronRight, Clock, Zap, Search, ShoppingCart, Megaphone,
  Globe, Image as ImageIcon,
} from 'lucide-react'
import { api, API_BASE, type ManagerMessage, type AgentStep, type ProductScoreResponse, type ActionResult, type ActionStep as ActionStepType } from '@/lib/api'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { Markdown } from '@/components/Markdown'
import { VoiceInput } from '@/components/VoiceInput'
import { LiveBrowserPanel } from '@/components/LiveBrowserPanel'

interface ChatTurn extends ManagerMessage {
  steps?: AgentStep[]
  action_results?: ActionResult[]
}

const SUGGESTIONS = [
  'What sold best this week?',
  'Check my Gumroad sales',
  'Create a product about productivity',
  'Analyze the "wedding planning" niche',
  'Run marketing for my top product',
  'Create a POD design for motivational quotes',
]

const TOOL_LABELS: Record<string, string> = {
  list_products: 'Looked up products',
  create_product: 'Dispatched product agent',
  create_products: 'Created products',
  run_workflow: 'Ran the agent team',
  approve_product: 'Approved',
  reject_product: 'Rejected',
  delete_product: 'Deleted',
  publish_product: 'Published',
  key_status: 'Checked API keys',
  browse_web: 'Browsed the web',
  browse: 'Browser action',
  list_product: 'Listed product',
  check_sales: 'Checked sales',
  create_pod: 'Created POD product',
  run_campaign: 'Ran campaign',
  analyze_niche: 'Analyzed niche',
}

const ACTION_ICONS: Record<string, typeof Bot> = {
  browse: Globe,
  list_product: ShoppingCart,
  check_sales: Zap,
  create_pod: ImageIcon,
  run_campaign: Megaphone,
  analyze_niche: Search,
}

function StepStatusIcon({ status }: { status: ActionStepType['status'] }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-destructive" />
    default:
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function LiveActionPanel({ result }: { result: ActionResult }) {
  const [expanded, setExpanded] = useState(true)
  const Icon = ACTION_ICONS[result.action_type] || Zap
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-muted/40 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Icon className="h-3.5 w-3.5" />
        <span className="flex-1">{TOOL_LABELS[result.action_type] || result.action_type}</span>
        {result.success ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/40 px-3 py-2 space-y-2">
          {result.steps && result.steps.length > 0 && (
            <div className="space-y-1">
              {result.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <StepStatusIcon status={s.status} />
                  <span className={s.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{s.description}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-foreground">{result.message}</p>
          {result.screenshots && result.screenshots.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {result.screenshots.map((src, i) => (
                <a
                  key={i}
                  href={src.startsWith('http') ? src : `${API_BASE}/api/assets/r2/${src}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src.startsWith('http') ? src : `${API_BASE}/api/assets/r2/${src}`}
                    alt="Screenshot"
                    className="max-h-32 rounded-md border border-border object-cover object-top"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProductScoreBadge({ productId }: { productId: string }) {
  const [score, setScore] = useState<number | null>(null)
  useEffect(() => {
    api.getProductScore(productId).then((s: ProductScoreResponse) => setScore(s.score.total)).catch(() => {})
  }, [productId])
  if (score === null) return null
  return <ScoreBadge score={score} />
}

export default function CeoManagerPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      content:
        "What can I help you with? I can check sales, build products, browse the web, analyze niches, run marketing campaigns, and more.",
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, busy])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    const history: ManagerMessage[] = turns.map((t) => ({ role: t.role, content: t.content }))
    setTurns((prev) => [...prev, { role: 'user', content: message }])
    setInput('')
    setBusy(true)
    try {
      const res = await api.managerAgent(message, history)
      const turn: ChatTurn = { role: 'assistant', content: res.reply, steps: res.steps }
      const managerRes = await api.managerChat(message, history).catch(() => null)
      if (managerRes?.action_results && managerRes.action_results.length > 0) {
        turn.action_results = managerRes.action_results
      }
      setTurns((prev) => [...prev, turn])
    } catch {
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong reaching the engine. Please try again.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Chat pane */}
      <div className={`flex flex-col transition-all duration-300 ${browserOpen ? 'w-1/2 border-r border-border' : 'w-full'}`}>
        {/* Minimal header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">AI Assistant</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {turns.map((t, i) => (
            <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex items-start gap-3'}>
              {t.role === 'assistant' && (
                <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={
                  t.role === 'user'
                    ? 'max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground'
                    : 'max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm'
                }
              >
                {t.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{t.content}</p>
                ) : (
                  <Markdown>{t.content}</Markdown>
                )}
                {t.steps && t.steps.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Actions taken</div>
                    {t.steps.map((s, j) => (
                      <div key={j} className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-2 text-xs">
                        {s.ok ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Wrench className="h-3 w-3" /> {TOOL_LABELS[s.tool] || s.tool}
                          </span>
                          <span className="mt-0.5 block text-muted-foreground">{s.summary}</span>
                          {s.screenshot_url && (
                            <a href={`${API_BASE}${s.screenshot_url}`} target="_blank" rel="noreferrer" className="mt-2 block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`${API_BASE}${s.screenshot_url}`}
                                alt="Page screenshot"
                                className="max-h-48 w-full rounded-md border border-border object-cover object-top"
                              />
                            </a>
                          )}
                        </span>
                        {s.product_id && (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <ProductScoreBadge productId={s.product_id} />
                            <Link
                              href={`/review/${s.product_id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {t.action_results && t.action_results.length > 0 && (
                  <div className="mt-2">
                    {t.action_results.map((ar, j) => (
                      <LiveActionPanel key={j} result={ar} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestion pills */}
        {turns.length <= 1 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-border px-6 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setBrowserOpen((v) => !v)}
              className={`rounded-lg p-2 transition-colors ${browserOpen ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title={browserOpen ? 'Close browser' : 'Open live browser'}
            >
              <Globe className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              disabled={busy}
            />
            <VoiceInput
              disabled={busy}
              label="Voice"
              onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Browser pane */}
      {browserOpen && (
        <div className="w-1/2 flex flex-col">
          <LiveBrowserPanel className="flex-1" />
        </div>
      )}
    </div>
  )
}

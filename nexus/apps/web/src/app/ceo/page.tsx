'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, Send, Loader2, CheckCircle2, XCircle, ExternalLink, Wrench } from 'lucide-react'
import { api, type ManagerMessage, type AgentStep } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'
import { Markdown } from '@/components/Markdown'

interface ChatTurn extends ManagerMessage {
  steps?: AgentStep[]
}

const SUGGESTIONS = [
  'How many products do I have and what needs review?',
  'Create 2 digital products for my best domain',
  'Approve the highest-scoring product, then publish it',
  'Which API keys are configured?',
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
}

export default function CeoManagerPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      content:
        "Hi — I'm your CEO. I have full control of NEXUS: I can check your numbers, build products with the agent team, approve/reject, publish, and delete. Tell me what you want done and I'll do it.",
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
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
      setTurns((prev) => [...prev, { role: 'assistant', content: res.reply, steps: res.steps }])
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
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><Bot className="h-6 w-6" /> CEO</span>}
        subtitle="Your AI chief of staff with full control. Talk to it; it runs the agents and takes action."
      />
      <PageBody>
        <div className="mx-auto flex h-[calc(100vh-220px)] max-w-3xl flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {turns.map((t, i) => (
              <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    t.role === 'user'
                      ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-primary px-4 py-2.5 text-sm text-primary-foreground'
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm'
                  }
                >
                  {t.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{t.content}</p>
                  ) : (
                    <Markdown>{t.content}</Markdown>
                  )}
                  {t.steps && t.steps.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Actions taken</div>
                      {t.steps.map((s, j) => (
                        <div key={j} className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-2.5 py-2 text-xs">
                          {s.ok ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          )}
                          <span className="flex-1">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Wrench className="h-3 w-3" /> {TOOL_LABELS[s.tool] || s.tool}
                            </span>
                            <span className="mt-0.5 block text-muted-foreground">{s.summary}</span>
                          </span>
                          {s.product_id && (
                            <Link
                              href={`/review/${s.product_id}`}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking &amp; taking action…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {turns.length <= 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell your CEO what to do…"
              className="input flex-1"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>
      </PageBody>
    </>
  )
}

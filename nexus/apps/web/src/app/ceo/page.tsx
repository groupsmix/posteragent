'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, Send, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { api, type ManagerMessage, type ManagerAction } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

interface ChatTurn extends ManagerMessage {
  actions?: ManagerAction[]
}

const SUGGESTIONS = [
  'Create 3 digital products for my best domain',
  'Research a trending niche and build a product for it',
  'Make a planner product and price it for me',
]

export default function CeoManagerPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      content:
        "Hi — I'm your CEO Manager. Tell me a goal (e.g. \"create 3 products for my store\") and I'll plan it and put the product agents to work. You can watch them appear on the Products page.",
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
      const res = await api.managerChat(message, history)
      setTurns((prev) => [...prev, { role: 'assistant', content: res.reply, actions: res.actions }])
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
        title={<span className="flex items-center gap-2"><Bot className="h-6 w-6" /> CEO Manager</span>}
        subtitle="Talk to your manager. Give it goals; it splits the work and runs the product agents."
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
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm'
                  }
                >
                  <p className="whitespace-pre-wrap">{t.content}</p>
                  {t.actions && t.actions.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      {t.actions.map((a, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs">
                          {a.status === 'started' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                          )}
                          <span className="flex-1">
                            <span className="font-medium">{a.product_name || 'Product'}</span>
                            {a.niche ? <span className="text-muted-foreground"> · {a.niche}</span> : null}
                            {a.status === 'failed' && a.detail ? (
                              <span className="block text-muted-foreground">{a.detail}</span>
                            ) : null}
                          </span>
                          {a.status === 'started' && a.product_id && (
                            <Link
                              href={`/review/${a.product_id}`}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Planning &amp; dispatching agents…
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
              placeholder="Give your manager a goal…"
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

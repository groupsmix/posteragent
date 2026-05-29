'use client'

import { useEffect, useState } from 'react'
import { Globe2, Loader2, ExternalLink } from 'lucide-react'
import { api, API_BASE, type BrowseResult } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function BrowserPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [url, setUrl] = useState('')
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BrowseResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.browserStatus().then((s) => setEnabled(s.enabled)).catch(() => setEnabled(false))
  }, [])

  const run = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const res = await api.browserRun(url.trim(), instruction.trim() || undefined)
      if (!res.ok) setError(res.error || 'The browser could not open that page.')
      else setResult(res)
    } catch {
      setError('Something went wrong reaching the browser engine.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><Globe2 className="h-6 w-6" /> Browser automation</span>}
        subtitle="Open a real web page in a headless browser, read it, and capture a screenshot. The CEO can do this too — just ask it to browse a URL."
      />
      <PageBody className="max-w-3xl space-y-5">
        {enabled === false && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
            Browser Rendering isn&apos;t enabled on the API worker yet. It needs the Workers Paid plan and the
            <code className="mx-1 rounded bg-background/60 px-1">[browser]</code> binding.
          </div>
        )}

        <form onSubmit={run} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="input w-full"
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">What should I look for? (optional)</label>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. summarize the pricing, or list the main headlines"
              className="input w-full"
              disabled={busy}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
            {busy ? 'Opening…' : 'Open & read'}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-500">{error}</div>
        )}

        {result && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <div className="text-sm font-semibold">{result.title || result.url}</div>
              <a
                href={result.finalUrl || result.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {result.finalUrl || result.url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {result.summary && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Summary</div>
                <p className="whitespace-pre-wrap text-sm">{result.summary}</p>
              </div>
            )}
            {result.screenshotUrl && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Screenshot</div>
                <a href={`${API_BASE}${result.screenshotUrl}`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_BASE}${result.screenshotUrl}`}
                    alt="Page screenshot"
                    className="w-full rounded-lg border border-border"
                  />
                </a>
              </div>
            )}
          </div>
        )}
      </PageBody>
    </>
  )
}

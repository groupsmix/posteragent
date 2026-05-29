'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Globe2, Loader2, ExternalLink, RefreshCw, Maximize2, Minimize2,
  ArrowLeft, ArrowRight,
} from 'lucide-react'
import { api, API_BASE, type BrowseResult, type BrowserActionResult } from '@/lib/api'

interface LiveBrowserPanelProps {
  onScreenshot?: (url: string) => void
  className?: string
}

interface BrowserState {
  url: string
  title: string
  screenshotUrl: string | null
  loading: boolean
  error: string | null
  history: string[]
  historyIndex: number
}

const INITIAL_STATE: BrowserState = {
  url: '',
  title: '',
  screenshotUrl: null,
  loading: false,
  error: null,
  history: [],
  historyIndex: -1,
}

export function LiveBrowserPanel({ onScreenshot, className }: LiveBrowserPanelProps) {
  const [state, setState] = useState<BrowserState>(INITIAL_STATE)
  const [urlInput, setUrlInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [actionLog, setActionLog] = useState<BrowserActionResult[]>([])

  useEffect(() => {
    api.browserStatus().then((s) => setEnabled(s.enabled)).catch(() => setEnabled(false))
  }, [])

  const navigate = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return
    const normalized = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      url: normalized,
    }))
    setUrlInput(normalized)

    try {
      const result = await api.browserRun(normalized)
      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to load page',
        }))
        return
      }

      const screenshotUrl = result.screenshotUrl
        ? `${API_BASE}${result.screenshotUrl}`
        : null

      setState((prev) => {
        const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), normalized]
        return {
          url: result.finalUrl || normalized,
          title: result.title || '',
          screenshotUrl,
          loading: false,
          error: null,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        }
      })
      setUrlInput(result.finalUrl || normalized)

      if (screenshotUrl && onScreenshot) {
        onScreenshot(screenshotUrl)
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Could not reach the browser engine.',
      }))
    }
  }, [onScreenshot])

  const goBack = useCallback(() => {
    if (state.historyIndex > 0) {
      const prevUrl = state.history[state.historyIndex - 1]
      setState((prev) => ({ ...prev, historyIndex: prev.historyIndex - 1 }))
      navigate(prevUrl)
    }
  }, [state.historyIndex, state.history, navigate])

  const goForward = useCallback(() => {
    if (state.historyIndex < state.history.length - 1) {
      const nextUrl = state.history[state.historyIndex + 1]
      setState((prev) => ({ ...prev, historyIndex: prev.historyIndex + 1 }))
      navigate(nextUrl)
    }
  }, [state.historyIndex, state.history, navigate])

  const refresh = useCallback(() => {
    if (state.url) navigate(state.url)
  }, [state.url, navigate])

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(urlInput)
  }

  const updateFromActions = useCallback((results: BrowserActionResult[]) => {
    setActionLog((prev) => [...prev, ...results])
    const lastScreenshot = [...results].reverse().find((r) => r.screenshotKey)
    if (lastScreenshot?.screenshotKey) {
      const url = `${API_BASE}/api/assets/r2/${lastScreenshot.screenshotKey}`
      setState((prev) => ({ ...prev, screenshotUrl: url }))
      if (onScreenshot) onScreenshot(url)
    }
  }, [onScreenshot])

  // Expose navigate and updateFromActions for parent components
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__nexusBrowserNavigate = navigate
    w.__nexusBrowserUpdateActions = updateFromActions
    return () => {
      delete w.__nexusBrowserNavigate
      delete w.__nexusBrowserUpdateActions
    }
  }, [navigate, updateFromActions])

  if (enabled === false) {
    return (
      <div className={`rounded-xl border border-border bg-card p-6 text-center ${className ?? ''}`}>
        <Globe2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">
          Browser Rendering not enabled. Requires Workers Paid plan.
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col rounded-xl border border-border bg-card overflow-hidden ${expanded ? 'fixed inset-4 z-50 shadow-2xl' : ''} ${className ?? ''}`}>
      {/* Browser toolbar */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-2 py-1.5">
        <button
          onClick={goBack}
          disabled={state.historyIndex <= 0}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          title="Back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={goForward}
          disabled={state.historyIndex >= state.history.length - 1}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          title="Forward"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={refresh}
          disabled={!state.url || state.loading}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state.loading ? 'animate-spin' : ''}`} />
        </button>

        <form onSubmit={handleUrlSubmit} className="flex-1 mx-1">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL…"
            className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </form>

        {state.url && (
          <a
            href={state.url}
            target="_blank"
            rel="noreferrer"
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={expanded ? 'Minimize' : 'Maximize'}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Browser viewport */}
      <div className={`relative bg-neutral-900 ${expanded ? 'flex-1' : 'h-[400px]'}`}>
        {state.loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/80">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading page…
            </div>
          </div>
        )}

        {state.error && !state.loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-sm text-center">
              <Globe2 className="mx-auto h-8 w-8 text-destructive/50" />
              <p className="mt-2 text-sm text-destructive">{state.error}</p>
            </div>
          </div>
        )}

        {state.screenshotUrl && !state.error && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={state.screenshotUrl}
            alt={state.title || 'Browser screenshot'}
            className="h-full w-full object-contain object-top"
          />
        )}

        {!state.screenshotUrl && !state.error && !state.loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Globe2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">
                Enter a URL or ask the AI to browse
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action log (last 3 actions) */}
      {actionLog.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-3 py-2 max-h-24 overflow-y-auto">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Recent Actions
          </div>
          <div className="space-y-0.5">
            {actionLog.slice(-3).map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className={`h-1.5 w-1.5 rounded-full ${a.ok ? 'bg-emerald-500' : 'bg-destructive'}`} />
                <span className="text-muted-foreground">
                  {a.action}{a.message ? ` — ${a.message}` : ''} ({a.durationMs}ms)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Title bar */}
      {state.title && (
        <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground truncate">
          {state.title}
        </div>
      )}
    </div>
  )
}

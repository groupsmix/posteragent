'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Globe2, Loader2, ExternalLink, RefreshCw, Maximize2, Minimize2,
  ArrowLeft, ArrowRight, Monitor, MousePointer,
} from 'lucide-react'
import { api, API_BASE, type BrowserActionResult } from '@/lib/api'

interface LiveBrowserPanelProps {
  onScreenshot?: (url: string) => void
  className?: string
}

interface BrowserState {
  url: string
  title: string
  screenshotUrl: string | null
  prevScreenshotUrl: string | null
  loading: boolean
  error: string | null
  history: string[]
  historyIndex: number
  statusText: string | null
}

const INITIAL_STATE: BrowserState = {
  url: '',
  title: '',
  screenshotUrl: null,
  prevScreenshotUrl: null,
  loading: false,
  error: null,
  history: [],
  historyIndex: -1,
  statusText: null,
}

export function LiveBrowserPanel({ onScreenshot, className }: LiveBrowserPanelProps) {
  const [state, setState] = useState<BrowserState>(INITIAL_STATE)
  const [urlInput, setUrlInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [actionLog, setActionLog] = useState<BrowserActionResult[]>([])
  const [fading, setFading] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const navigate = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return
    const normalized = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      url: normalized,
      statusText: 'Navigating...',
    }))
    setUrlInput(normalized)

    try {
      const result = await api.browserRun(normalized)
      if (!mountedRef.current) return

      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to load page',
          statusText: null,
        }))
        return
      }

      const screenshotUrl = result.screenshotUrl
        ? `${API_BASE}${result.screenshotUrl}`
        : null

      setState((prev) => {
        const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), normalized]
        return {
          ...prev,
          url: result.finalUrl || normalized,
          title: result.title || '',
          prevScreenshotUrl: prev.screenshotUrl,
          screenshotUrl,
          loading: false,
          error: null,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          statusText: null,
        }
      })
      setUrlInput(result.finalUrl || normalized)
      if (screenshotUrl) {
        setFading(true)
        setTimeout(() => setFading(false), 400)
        if (onScreenshot) onScreenshot(screenshotUrl)
      }
    } catch {
      if (!mountedRef.current) return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Could not reach the browser engine. Make sure Browser Rendering is enabled on your Workers plan.',
        statusText: null,
      }))
    }
  }, [onScreenshot])

  const takeScreenshot = useCallback(async () => {
    if (!state.url) return
    try {
      const result = await api.browserRun(state.url)
      if (!mountedRef.current) return
      if (result.ok && result.screenshotUrl) {
        const url = `${API_BASE}${result.screenshotUrl}`
        setState((prev) => ({
          ...prev,
          prevScreenshotUrl: prev.screenshotUrl,
          screenshotUrl: url,
          title: result.title || prev.title,
          statusText: null,
        }))
        setFading(true)
        setTimeout(() => setFading(false), 400)
        if (onScreenshot) onScreenshot(url)
      }
    } catch { /* ignore polling errors */ }
  }, [state.url, onScreenshot])

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
      setState((prev) => ({
        ...prev,
        prevScreenshotUrl: prev.screenshotUrl,
        screenshotUrl: url,
      }))
      setFading(true)
      setTimeout(() => setFading(false), 400)
      if (onScreenshot) onScreenshot(url)
    }
    const lastAction = results[results.length - 1]
    if (lastAction) {
      setState((prev) => ({
        ...prev,
        statusText: `${lastAction.action}${lastAction.message ? ' — ' + lastAction.message : ''}`,
      }))
      setTimeout(() => {
        setState((prev) => ({ ...prev, statusText: null }))
      }, 3000)
    }
  }, [onScreenshot])

  const setStatus = useCallback((text: string | null) => {
    setState((prev) => ({ ...prev, statusText: text }))
  }, [])

  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(() => { takeScreenshot() }, 3000)
  }, [takeScreenshot])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__nexusBrowserNavigate = navigate
    w.__nexusBrowserUpdateActions = updateFromActions
    w.__nexusBrowserSetStatus = setStatus
    w.__nexusBrowserStartPolling = startPolling
    w.__nexusBrowserStopPolling = stopPolling
    return () => {
      delete w.__nexusBrowserNavigate
      delete w.__nexusBrowserUpdateActions
      delete w.__nexusBrowserSetStatus
      delete w.__nexusBrowserStartPolling
      delete w.__nexusBrowserStopPolling
      stopPolling()
    }
  }, [navigate, updateFromActions, setStatus, startPolling, stopPolling])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  return (
    <div className={`flex flex-col border-l border-border bg-card overflow-hidden ${expanded ? 'fixed inset-0 z-50 shadow-2xl' : ''} ${className ?? ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-2 py-1.5 shrink-0">
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
          <div className="relative">
            <Globe2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter URL"
              className="w-full rounded-md border border-border bg-background pl-7 pr-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
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
          title={expanded ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Status bar */}
      {state.statusText && (
        <div className="flex items-center gap-2 border-b border-border/50 bg-primary/5 px-3 py-1.5 shrink-0">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-xs text-primary font-medium">{state.statusText}</span>
        </div>
      )}

      {/* Viewport */}
      <div className="relative flex-1 bg-neutral-900 overflow-hidden">
        {/* Loading overlay */}
        {state.loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900/90">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Globe2 className="absolute inset-0 m-auto h-5 w-5 text-primary/60" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Loading page...</p>
            <p className="mt-1 text-xs text-muted-foreground/50 max-w-[250px] truncate">{state.url}</p>
          </div>
        )}

        {/* Error state */}
        {state.error && !state.loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="max-w-sm text-center px-4">
              <Globe2 className="mx-auto h-8 w-8 text-destructive/50" />
              <p className="mt-2 text-sm text-destructive">{state.error}</p>
              <button
                onClick={() => navigate(state.url)}
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Screenshot with crossfade */}
        {state.screenshotUrl && !state.error && (
          <div className="relative h-full w-full">
            {state.prevScreenshotUrl && fading && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={state.prevScreenshotUrl}
                alt="Previous state"
                className="absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-400 opacity-0"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.screenshotUrl}
              alt={state.title || 'Browser view'}
              className={`h-full w-full object-contain object-top transition-opacity duration-400 ${fading ? 'opacity-0 animate-fadeIn' : 'opacity-100'}`}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur-sm">
              <MousePointer className="h-3 w-3" />
              AI browser
            </div>
          </div>
        )}

        {/* Empty state */}
        {!state.url && !state.error && !state.loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-primary/30" />
              </div>
              <p className="text-sm font-medium text-foreground/80">AI Browser</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[220px] mx-auto">
                Enter a URL above or ask the AI to browse for you
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['google.com', 'gumroad.com', 'etsy.com'].map((site) => (
                  <button
                    key={site}
                    onClick={() => { setUrlInput(`https://${site}`); navigate(`https://${site}`) }}
                    className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    {site}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-3 py-2 max-h-24 overflow-y-auto shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            AI Actions
          </div>
          <div className="space-y-0.5">
            {actionLog.slice(-5).map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${a.ok ? 'bg-emerald-500' : 'bg-destructive'}`} />
                <span className="text-muted-foreground truncate">
                  {a.action}{a.message ? ` — ${a.message}` : ''}
                </span>
                <span className="text-muted-foreground/50 shrink-0 ml-auto text-[10px]">{a.durationMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Title bar */}
      {state.title && (
        <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground truncate shrink-0 flex items-center gap-2">
          <Globe2 className="h-3 w-3 shrink-0" />
          {state.title}
        </div>
      )}
    </div>
  )
}

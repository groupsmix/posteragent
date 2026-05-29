import { Hono } from 'hono'
import type { Env } from '../env'
import { browse } from '../services/browser'

export const browserRoutes = new Hono<{ Bindings: Env }>()

// GET /browser/status — whether the headless browser is available.
browserRoutes.get('/status', (c) => {
  return c.json({ enabled: !!c.env.BROWSER })
})

// POST /browser/run — open a URL in a real headless browser, read it, and
// capture a screenshot. Optionally summarize the page toward a goal via the AI.
browserRoutes.post('/run', async (c) => {
  const body = await c.req.json<{ url?: string; instruction?: string }>().catch(
    () => ({}) as { url?: string; instruction?: string }
  )
  const url = (body.url || '').trim()
  const instruction = (body.instruction || '').trim()
  if (!url) return c.json({ error: 'url is required' }, 400)

  const result = await browse(c.env, url)
  if (!result.ok) {
    return c.json({ ok: false, url: result.url, error: result.error }, result.error?.includes('not enabled') ? 503 : 502)
  }

  const screenshotUrl = result.screenshotKey ? `/api/assets/r2/${result.screenshotKey}` : null

  let summary: string | null = null
  if (instruction && result.text) {
    try {
      const prompt = `You browsed this web page. Use ONLY its content to answer the request — do not invent anything not present.

REQUEST: ${instruction}

PAGE TITLE: ${result.title || '(none)'}
PAGE URL: ${result.finalUrl || result.url}
PAGE TEXT (truncated):
${result.text}

Answer concisely in plain language.`
      const req = new Request('https://nexus-ai/task', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskType: 'browse_summarize', prompt, outputFormat: 'text', timeoutMs: 60000 }),
      })
      const res = await c.env.AI_WORKER.fetch(req)
      if (res.ok) {
        const data = (await res.json()) as { output?: string }
        summary = (data.output || '').trim() || null
      }
    } catch {
      summary = null
    }
  }

  return c.json({
    ok: true,
    url: result.url,
    finalUrl: result.finalUrl,
    title: result.title,
    summary,
    text: result.text?.slice(0, 2000) ?? '',
    screenshotUrl,
  })
})

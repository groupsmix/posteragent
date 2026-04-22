import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './env'

// Route imports
import { workflowRoutes } from './routes/workflow'
import { productRoutes } from './routes/products'
import { reviewRoutes } from './routes/review'
import { publishRoutes } from './routes/publish'
import { domainRoutes } from './routes/domains'
import { platformRoutes } from './routes/platforms'
import { socialRoutes } from './routes/social'
import { promptRoutes } from './routes/prompts'
import { aiModelRoutes } from './routes/ai-models'
import { assetRoutes } from './routes/assets'
import { trendRoutes } from './routes/trends'
import { winnerRoutes } from './routes/winners'
import { graveyardRoutes } from './routes/graveyard'
import { historyRoutes } from './routes/history'
import { settingsRoutes } from './routes/settings'

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Type'],
  maxAge: 86400,
}))

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} - ${ms}ms`)
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  })
})

// API version prefix
const api = new Hono<{ Bindings: Env }>()

// Mount all route modules
api.route('/workflow', workflowRoutes)
api.route('/products', productRoutes)
api.route('/review', reviewRoutes)
api.route('/publish', publishRoutes)
api.route('/domains', domainRoutes)
api.route('/categories', domainRoutes) // Re-use domain routes for categories
api.route('/platforms', platformRoutes)
api.route('/social', socialRoutes)
api.route('/prompts', promptRoutes)
api.route('/ai-models', aiModelRoutes)
api.route('/assets', assetRoutes)
api.route('/trends', trendRoutes)
api.route('/winners', winnerRoutes)
api.route('/graveyard', graveyardRoutes)
api.route('/history', historyRoutes)
api.route('/settings', settingsRoutes)

// Mount API routes under /api
app.route('/api', api)

// Error handling middleware
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    path: c.req.path,
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404)
})

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,
  scheduled: async (_controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
    console.log('[cron] Scheduled Trend Radar triggered')
    ctx.waitUntil(runTrendRadar(env))
  },
}

// ------------------------------------------------------------
// Trend radar cron — asks nexus-ai for rising topics per active domain,
// upserts them into `trend_alerts` for the UI to surface.
// ------------------------------------------------------------
async function runTrendRadar(env: Env): Promise<void> {
  try {
    const enabled = await env.DB
      .prepare("SELECT value FROM settings WHERE key = 'trend_radar_enabled' LIMIT 1")
      .first<{ value: string }>()
      .catch(() => null)
    if (enabled?.value === 'false') {
      console.log('[cron] trend radar disabled in settings, skipping')
      return
    }

    const domains = await env.DB
      .prepare('SELECT id, name, slug FROM domains WHERE is_active = 1 LIMIT 20')
      .all<{ id: string; name: string; slug: string }>()

    for (const d of domains.results ?? []) {
      try {
        const prompt = `Return JSON {trends:[{keyword:string, score:number (0-100), source:string, suggested_niche:string, demand_window:"rising"|"hot"|"peak"}]} for up to 5 trending topics in the "${d.name}" product domain this week. Be specific, not generic.`
        const res = await env.AI_WORKER.fetch(
          new Request('https://nexus-ai/task', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ taskType: 'trend_analysis', prompt, outputFormat: 'json', timeoutMs: 60000 }),
          })
        )
        if (!res.ok) {
          console.error(`[cron] trend radar: AI failed for ${d.slug}:`, res.status)
          continue
        }
        const data = (await res.json()) as { output?: string }
        let parsed: any = null
        try { parsed = JSON.parse(data.output ?? '') } catch { parsed = null }
        const trends: Array<{
          keyword: string
          score: number
          source: string
          suggested_niche?: string
          demand_window?: string
        }> = Array.isArray(parsed?.trends) ? parsed.trends : []

        const now = new Date().toISOString()
        for (const t of trends) {
          if (!t?.keyword) continue
          await env.DB
            .prepare(
              `INSERT INTO trend_alerts
                 (id, domain_id, trend_keyword, trend_score, demand_window, source, suggested_niche, status, detected_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
            )
            .bind(
              crypto.randomUUID(),
              d.id,
              t.keyword,
              Number(t.score ?? 0),
              t.demand_window ?? null,
              t.source ?? 'ai',
              t.suggested_niche ?? null,
              now,
            )
            .run()
            .catch(() => void 0)
        }
        console.log(`[cron] trend radar: stored ${trends.length} trends for ${d.slug}`)
      } catch (inner) {
        console.error(`[cron] trend radar: inner error for ${d.slug}:`, inner)
      }
    }
  } catch (err) {
    console.error('[cron] Trend Radar error:', err)
  }
}

export { app }

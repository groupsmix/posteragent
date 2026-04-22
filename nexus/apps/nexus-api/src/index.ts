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
    // Trend Radar - runs daily at 6am UTC
    console.log('Scheduled Trend Radar triggered')
    
    // Fetch trend alerts and save to database
    try {
      const trends = await fetchTrendAlerts(env)
      for (const trend of trends) {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO trend_alerts 
          (id, trend_type, keyword, source, detected_at, engagement_score, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          trend.id,
          trend.trend_type,
          trend.keyword,
          trend.source,
          trend.detected_at,
          trend.engagement_score,
          JSON.stringify(trend.metadata || {})
        ).run()
      }
    } catch (err) {
      console.error('Trend Radar error:', err)
    }
    
    // Schedule next check
    ctx.waitUntil(Promise.resolve())
  },
}

// Helper function for trend radar
async function fetchTrendAlerts(_env: Env): Promise<Array<{
  id: string
  trend_type: string
  keyword: string
  source: string
  detected_at: string
  engagement_score: number
  metadata: Record<string, any>
}>> {
  // This would normally call the AI worker to research trends
  // For now, return empty array as placeholder
  return []
}

export { app }

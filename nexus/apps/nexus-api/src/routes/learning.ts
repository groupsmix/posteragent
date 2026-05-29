import { Hono } from 'hono'
import type { Env } from '../env'
import {
  syncGumroadSales,
  extractPatterns,
  applyPatterns,
  getLearningStats,
} from '../services/learning'
import type { LearningPattern } from '../services/learning'

export const learningRoutes = new Hono<{ Bindings: Env }>()

// GET /learning/patterns — list winner patterns with stats
learningRoutes.get('/patterns', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const result = await c.env.DB
      .prepare(
        `SELECT * FROM winner_patterns
         ORDER BY total_revenue DESC, confidence_score DESC, confidence DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<LearningPattern>()

    const countRow = await c.env.DB
      .prepare('SELECT COUNT(*) AS cnt FROM winner_patterns')
      .first<{ cnt: number }>()
      .catch(() => ({ cnt: 0 }))

    return c.json({
      patterns: result.results ?? [],
      total: countRow?.cnt ?? 0,
    })
  } catch (err) {
    console.error('[learning] Error listing patterns:', err)
    return c.json({ error: 'Failed to list patterns' }, 500)
  }
})

// POST /learning/analyze — trigger pattern extraction from sales data
learningRoutes.post('/analyze', async (c) => {
  try {
    const result = await extractPatterns(c.env)
    return c.json({
      ok: true,
      ...result,
    })
  } catch (err) {
    console.error('[learning] Analysis error:', err)
    return c.json({ error: 'Pattern analysis failed' }, 500)
  }
})

// GET /learning/stats — overall learning loop stats
learningRoutes.get('/stats', async (c) => {
  try {
    const stats = await getLearningStats(c.env)
    return c.json(stats)
  } catch (err) {
    console.error('[learning] Stats error:', err)
    return c.json({ error: 'Failed to fetch learning stats' }, 500)
  }
})

// POST /learning/sync — manually trigger Gumroad sales sync
learningRoutes.post('/sync', async (c) => {
  try {
    const result = await syncGumroadSales(c.env)
    return c.json({ ok: !result.error, ...result })
  } catch (err) {
    console.error('[learning] Sync error:', err)
    return c.json({ error: 'Sales sync failed' }, 500)
  }
})

// GET /learning/weights — get current generation weights from patterns
learningRoutes.get('/weights', async (c) => {
  try {
    const weights = await applyPatterns(c.env)
    return c.json(weights)
  } catch (err) {
    console.error('[learning] Weights error:', err)
    return c.json({ error: 'Failed to compute weights' }, 500)
  }
})

// Exported cron function: runs daily to sync sales + extract patterns
export async function runLearningSync(env: Env): Promise<void> {
  try {
    console.log('[cron] Learning sync starting...')
    const syncResult = await syncGumroadSales(env)
    console.log(`[cron] Learning sync: ${syncResult.synced} new sales synced`)

    if (syncResult.synced > 0 || !syncResult.error) {
      const analysis = await extractPatterns(env)
      console.log(`[cron] Learning analysis: ${analysis.patterns_created} created, ${analysis.patterns_updated} updated`)
    }
  } catch (err) {
    console.error('[cron] Learning sync error:', err)
  }
}

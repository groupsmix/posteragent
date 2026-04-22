import { Hono } from 'hono'
import type { Env } from '../env'
import type { PublishRequest, PublishResult } from '../types'

export const publishRoutes = new Hono<{ Bindings: Env }>()

// POST /publish - Publish product to platforms
publishRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<PublishRequest>()
    
    if (!body.product_id || !body.platform_ids || body.platform_ids.length === 0) {
      return c.json({ error: 'product_id and platform_ids are required' }, 400)
    }
    
    const result: PublishResult = { published: [] }
    
    for (const platformId of body.platform_ids) {
      // Fetch platform variant for this product and platform
      const variant = await c.env.DB.prepare(`
        SELECT pv.*, pl.name as platform_name, pl.url as platform_url
        FROM platform_variants pv
        JOIN platforms pl ON pv.platform_id = pl.id
        WHERE pv.product_id = ? AND pv.platform_id = ?
      `).bind(body.product_id, platformId).first()
      
      if (!variant) {
        result.published.push({
          platform_id: platformId,
          platform_name: 'Unknown',
          url: '',
          status: 'failed',
          error: 'Platform variant not found',
        })
        continue
      }
      
      // Update variant status to published
      const now = new Date().toISOString()
      await c.env.DB.prepare(`
        UPDATE platform_variants SET status = 'published', published_at = ? WHERE id = ?
      `).bind(now, variant.id).run()
      
      // TODO: Integrate with actual platform publishing APIs
      // For now, simulate successful publish
      result.published.push({
        platform_id: platformId,
        platform_name: variant.platform_name as string,
        url: `${variant.platform_url || '#'}/${variant.id}`,
        status: 'success',
      })
    }
    
    // Check if all succeeded
    const allSuccess = result.published.every(p => p.status === 'success')
    
    if (allSuccess) {
      // Update product status to published
      await c.env.DB.prepare(`
        UPDATE products SET status = 'published', updated_at = ? WHERE id = ?
      `).bind(new Date().toISOString(), body.product_id).run()
    }
    
    return c.json(result)
  } catch (err) {
    console.error('Error publishing:', err)
    return c.json({ error: 'Failed to publish' }, 500)
  }
})

// POST /publish/schedule - Schedule publishing for later
publishRoutes.post('/schedule', async (c) => {
  try {
    const body = await c.req.json<PublishRequest & { schedule_at: string }>()
    
    if (!body.product_id || !body.platform_ids || !body.schedule_at) {
      return c.json({ error: 'product_id, platform_ids, and schedule_at are required' }, 400)
    }
    
    const scheduleTime = new Date(body.schedule_at)
    if (isNaN(scheduleTime.getTime())) {
      return c.json({ error: 'Invalid schedule_at date' }, 400)
    }
    
    // Store scheduled publish in KV for later processing
    const scheduleKey = `scheduled:publish:${body.product_id}:${Date.now()}`
    const scheduleData = JSON.stringify({
      product_id: body.product_id,
      platform_ids: body.platform_ids,
      schedule_at: body.schedule_at,
      created_at: new Date().toISOString(),
    })
    
    await c.env.CONFIG.put(scheduleKey, scheduleData, { expirationTtl: 86400 * 30 }) // 30 days TTL
    
    return c.json({
      message: 'Publishing scheduled',
      schedule_at: body.schedule_at,
      schedule_key: scheduleKey,
    })
  } catch (err) {
    console.error('Error scheduling publish:', err)
    return c.json({ error: 'Failed to schedule publishing' }, 500)
  }
})

// GET /publish/:productId - Get publish status for all platforms
publishRoutes.get('/:productId', async (c) => {
  try {
    const productId = c.req.param('productId')
    
    const variants = await c.env.DB.prepare(`
      SELECT pv.id, pv.platform_id, pl.name as platform_name, 
             pv.status, pv.published_at, pv.published_url
      FROM platform_variants pv
      JOIN platforms pl ON pv.platform_id = pl.id
      WHERE pv.product_id = ?
    `).bind(productId).all()
    
    return c.json({
      product_id: productId,
      platforms: variants.results.map((v: any) => ({
        platform_id: v.platform_id,
        platform_name: v.platform_name,
        status: v.status,
        published_at: v.published_at,
        published_url: v.published_url,
      })),
    })
  } catch (err) {
    console.error('Error fetching publish status:', err)
    return c.json({ error: 'Failed to fetch publish status' }, 500)
  }
})

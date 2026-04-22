import { Hono } from 'hono'
import type { Env } from '../env'
import type { ProductFilters } from '../types'

export const productRoutes = new Hono<{ Bindings: Env }>()

// GET /products - List products with filters
productRoutes.get('/', async (c) => {
  try {
    const filters: ProductFilters = {
      domain_id: c.req.query('domain_id'),
      category_id: c.req.query('category_id'),
      status: c.req.query('status'),
      graveyard: c.req.query('graveyard') === 'true',
      limit: parseInt(c.req.query('limit') || '50'),
      offset: parseInt(c.req.query('offset') || '0'),
    }
    
    let query = `
      SELECT p.*, d.name as domain_name, d.slug as domain_slug, 
             c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN domains d ON p.domain_id = d.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    const bindings: any[] = []
    let paramIndex = 1
    
    if (filters.domain_id) {
      query += ` AND p.domain_id = $${paramIndex++}`
      bindings.push(filters.domain_id)
    }
    
    if (filters.category_id) {
      query += ` AND p.category_id = $${paramIndex++}`
      bindings.push(filters.category_id)
    }
    
    if (filters.status) {
      query += ` AND p.status = $${paramIndex++}`
      bindings.push(filters.status)
    }
    
    if (filters.graveyard) {
      query += ` AND p.graveyard_at IS NOT NULL`
    } else {
      query += ` AND p.graveyard_at IS NULL`
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    bindings.push(filters.limit, filters.offset)
    
    const result = await c.env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      products: result.results,
      total: result.results.length,
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (err) {
    console.error('Error listing products:', err)
    return c.json({ error: 'Failed to list products' }, 500)
  }
})

// GET /products/:id - Get product detail
productRoutes.get('/:id', async (c) => {
  try {
    const productId = c.req.param('id')
    
    // Fetch product with domain/category info
    const product = await c.env.DB.prepare(`
      SELECT p.*, d.name as domain_name, d.slug as domain_slug, d.color as domain_color,
             c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN domains d ON p.domain_id = d.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(productId).first()
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Fetch platform variants
    const platformVariants = await c.env.DB.prepare(`
      SELECT pv.id, pv.platform_id, pl.name as platform_name, pv.title, pv.description,
             pv.tags, pv.price, pv.currency, pv.status
      FROM platform_variants pv
      JOIN platforms pl ON pv.platform_id = pl.id
      WHERE pv.product_id = ?
    `).bind(productId).all()

    // Fetch social variants
    const socialVariants = await c.env.DB.prepare(`
      SELECT sv.id, sv.channel_id, sc.name as channel_name, sv.content, sv.status
      FROM social_variants sv
      JOIN social_channels sc ON sv.channel_id = sc.id
      WHERE sv.product_id = ?
    `).bind(productId).all()

    // Fetch reviews
    const reviews = await c.env.DB.prepare(`
      SELECT id, ai_score, decision, section_scores, feedback, reviewed_at
      FROM reviews WHERE product_id = ? ORDER BY reviewed_at DESC
    `).bind(productId).all()
    
    // Fetch workflow runs
    const workflowRuns = await c.env.DB.prepare(`
      SELECT id, status, current_step, error, started_at, completed_at, created_at
      FROM workflow_runs WHERE product_id = ? ORDER BY created_at DESC
    `).bind(productId).all()
    
    return c.json({
      ...product,
      platform_variants: platformVariants.results,
      social_variants: socialVariants.results,
      reviews: reviews.results,
      workflow_runs: workflowRuns.results,
    })
  } catch (err) {
    console.error('Error fetching product:', err)
    return c.json({ error: 'Failed to fetch product' }, 500)
  }
})

// GET /products/:id/detail - Full product payload for the CEO review screen
productRoutes.get('/:id/detail', async (c) => {
  try {
    const productId = c.req.param('id')

    const product = await c.env.DB.prepare(`
      SELECT p.*, d.name as domain_name, d.slug as domain_slug, d.color as domain_color,
             cat.name as category_name, cat.slug as category_slug
      FROM products p
      JOIN domains d ON p.domain_id = d.id
      JOIN categories cat ON p.category_id = cat.id
      WHERE p.id = ?
    `).bind(productId).first<any>()

    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }

    const [titleRow, review, platformRows, socialRows, assetRows] = await Promise.all([
      c.env.DB
        .prepare(`SELECT variant_a, variant_b, variant_c, selected FROM title_variants WHERE product_id = ? ORDER BY created_at DESC LIMIT 1`)
        .bind(productId).first<any>(),
      c.env.DB
        .prepare(`SELECT ai_score, section_scores, decision, feedback, revised_sections FROM reviews WHERE product_id = ? ORDER BY reviewed_at DESC LIMIT 1`)
        .bind(productId).first<any>(),
      c.env.DB.prepare(`
        SELECT pv.id, pv.product_id, pv.platform_id, pv.title, pv.description, pv.tags, pv.price,
               pv.currency, pv.status, pv.created_at, pv.updated_at,
               pl.name AS platform_name, pl.slug AS platform_slug
        FROM platform_variants pv
        JOIN platforms pl ON pv.platform_id = pl.id
        WHERE pv.product_id = ?
      `).bind(productId).all<any>(),
      c.env.DB.prepare(`
        SELECT sv.id, sv.product_id, sv.channel_id, sv.content, sv.status, sv.created_at, sv.updated_at,
               sc.name AS channel_name, sc.slug AS channel_slug
        FROM social_variants sv
        JOIN social_channels sc ON sv.channel_id = sc.id
        WHERE sv.product_id = ?
      `).bind(productId).all<any>(),
      c.env.DB
        .prepare(`SELECT id, asset_type, cdn_url, r2_key, mime_type FROM assets WHERE product_id = ?`)
        .bind(productId).all<any>(),
    ])

    const titleVariants: string[] = titleRow
      ? [titleRow.variant_a, titleRow.variant_b, titleRow.variant_c].filter(Boolean) as string[]
      : []
    const selectedTitleIndex = titleRow?.selected === 'b' ? 1 : titleRow?.selected === 'c' ? 2 : 0

    const sectionScores = safeParse(review?.section_scores) ?? {
      title: 0, description: 0, seo: 0, price: 0,
      platform_fit: 0, human_quality: 0, competitive_position: 0,
    }
    const revised = safeParse(review?.revised_sections) ?? {}

    const platformVariants = (platformRows.results ?? []).map((v: any) => ({
      ...v,
      tags: typeof v.tags === 'string' && v.tags.length
        ? v.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
    }))

    const socialVariants = (socialRows.results ?? []).map((v: any) => {
      const parsed = safeParse(v.content) ?? {}
      return {
        ...v,
        content: {
          caption: parsed.caption ?? '',
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
          hook: parsed.hook,
          thread: parsed.thread,
        },
      }
    })

    const tags: string[] = typeof product.tags === 'string' && product.tags.length
      ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    const revenueEstimate = safeParse(product.revenue_estimate)

    const detail = {
      // Product columns
      ...product,
      // Overrides / computed
      description: revised.description ?? product.description ?? '',
      tags: revised.tags ?? tags,
      price: typeof product.price === 'number' ? product.price : 0,
      currency: product.currency ?? 'USD',
      ai_score: product.ai_score ?? review?.ai_score ?? 0,
      section_scores: sectionScores,
      issues: [] as unknown[],
      title_variants: titleVariants,
      selected_title_index: selectedTitleIndex,
      platform_variants: platformVariants,
      social_variants: socialVariants,
      assets: assetRows.results ?? [],
      health_check: [] as unknown[],
      revenue_estimate_detail: revenueEstimate,
    }

    return c.json(detail)
  } catch (err) {
    console.error('Error fetching product detail:', err)
    return c.json({ error: 'Failed to fetch product detail' }, 500)
  }
})

// PATCH /products/:id/detail - Inline edit from the Review screen
productRoutes.patch('/:id/detail', async (c) => {
  try {
    const productId = c.req.param('id')
    const patch = await c.req.json<Record<string, unknown>>()

    const sets: string[] = []
    const vals: unknown[] = []

    if (typeof patch.name === 'string') { sets.push('name = ?'); vals.push(patch.name) }
    if (typeof patch.description === 'string') { sets.push('description = ?'); vals.push(patch.description) }
    if (Array.isArray(patch.tags)) {
      sets.push('tags = ?')
      vals.push((patch.tags as unknown[]).map(String).join(','))
    }
    if (typeof patch.price === 'number') { sets.push('price = ?'); vals.push(patch.price) }
    if (typeof patch.currency === 'string') { sets.push('currency = ?'); vals.push(patch.currency) }
    if (typeof patch.selected_title_index === 'number') {
      const sel = ['a', 'b', 'c'][Math.max(0, Math.min(2, patch.selected_title_index))]
      await c.env.DB
        .prepare(`UPDATE title_variants SET selected = ? WHERE product_id = ?`)
        .bind(sel, productId)
        .run()
    }

    if (sets.length > 0) {
      sets.push('updated_at = ?')
      vals.push(new Date().toISOString())
      vals.push(productId)
      await c.env.DB
        .prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`)
        .bind(...vals)
        .run()
    }

    // Return the freshly-hydrated detail (reuse the GET handler's logic)
    return c.redirect(`/api/products/${productId}/detail`, 303)
  } catch (err) {
    console.error('Error patching product detail:', err)
    return c.json({ error: 'Failed to update product detail' }, 500)
  }
})

function safeParse(raw: unknown): any {
  if (typeof raw !== 'string' || !raw.trim()) return null
  try { return JSON.parse(raw) } catch { return null }
}

// PATCH /products/:id - Update product
productRoutes.patch('/:id', async (c) => {
  try {
    const productId = c.req.param('id')
    const updates = await c.req.json()
    
    const allowedFields = ['name', 'niche', 'status', 'user_input', 'ai_score', 'revenue_estimate']
    const setClause: string[] = []
    const values: any[] = []
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`)
        values.push(typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field])
      }
    }
    
    if (setClause.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400)
    }
    
    setClause.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(productId)
    
    const result = await c.env.DB.prepare(`
      UPDATE products SET ${setClause.join(', ')} WHERE id = ?
    `).bind(...values).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Invalidate cache
    await c.env.CONFIG.delete(`product:${productId}`)
    
    const updated = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first()
    return c.json(updated)
  } catch (err) {
    console.error('Error updating product:', err)
    return c.json({ error: 'Failed to update product' }, 500)
  }
})

// DELETE /products/:id - Delete product
productRoutes.delete('/:id', async (c) => {
  try {
    const productId = c.req.param('id')
    
    // Get all assets for this product before deleting
    const assets = await c.env.DB.prepare(
      'SELECT r2_key, cf_image_id FROM assets WHERE product_id = ?'
    ).bind(productId).all()
    
    // Run all deletions in parallel
    await Promise.allSettled([
      // Delete D1 records (cascade will handle related records)
      c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productId).run(),
      
      // Delete R2 files
      ...assets.results.map((a: any) => 
        a.r2_key ? c.env.ASSETS.delete(a.r2_key) : Promise.resolve()
      ),
      
      // Delete CF Images
      ...assets.results.map((a: any) => {
        if (!a.cf_image_id) return Promise.resolve()
        return fetch(
          `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/images/v1/${a.cf_image_id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${c.env.CF_API_TOKEN}` }
          }
        )
      }),
      
      // Invalidate KV cache
      c.env.CONFIG.delete(`product:${productId}`),
    ])
    
    return c.json({ message: 'Product deleted' })
  } catch (err) {
    console.error('Error deleting product:', err)
    return c.json({ error: 'Failed to delete product' }, 500)
  }
})

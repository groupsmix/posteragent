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
             pv.tags, pv.status
      FROM platform_variants pv
      JOIN platforms pl ON pv.platform_id = pl.id
      WHERE pv.product_id = ?
    `).bind(productId).all()
    
    // Fetch social variants
    const socialVariants = await c.env.DB.prepare(`
      SELECT sv.id, sv.channel_id, sc.name as channel_name, sv.content, sv.hashtags
      FROM social_variants sv
      JOIN social_channels sc ON sv.channel_id = sc.id
      WHERE sv.product_id = ?
    `).bind(productId).all()
    
    // Fetch reviews
    const reviews = await c.env.DB.prepare(`
      SELECT id, reviewer_type, overall_score, approved, feedback, created_at
      FROM reviews WHERE product_id = ? ORDER BY created_at DESC
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

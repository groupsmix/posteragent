import { Hono } from 'hono'
import type { Env } from '../env'

export const reviewRoutes = new Hono<{ Bindings: Env }>()

// POST /review/:productId/approve - Approve product for publishing
reviewRoutes.post('/:productId/approve', async (c) => {
  try {
    const productId = c.req.param('productId')
    const now = new Date().toISOString()
    
    // Update product status to approved
    const result = await env.DB.prepare(`
      UPDATE products SET status = 'approved', updated_at = ? WHERE id = ?
    `).bind(now, productId).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Create approval review record
    const reviewId = crypto.randomUUID()
    await env.DB.prepare(`
      INSERT INTO reviews (id, product_id, reviewer_type, overall_score, approved, feedback, created_at)
      VALUES (?, ?, 'user', 10, 1, 'Approved for publishing', ?)
    `).bind(reviewId, productId, now).run()
    
    // Invalidate cache
    await env.CONFIG.delete(`product:${productId}`)
    
    return c.json({ message: 'Product approved', product_id: productId })
  } catch (err) {
    console.error('Error approving product:', err)
    return c.json({ error: 'Failed to approve product' }, 500)
  }
})

// POST /review/:productId/reject - Reject product with feedback
reviewRoutes.post('/:productId/reject', async (c) => {
  try {
    const productId = c.req.param('productId')
    const { feedback, reason } = await c.req.json()
    const now = new Date().toISOString()
    
    if (!feedback) {
      return c.json({ error: 'Feedback is required' }, 400)
    }
    
    // Update product status to rejected
    const result = await env.DB.prepare(`
      UPDATE products SET status = 'rejected', updated_at = ? WHERE id = ?
    `).bind(now, productId).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Create rejection review record
    const reviewId = crypto.randomUUID()
    await env.DB.prepare(`
      INSERT INTO reviews (id, product_id, reviewer_type, overall_score, approved, feedback, created_at)
      VALUES (?, ?, 'user', 0, 0, ?, ?)
    `).bind(reviewId, productId, feedback, now).run()
    
    // Invalidate cache
    await env.CONFIG.delete(`product:${productId}`)
    
    return c.json({ message: 'Product rejected', product_id: productId, reason })
  } catch (err) {
    console.error('Error rejecting product:', err)
    return c.json({ error: 'Failed to reject product' }, 500)
  }
})

// POST /review/:productId/revise - Request revision
reviewRoutes.post('/:productId/revise', async (c) => {
  try {
    const productId = c.req.param('productId')
    const { sections } = await c.req.json()
    const now = new Date().toISOString()
    
    if (!sections || !Array.isArray(sections)) {
      return c.json({ error: 'sections array is required' }, 400)
    }
    
    // Update product status to in_revision
    const result = await env.DB.prepare(`
      UPDATE products SET status = 'in_revision', updated_at = ? WHERE id = ?
    `).bind(now, productId).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Create revision review record
    const reviewId = crypto.randomUUID()
    const revisionData = JSON.stringify({ sections })
    
    await env.DB.prepare(`
      INSERT INTO reviews (id, product_id, reviewer_type, overall_score, approved, feedback, created_at)
      VALUES (?, ?, 'revision', 5, 0, ?, ?)
    `).bind(reviewId, productId, revisionData, now).run()
    
    // Invalidate cache
    await env.CONFIG.delete(`product:${productId}`)
    
    return c.json({ message: 'Revision requested', product_id: productId, sections })
  } catch (err) {
    console.error('Error requesting revision:', err)
    return c.json({ error: 'Failed to request revision' }, 500)
  }
})

// GET /review/:productId - Get all reviews for a product
reviewRoutes.get('/:productId', async (c) => {
  try {
    const productId = c.req.param('productId')
    
    const reviews = await env.DB.prepare(`
      SELECT id, reviewer_type, overall_score, approved, feedback, created_at
      FROM reviews WHERE product_id = ? ORDER BY created_at DESC
    `).bind(productId).all()
    
    return c.json({ reviews: reviews.results })
  } catch (err) {
    console.error('Error fetching reviews:', err)
    return c.json({ error: 'Failed to fetch reviews' }, 500)
  }
})

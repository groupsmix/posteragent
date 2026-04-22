import { Hono } from 'hono'
import type { Env } from '../env'

export const historyRoutes = new Hono<{ Bindings: Env }>()

// GET /history - List workflow run history
historyRoutes.get('/', async (c) => {
  try {
    const productId = c.req.query('product_id')
    const status = c.req.query('status')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    
    let query = `
      SELECT wr.*, p.name as product_name, d.name as domain_name
      FROM workflow_runs wr
      JOIN products p ON wr.product_id = p.id
      JOIN domains d ON p.domain_id = d.id
      WHERE 1=1
    `
    const bindings: any[] = []
    
    if (productId) {
      query += ' AND wr.product_id = ?'
      bindings.push(productId)
    }
    
    if (status) {
      query += ' AND wr.status = ?'
      bindings.push(status)
    }
    
    query += ' ORDER BY wr.created_at DESC LIMIT ? OFFSET ?'
    bindings.push(limit, offset)
    
    const result = await c.env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      runs: result.results,
      total: result.results.length,
    })
  } catch (err) {
    console.error('Error listing history:', err)
    return c.json({ error: 'Failed to list history' }, 500)
  }
})

// GET /history/:id - Get workflow run with steps
historyRoutes.get('/:id', async (c) => {
  try {
    const runId = c.req.param('id')
    
    const run = await c.env.DB.prepare(`
      SELECT wr.*, p.name as product_name, p.user_input
      FROM workflow_runs wr
      JOIN products p ON wr.product_id = p.id
      WHERE wr.id = ?
    `).bind(runId).first()
    
    if (!run) {
      return c.json({ error: 'Workflow run not found' }, 404)
    }
    
    const steps = await c.env.DB.prepare(`
      SELECT * FROM workflow_steps WHERE run_id = ? ORDER BY step_order
    `).bind(runId).all()
    
    return c.json({
      ...run,
      steps: steps.results,
    })
  } catch (err) {
    console.error('Error fetching history:', err)
    return c.json({ error: 'Failed to fetch history' }, 500)
  }
})

// GET /history/:id/step/:stepId - Get step detail
historyRoutes.get('/:id/step/:stepId', async (c) => {
  try {
    const runId = c.req.param('id')
    const stepId = c.req.param('stepId')
    
    const step = await c.env.DB.prepare(`
      SELECT * FROM workflow_steps WHERE id = ? AND run_id = ?
    `).bind(stepId, runId).first()
    
    if (!step) {
      return c.json({ error: 'Step not found' }, 404)
    }
    
    return c.json(step)
  } catch (err) {
    console.error('Error fetching step:', err)
    return c.json({ error: 'Failed to fetch step' }, 500)
  }
})

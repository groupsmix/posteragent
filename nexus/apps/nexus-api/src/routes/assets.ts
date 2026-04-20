import { Hono } from 'hono'
import type { Env } from '../env'

export const assetRoutes = new Hono<{ Bindings: Env }>()

// GET /assets - List assets (optionally filtered by product)
assetRoutes.get('/', async (c) => {
  try {
    const productId = c.req.query('product_id')
    const assetType = c.req.query('type')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    
    let query = 'SELECT * FROM assets WHERE 1=1'
    const bindings: any[] = []
    
    if (productId) {
      query += ' AND product_id = ?'
      bindings.push(productId)
    }
    
    if (assetType) {
      query += ' AND asset_type = ?'
      bindings.push(assetType)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    bindings.push(limit, offset)
    
    const result = await env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      assets: result.results,
      total: result.results.length,
      limit,
      offset,
    })
  } catch (err) {
    console.error('Error listing assets:', err)
    return c.json({ error: 'Failed to list assets' }, 500)
  }
})

// GET /assets/:id - Get asset
assetRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const asset = await env.DB.prepare('SELECT * FROM assets WHERE id = ?').bind(id).first()
    
    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404)
    }
    
    return c.json(asset)
  } catch (err) {
    console.error('Error fetching asset:', err)
    return c.json({ error: 'Failed to fetch asset' }, 500)
  }
})

// DELETE /assets/:id - Delete asset
assetRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get asset info first
    const asset = await env.DB.prepare('SELECT * FROM assets WHERE id = ?').bind(id).first() as any
    
    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404)
    }
    
    // Delete from all storage in parallel
    await Promise.allSettled([
      // Delete from D1
      env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(id).run(),
      
      // Delete from R2
      asset.r2_key ? env.ASSETS.delete(asset.r2_key) : Promise.resolve(),
      
      // Delete from CF Images
      asset.cf_image_id ? fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1/${asset.cf_image_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` }
        }
      ) : Promise.resolve(),
    ])
    
    return c.json({ message: 'Asset deleted' })
  } catch (err) {
    console.error('Error deleting asset:', err)
    return c.json({ error: 'Failed to delete asset' }, 500)
  }
})

// GET /assets/:id/download - Get signed download URL
assetRoutes.get('/:id/download', async (c) => {
  try {
    const id = c.req.param('id')
    const asset = await env.DB.prepare('SELECT * FROM assets WHERE id = ?').bind(id).first() as any
    
    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404)
    }
    
    if (!asset.r2_key) {
      return c.json({ error: 'No R2 file associated with this asset' }, 400)
    }
    
    // Generate a signed URL for R2 (1 hour expiry)
    const url = await env.ASSETS.createSignedUrl({
      key: asset.r2_key,
      expiresIn: 3600,
    })
    
    return c.json({ download_url: url, expires_in: 3600 })
  } catch (err) {
    console.error('Error generating download URL:', err)
    return c.json({ error: 'Failed to generate download URL' }, 500)
  }
})

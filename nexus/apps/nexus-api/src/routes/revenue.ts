import { Hono } from 'hono'
import type { Env } from '../env'
import { getSecret } from '../services/publishers'

// ============================================================
// Revenue — REAL sales pulled from Gumroad (not estimates).
// When GUMROAD_ACCESS_TOKEN is set we read the seller's products and
// their actual sales counts / gross. When it's not set we say so
// honestly instead of inventing numbers.
// ============================================================

interface GumroadProduct {
  id: string
  name: string
  sales_count?: number
  sales_usd_cents?: number
  short_url?: string
  published?: boolean
}

export const revenueRoutes = new Hono<{ Bindings: Env }>()

revenueRoutes.get('/', async (c) => {
  const token = await getSecret(c.env, 'GUMROAD_ACCESS_TOKEN')
  if (!token) {
    return c.json({
      configured: false,
      message: 'Connect Gumroad (add GUMROAD_ACCESS_TOKEN on the API keys page) to track real sales.',
    })
  }

  try {
    const res = await fetch(
      `https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(token)}`,
    )
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean
      products?: GumroadProduct[]
      message?: string
    }
    if (!res.ok || !data.success) {
      return c.json(
        { configured: true, error: data.message || `Gumroad error ${res.status}` },
        502,
      )
    }

    const products = (data.products || []).map((p) => ({
      id: p.id,
      name: p.name,
      sales: p.sales_count ?? 0,
      revenue: Math.round((p.sales_usd_cents ?? 0)) / 100,
      url: p.short_url || null,
      published: Boolean(p.published),
    }))

    products.sort((a, b) => b.revenue - a.revenue)

    const totalSales = products.reduce((s, p) => s + p.sales, 0)
    const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)

    return c.json({
      configured: true,
      currency: 'USD',
      total_sales: totalSales,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      product_count: products.length,
      best_seller: products.find((p) => p.sales > 0)?.name || null,
      products,
    })
  } catch (err) {
    console.error('Revenue fetch failed:', err)
    return c.json({ configured: true, error: 'Failed to reach Gumroad' }, 502)
  }
})

import type { Env } from '../env'
import { getSecret } from './publishers'
import { sendEmail } from '../routes/schedules'

// ============================================================
// Daily digest — the "while you slept" morning report. One glance at what got
// built, what sold, what needs review, and what it cost. Surfaced on the
// dashboard (GET /api/digest) and emailed each morning from the cron.
// ============================================================

export interface Digest {
  date: string
  built_24h: number
  needs_review: number
  published: number
  approved: number
  spend_today: number
  spend_cap: number
  sales_configured: boolean
  total_sales: number
  total_revenue: number
  best_seller: string | null
  recent: { name: string; created_at: string }[]
}

interface CountRow { n: number }

async function spend(env: Env): Promise<{ today: number; cap: number }> {
  try {
    const res = await env.AI_WORKER.fetch(new Request('https://nexus-ai/spend'))
    if (res.ok) {
      const d = (await res.json()) as { today?: number; cap?: number }
      return { today: Number(d.today) || 0, cap: Number(d.cap) || 0 }
    }
  } catch { /* free models, no meter */ }
  return { today: 0, cap: 0 }
}

interface GumroadProduct { name: string; sales_count?: number; sales_usd_cents?: number }

async function sales(env: Env): Promise<{
  configured: boolean
  total_sales: number
  total_revenue: number
  best_seller: string | null
}> {
  const token = await getSecret(env, 'GUMROAD_ACCESS_TOKEN')
  if (!token) return { configured: false, total_sales: 0, total_revenue: 0, best_seller: null }
  try {
    const res = await fetch(`https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(token)}`)
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; products?: GumroadProduct[] }
    if (!res.ok || !data.success) return { configured: true, total_sales: 0, total_revenue: 0, best_seller: null }
    const products = (data.products || []).map((p) => ({
      name: p.name,
      sales: p.sales_count ?? 0,
      revenue: Math.round(p.sales_usd_cents ?? 0) / 100,
    }))
    products.sort((a, b) => b.revenue - a.revenue)
    return {
      configured: true,
      total_sales: products.reduce((s, p) => s + p.sales, 0),
      total_revenue: Math.round(products.reduce((s, p) => s + p.revenue, 0) * 100) / 100,
      best_seller: products.find((p) => p.sales > 0)?.name || null,
    }
  } catch {
    return { configured: true, total_sales: 0, total_revenue: 0, best_seller: null }
  }
}

export async function buildDigest(env: Env): Promise<Digest> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [built, review, published, approved, recent, sp, sl] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS n FROM products WHERE created_at >= ?`).bind(since).first<CountRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM products WHERE status = 'pending_review'`).first<CountRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM products WHERE status = 'published'`).first<CountRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM products WHERE status = 'approved'`).first<CountRow>(),
    env.DB.prepare(
      `SELECT name, created_at FROM products WHERE created_at >= ? ORDER BY created_at DESC LIMIT 8`,
    ).bind(since).all<{ name: string; created_at: string }>(),
    spend(env),
    sales(env),
  ])

  return {
    date: new Date().toISOString().slice(0, 10),
    built_24h: built?.n ?? 0,
    needs_review: review?.n ?? 0,
    published: published?.n ?? 0,
    approved: approved?.n ?? 0,
    spend_today: sp.today,
    spend_cap: sp.cap,
    sales_configured: sl.configured,
    total_sales: sl.total_sales,
    total_revenue: sl.total_revenue,
    best_seller: sl.best_seller,
    recent: (recent?.results ?? []).map((r) => ({ name: r.name, created_at: r.created_at })),
  }
}

export function digestMarkdown(d: Digest): string {
  const lines = [
    `# Your NEXUS morning report — ${d.date}`,
    '',
    `While you slept:`,
    '',
    `- **${d.built_24h}** product${d.built_24h === 1 ? '' : 's'} built in the last 24h`,
    `- **${d.needs_review}** waiting for your review`,
    `- **${d.published}** published · **${d.approved}** approved`,
    d.sales_configured
      ? `- **$${d.total_revenue.toFixed(2)}** in sales across ${d.total_sales} order${d.total_sales === 1 ? '' : 's'}${d.best_seller ? ` (best seller: ${d.best_seller})` : ''}`
      : `- Sales: connect Gumroad to track real revenue`,
    `- AI spend today: **$${d.spend_today.toFixed(2)}**${d.spend_cap > 0 ? ` of $${d.spend_cap.toFixed(2)} cap` : ' (free models)'}`,
  ]
  if (d.recent.length) {
    lines.push('', '## Built overnight')
    for (const r of d.recent) lines.push(`- ${r.name}`)
  }
  if (d.needs_review > 0) {
    lines.push('', `You have ${d.needs_review} product${d.needs_review === 1 ? '' : 's'} to review on your dashboard.`)
  }
  return lines.join('\n')
}

// Cron entrypoint: email the morning report (best-effort, only sends when a
// Resend key + recipient are configured — otherwise it's a no-op).
export async function sendDailyDigest(env: Env): Promise<void> {
  try {
    const d = await buildDigest(env)
    const status = await sendEmail(env, null, `NEXUS morning report — ${d.date}`, digestMarkdown(d))
    console.log(`[cron] daily digest email: ${status}`)
  } catch (err) {
    console.error('[cron] daily digest failed:', err)
  }
}

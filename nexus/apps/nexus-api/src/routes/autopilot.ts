import { Hono } from 'hono'
import type { Env } from '../env'
import { ProductWorkflow } from '../services/workflow-engine'
import { buildListingPayload } from './publish'
import { publishToPlatform } from '../services/publishers'

// ============================================================
// Autopilot "money engine" — when ON, the CEO loops on its own:
// research a niche → build a real product with the agent team → log it.
// (Listing happens via Publish center / when a store token is connected.)
// A dashboard shows the pipeline, what's been built, and revenue estimates.
// ============================================================

export const autopilotRoutes = new Hono<{ Bindings: Env }>()

interface AutopilotExecCtx { waitUntil(p: Promise<unknown>): void }

async function getSetting(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ? LIMIT 1')
    .bind(key).first<{ value: string }>().catch(() => null)
  return row?.value ?? null
}

async function setSetting(env: Env, key: string, value: string): Promise<void> {
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
  ).bind(key, value, now, value, now).run()
}

async function log(env: Env, action: string, fields: { product_id?: string; niche?: string; domain_slug?: string; note?: string }) {
  await env.DB.prepare(
    `INSERT INTO autopilot_log (id, action, product_id, niche, domain_slug, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(), action,
    fields.product_id ?? null, fields.niche ?? null, fields.domain_slug ?? null, fields.note ?? null,
    new Date().toISOString(),
  ).run().catch(() => void 0)
}

// --- Status: toggle state + stats + recent activity + winners ----------
autopilotRoutes.get('/status', async (c) => {
  const enabled = (await getSetting(c.env, 'autopilot_enabled')) === 'true'
  const perRun = Number((await getSetting(c.env, 'autopilot_per_run')) || '1') || 1
  const autoApprove = (await getSetting(c.env, 'autopilot_auto_approve')) === 'true'
  const autoPublish = (await getSetting(c.env, 'autopilot_auto_publish')) === 'true'
  const minScore = Number((await getSetting(c.env, 'autopilot_min_score')) || '7') || 7

  const builtRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM autopilot_log WHERE action = 'build'`,
  ).first<{ n: number }>().catch(() => ({ n: 0 }))

  // Estimated revenue across all products that have an estimate.
  const products = await c.env.DB.prepare(
    `SELECT id, name, status, ai_score, revenue_estimate FROM products WHERE revenue_estimate IS NOT NULL`,
  ).all<{ id: string; name: string; status: string; ai_score: number; revenue_estimate: string }>()

  let estLow = 0, estHigh = 0
  const scored: { id: string; name: string; status: string; ai_score: number; est: number }[] = []
  for (const p of products.results ?? []) {
    let est = 0
    try {
      const r = JSON.parse(p.revenue_estimate)
      if (typeof r?.min === 'number') estLow += r.min
      if (typeof r?.max === 'number') estHigh += r.max
      est = typeof r?.max === 'number' ? r.max : (typeof r?.min === 'number' ? r.min : 0)
    } catch {}
    scored.push({ id: p.id, name: p.name, status: p.status, ai_score: p.ai_score, est })
  }
  const winners = scored.sort((a, b) => (b.ai_score - a.ai_score) || (b.est - a.est)).slice(0, 5)

  const recent = await c.env.DB.prepare(
    `SELECT action, product_id, niche, domain_slug, note, created_at FROM autopilot_log ORDER BY created_at DESC LIMIT 20`,
  ).all()

  return c.json({
    enabled,
    per_run: perRun,
    auto_approve: autoApprove,
    auto_publish: autoPublish,
    min_score: minScore,
    products_built: builtRow?.n ?? 0,
    est_revenue: { low: Math.round(estLow), high: Math.round(estHigh), currency: 'USD' },
    winners,
    recent: recent.results ?? [],
  })
})

// --- Toggle on/off + set throughput ------------------------------------
autopilotRoutes.post('/toggle', async (c) => {
  const b = await c.req.json().catch(() => ({})) as Record<string, unknown>
  if (typeof b.enabled === 'boolean') await setSetting(c.env, 'autopilot_enabled', b.enabled ? 'true' : 'false')
  if (typeof b.auto_approve === 'boolean') await setSetting(c.env, 'autopilot_auto_approve', b.auto_approve ? 'true' : 'false')
  if (typeof b.auto_publish === 'boolean') await setSetting(c.env, 'autopilot_auto_publish', b.auto_publish ? 'true' : 'false')
  if (typeof b.per_run === 'number' && b.per_run >= 1 && b.per_run <= 10) {
    await setSetting(c.env, 'autopilot_per_run', String(Math.floor(b.per_run)))
  }
  if (typeof b.min_score === 'number' && b.min_score >= 0 && b.min_score <= 10) {
    await setSetting(c.env, 'autopilot_min_score', String(b.min_score))
  }
  const enabled = (await getSetting(c.env, 'autopilot_enabled')) === 'true'
  return c.json({ ok: true, enabled })
})

// --- Run one cycle now (test without waiting for cron) -----------------
autopilotRoutes.post('/run', async (c) => {
  const built = await runCycle(c.env, c.executionCtx, 1)
  return c.json({ ok: true, built })
})

// ============================================================
// The loop
// ============================================================

async function callAIJson(env: Env, prompt: string): Promise<unknown> {
  try {
    const res = await env.AI_WORKER.fetch(new Request('https://nexus-ai/task', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskType: 'niche_finder', prompt, outputFormat: 'json', timeoutMs: 60000 }),
    }))
    if (!res.ok) return null
    const data = (await res.json()) as { output?: string }
    try { return JSON.parse(data.output ?? '') } catch { return null }
  } catch { return null }
}

// Research a niche (prefer a fresh trend alert, else ask the AI) and return
// {domainSlug, categorySlug, niche}.
async function pickNiche(env: Env): Promise<{ domainSlug: string; categorySlug: string; niche: string } | null> {
  // Prefer an unused trend alert in an active domain.
  const alert = await env.DB.prepare(
    `SELECT t.id AS alert_id, t.trend_keyword, t.suggested_niche, d.slug AS domain_slug
       FROM trend_alerts t JOIN domains d ON d.id = t.domain_id
      WHERE t.status = 'new' AND d.is_active = 1
      ORDER BY t.trend_score DESC LIMIT 1`,
  ).first<{ alert_id: string; trend_keyword: string; suggested_niche: string | null; domain_slug: string }>().catch(() => null)

  let domainSlug: string
  let niche: string
  if (alert) {
    await env.DB.prepare(`UPDATE trend_alerts SET status = 'used' WHERE id = ?`).bind(alert.alert_id).run().catch(() => void 0)
    domainSlug = alert.domain_slug
    niche = alert.suggested_niche || alert.trend_keyword
  } else {
    const dom = await env.DB.prepare(`SELECT slug FROM domains WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1`)
      .first<{ slug: string }>().catch(() => null)
    if (!dom) return null
    domainSlug = dom.slug
    const j = (await callAIJson(env, `Suggest ONE specific, high-demand digital-product niche for the "${domainSlug}" domain. Return JSON {niche:string}.`)) as { niche?: string } | null
    niche = j?.niche || `${domainSlug} essentials`
  }

  const cat = await env.DB.prepare(
    `SELECT c.slug FROM categories c JOIN domains d ON d.id = c.domain_id WHERE d.slug = ? ORDER BY RANDOM() LIMIT 1`,
  ).bind(domainSlug).first<{ slug: string }>().catch(() => null)
  return { domainSlug, categorySlug: cat?.slug || 'templates', niche }
}

// Harvest finished autopilot products: auto-approve those scoring >= the
// threshold, and (if enabled + a store token exists) attempt to list them.
// Runs at the start of every cycle so each tick advances the prior batch.
async function harvest(env: Env): Promise<void> {
  if ((await getSetting(env, 'autopilot_auto_approve')) !== 'true') return
  const minScore = Number((await getSetting(env, 'autopilot_min_score')) || '7') || 7
  const autoPublish = (await getSetting(env, 'autopilot_auto_publish')) === 'true'

  const rows = await env.DB.prepare(
    `SELECT p.id, p.name, p.ai_score FROM products p
       JOIN autopilot_log a ON a.product_id = p.id AND a.action = 'build'
      WHERE p.status = 'pending_review' AND p.ai_score >= ?
      GROUP BY p.id LIMIT 10`,
  ).bind(minScore).all<{ id: string; name: string; ai_score: number }>().catch(() => ({ results: [] as { id: string; name: string; ai_score: number }[] }))

  for (const p of rows.results ?? []) {
    await env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?')
      .bind('approved', new Date().toISOString(), p.id).run()
    await log(env, 'approve', { product_id: p.id, note: `Auto-approved "${p.name}" (score ${p.ai_score})` })

    if (!autoPublish) continue
    const variants = await env.DB.prepare(
      `SELECT pv.*, pl.url as platform_url, pl.name as platform_name
         FROM platform_variants pv JOIN platforms pl ON pv.platform_id = pl.id
        WHERE pv.product_id = ? AND pv.status != 'published'`,
    ).bind(p.id).all<Record<string, unknown>>().catch(() => ({ results: [] as Record<string, unknown>[] }))
    let published = 0
    const notes: string[] = []
    for (const v of variants.results ?? []) {
      try {
        const outcome = await publishToPlatform(await buildListingPayload(env, v), env)
        if (outcome.status === 'success') {
          published++
          await env.DB.prepare(`UPDATE platform_variants SET status='published', published_at=?, published_url=? WHERE id=?`)
            .bind(new Date().toISOString(), outcome.url || '#', v.id).run()
          notes.push(`${v.platform_name}: published`)
        } else {
          notes.push(`${v.platform_name}: ${outcome.error || 'failed'}`)
        }
      } catch (err) {
        notes.push(`${v.platform_name}: ${err instanceof Error ? err.message : 'error'}`)
      }
    }
    if (published > 0 && published === (variants.results ?? []).length) {
      await env.DB.prepare(`UPDATE products SET status='published', updated_at=? WHERE id=?`)
        .bind(new Date().toISOString(), p.id).run()
    }
    await log(env, 'publish', { product_id: p.id, note: `Publish "${p.name}": ${notes.join('; ') || 'no variants yet'}` })
  }
}

// Build `count` products autonomously. Returns the number dispatched.
export async function runCycle(env: Env, ctx: AutopilotExecCtx, count: number): Promise<number> {
  await harvest(env)
  let built = 0
  for (let i = 0; i < count; i++) {
    const pick = await pickNiche(env)
    if (!pick) { await log(env, 'skip', { note: 'no active domain / niche found' }); continue }
    await log(env, 'research', { niche: pick.niche, domain_slug: pick.domainSlug, note: `Chose niche "${pick.niche}"` })

    const now = new Date().toISOString()
    const productId = crypto.randomUUID()
    const runId = crypto.randomUUID()
    const domain = await env.DB.prepare('SELECT id FROM domains WHERE slug = ? LIMIT 1').bind(pick.domainSlug).first<{ id: string }>()
    const category = await env.DB.prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1').bind(pick.categorySlug).first<{ id: string }>()
    const userInput = { niche: pick.niche, let_ai_price: true }
    try {
      await env.DB.prepare(
        `INSERT INTO products (id, domain_id, category_id, name, niche, user_input, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?)`,
      ).bind(productId, domain?.id ?? null, category?.id ?? null, pick.niche, pick.niche, JSON.stringify(userInput), now, now).run()
      await env.DB.prepare(`INSERT INTO workflow_runs (id, product_id, status, created_at) VALUES (?, ?, 'queued', ?)`).bind(runId, productId, now).run()
      const engine = new ProductWorkflow(env)
      ctx.waitUntil(engine.run(runId, productId, pick.domainSlug, pick.categorySlug, userInput))
      await log(env, 'build', { product_id: productId, niche: pick.niche, domain_slug: pick.domainSlug, note: `Dispatched the agent team to build "${pick.niche}"` })
      built++
    } catch (err) {
      await log(env, 'error', { niche: pick.niche, note: err instanceof Error ? err.message : 'build failed' })
    }
  }
  return built
}

// Called by the daily cron — only runs when autopilot is ON.
export async function runAutopilot(env: Env, ctx: AutopilotExecCtx): Promise<void> {
  if ((await getSetting(env, 'autopilot_enabled')) !== 'true') return
  const perRun = Number((await getSetting(env, 'autopilot_per_run')) || '1') || 1
  await runCycle(env, ctx, perRun)
}

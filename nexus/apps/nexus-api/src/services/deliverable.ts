import type { Env } from '../env'
import type { AIRunTaskResponse } from '@nexus/types'
import { pickRecipe } from './recipes'
import { buildDeliverableHtml, renderPdf, type Deliverable } from './pdf'

// Same human-voice directive used by the workflow writers, kept local so the
// deliverable reads like the rest of the product.
const HUMAN_VOICE = `Write like a sharp human expert talking to one person. Be specific and concrete. Never use clichés ("in today's fast-paced world", "unlock", "game-changer", "dive in", "elevate", "seamless", "robust") or AI throat-clearing. Vary sentence length. No filler.`

function safeJson<T = unknown>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as T
      } catch {
        return null
      }
    }
    return null
  }
}

async function callAI(env: Env, prompt: string): Promise<string> {
  const ctl = new AbortController()
  const fetchP = (async () => {
    const res = await env.AI_WORKER.fetch(
      new Request('https://nexus-ai/task', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskType: 'generate_long_form', prompt, outputFormat: 'json', timeoutMs: 60000 }),
        signal: ctl.signal,
      }),
    )
    if (!res.ok) throw new Error(`AI worker failed: ${res.status} ${await res.text().catch(() => '')}`)
    return ((await res.json()) as AIRunTaskResponse).output
  })()
  return Promise.race([
    fetchP,
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        ctl.abort()
        reject(new Error('__deadline__'))
      }, 70000),
    ),
  ])
}

interface ProductRow {
  id: string
  name: string | null
  niche: string | null
  description: string | null
  deliverable_url: string | null
  domain_slug: string | null
  category_slug: string | null
}

// Generate the real downloadable deliverable for a single product and attach
// it (PDF in R2 + products.deliverable_url). Runs in its own worker invocation
// so it gets a full time budget instead of riding the tail of a long workflow.
// Returns the deliverable URL, or null when it couldn't be produced.
export async function generateDeliverableForProduct(
  env: Env,
  productId: string,
  opts: { force?: boolean } = {},
): Promise<{ url: string; format: string } | null> {
  if (!env.BROWSER) return null // PDF needs Browser Rendering.

  const product = await env.DB.prepare(
    `SELECT p.id, p.name, p.niche, p.description, p.deliverable_url,
            d.slug AS domain_slug, c.slug AS category_slug
       FROM products p
       LEFT JOIN domains d ON p.domain_id = d.id
       LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?`,
  ).bind(productId).first<ProductRow>()
  if (!product) return null
  if (product.deliverable_url && !opts.force) {
    return { url: product.deliverable_url, format: '' }
  }

  const niche = product.niche || product.name || 'general'
  const recipe = pickRecipe(product.domain_slug || '', product.category_slug || '', niche)
  const context = (product.description || '').slice(0, 600)

  const prompt = `You are creating the ACTUAL downloadable product a buyer pays for — the real file they open and use, NOT marketing copy. This is a ${recipe.format} for "${niche}".
${recipe.instruction}

${HUMAN_VOICE}

Context about the product: ${context}

6-10 sections of real, usable substance — no filler. Return ONLY JSON:
{"cover_title":string,"cover_subtitle":string,"intro":string,"sections":[{"heading":string,"content":string (optional),"checklist":[string] (optional),"table":{"headers":[string],"rows":[[string]]} (optional)}],"closing":string}
Use checklist/table where they fit a ${recipe.format}. Keep it under ~900 words. JSON only.`

  // The free model is occasionally lazy/invalid; try twice before giving up.
  let d: Deliverable | null = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      d = safeJson<Deliverable>(await callAI(env, prompt))
    } catch (err) {
      console.error(`[deliverable] generation failed for ${productId} (attempt ${attempt}):`, err)
      d = null
    }
    if (d && typeof d === 'object' && Array.isArray(d.sections) && d.sections.length > 0) break
    d = null
  }
  if (!d) return null

  try {
    const pdf = await renderPdf(env, buildDeliverableHtml(d, recipe.format))
    if (!pdf) return null
    const key = `products/${productId}-deliverable.pdf`
    await env.ASSETS.put(key, pdf, { httpMetadata: { contentType: 'application/pdf' } })
    const url = `/api/assets/r2/${key}`
    await env.DB.prepare(
      `UPDATE products SET deliverable_url=?, deliverable_format=?, updated_at=? WHERE id=?`,
    ).bind(url, recipe.format, new Date().toISOString(), productId).run()
    await env.DB.prepare(
      `INSERT INTO assets (id, product_id, asset_type, r2_key, filename, mime_type)
       VALUES (?, ?, 'deliverable_pdf', ?, ?, 'application/pdf')`,
    ).bind(crypto.randomUUID(), productId, key, 'deliverable.pdf').run().catch(() => void 0)
    return { url, format: recipe.format }
  } catch (err) {
    console.error(`[deliverable] render failed for ${productId}:`, err)
    return null
  }
}

// Nightly safety net: attach deliverables to recently-built products that
// don't have one yet (e.g. the inline self-invoke was evicted). Processed a
// few at a time to stay within the cron's time budget.
export async function backfillDeliverables(env: Env, limit = 3): Promise<void> {
  if (!env.BROWSER) return
  const rows = await env.DB.prepare(
    `SELECT id FROM products
      WHERE deliverable_url IS NULL
        AND status IN ('approved','pending_review','published')
      ORDER BY updated_at DESC
      LIMIT ?`,
  ).bind(limit).all<{ id: string }>().catch(() => null)
  for (const row of rows?.results ?? []) {
    await generateDeliverableForProduct(env, row.id).catch((err) =>
      console.error(`[deliverable] backfill failed for ${row.id}:`, err),
    )
  }
}

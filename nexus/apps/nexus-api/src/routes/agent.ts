import { Hono } from 'hono'
import type { Env } from '../env'
import { ProductWorkflow } from '../services/workflow-engine'
import { buildListingPayload } from './publish'
import { publishToPlatform } from '../services/publishers'
import { browse } from '../services/browser'

// ============================================================
// CEO Agent — a conversational, tool-using manager with full control.
// The owner talks to it in plain language; it decides which tool(s) to
// run (query, create, re-run, delete, approve/reject, publish), executes
// them, and reports back. Powered by the same free Groq/failover engine.
// ============================================================

export const agentRoutes = new Hono<{ Bindings: Env }>()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AgentStep {
  tool: string
  args: Record<string, unknown>
  ok: boolean
  summary: string
  product_id?: string
  screenshot_url?: string
}

const MAX_TURNS = 6

function jsonFromModel(raw: string): any {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1] : raw
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return null
  }
}

async function callAI(env: Env, prompt: string, outputFormat: 'json' | 'text' = 'json'): Promise<string> {
  let lastErr: unknown = null
  // Retry transient free-tier hiccups so the CEO rarely shows an engine error.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const req = new Request('https://nexus-ai/task', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskType: 'manager_plan', prompt, outputFormat, timeoutMs: 60000 }),
      })
      const res = await env.AI_WORKER.fetch(req)
      if (!res.ok) throw new Error(`AI worker failed: ${res.status}`)
      const data = (await res.json()) as { output?: string }
      return data.output ?? ''
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('ai_unreachable')
}

// Final pass: turn whatever the CEO gathered/did this turn into a warm,
// well-formatted written answer. This runs when the model called tools but
// never produced a {"reply"}, so the owner always gets a real message —
// never a bare "Done." status line.
async function composeReply(
  env: Env,
  opts: { message: string; convo: string; overview: string; scratch: string[] },
): Promise<string> {
  const work = opts.scratch.length ? opts.scratch.join('\n') : '(no actions were needed)'
  const prompt = `You are the CEO Manager of NEXUS, an AI digital-product engine, replying to the owner. Be warm, concrete and concise.

Write your reply in clean Markdown so it's easy to read:
- Open with one short sentence answering directly.
- Use **bold** for the key numbers/names.
- Use a numbered list for step-by-step plans, or a bullet list for items.
- Use a short "## Heading" only when it genuinely helps; keep it tight.
- Do NOT output JSON, do NOT mention "tools", and do NOT show raw internal IDs unless the owner asked for them.

LIVE SNAPSHOT:
${opts.overview}

Conversation so far:
${opts.convo || '(new conversation)'}

The owner just said:
"${opts.message}"

What you did / learned this turn:
${work}

Now write your final reply to the owner:`
  const out = await callAI(env, prompt, 'text')
  return (out || '').trim()
}

async function getCatalog(env: Env) {
  const cats = await env.DB.prepare(`
    SELECT c.slug AS category_slug, c.name AS category_name,
           d.slug AS domain_slug, d.name AS domain_name
    FROM categories c JOIN domains d ON c.domain_id = d.id
    WHERE c.is_active = 1 AND d.is_active = 1
    ORDER BY d.name, c.name
  `).all<any>()
  return cats.results || []
}

async function getOverview(env: Env): Promise<string> {
  const counts = await env.DB.prepare(`
    SELECT status, COUNT(*) AS n FROM products GROUP BY status
  `).all<any>()
  const recent = await env.DB.prepare(`
    SELECT id, name, status, ai_score FROM products ORDER BY created_at DESC LIMIT 10
  `).all<any>()
  const byStatus = (counts.results || []).map((r) => `${r.status}: ${r.n}`).join(', ') || 'no products yet'
  const list = (recent.results || [])
    .map((r) => `  - "${r.name || 'Untitled'}" [${(r.id as string).slice(0, 8)}] status=${r.status}${typeof r.ai_score === 'number' ? ` score=${r.ai_score}` : ''}`)
    .join('\n')
  return `Product counts → ${byStatus}\nMost recent products:\n${list || '  (none)'}`
}

const KEY_NAMES = ['GROQ_API_KEY', 'OPENAI_API_KEY', 'FAL_KEY', 'GUMROAD_ACCESS_TOKEN', 'SHOPIFY_STORE', 'SHOPIFY_ADMIN_TOKEN', 'PUBLISH_WEBHOOK_URL']
async function getKeyStatus(env: Env): Promise<string> {
  const out: string[] = []
  for (const k of KEY_NAMES) {
    let set = false
    try {
      const v = await env.CONFIG.get(`secret:${k}`)
      set = Boolean(v)
    } catch {}
    const envVal = (env as unknown as Record<string, unknown>)[k]
    if (!set && typeof envVal === 'string' && envVal.length > 0) set = true
    out.push(`${k}: ${set ? 'set' : 'not set'}`)
  }
  return `${out.join(', ')}. Note: AI text + images already run for free on the built-in engine (Groq + Cloudflare Workers AI) even with no keys set; these keys only add optional providers and real store/social publishing.`
}

// Resolve a loose product reference (full id, 8-char prefix, or name) to a row.
async function resolveProduct(env: Env, ref: string): Promise<any | null> {
  const r = (ref || '').trim()
  if (!r) return null
  const exact = await env.DB.prepare('SELECT id, name, status FROM products WHERE id = ?').bind(r).first<any>()
  if (exact) return exact
  const prefix = await env.DB.prepare('SELECT id, name, status FROM products WHERE id LIKE ? LIMIT 1').bind(`${r}%`).first<any>()
  if (prefix) return prefix
  const byName = await env.DB.prepare('SELECT id, name, status FROM products WHERE name LIKE ? ORDER BY created_at DESC LIMIT 1').bind(`%${r}%`).first<any>()
  return byName || null
}

async function createOneProduct(env: Env, ctx: ExecutionContext, p: any, validSlugs: Set<string>): Promise<AgentStep> {
  const domain_slug = (p.domain_slug || '').trim()
  const category_slug = (p.category_slug || '').trim()
  const label = p.product_name || p.niche || 'product'
  if (!domain_slug || !category_slug || !validSlugs.has(`${domain_slug}/${category_slug}`)) {
    return { tool: 'create_product', args: p, ok: false, summary: `Could not create "${label}" — no matching domain/category slug. Pick from the catalog.` }
  }
  try {
    const domain = await env.DB.prepare('SELECT id FROM domains WHERE slug = ? AND is_active = 1').bind(domain_slug).first<any>()
    const category = await env.DB.prepare('SELECT id FROM categories WHERE slug = ? AND domain_id = ? AND is_active = 1').bind(category_slug, domain.id).first<any>()
    const productId = crypto.randomUUID()
    const runId = crypto.randomUUID()
    const now = new Date().toISOString()
    const userInput = { product_name: p.product_name, niche: p.niche, description: p.description, keywords: p.keywords, let_ai_price: true }
    await env.DB.prepare(`
      INSERT INTO products (id, domain_id, category_id, name, niche, user_input, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?)
    `).bind(productId, domain.id, category.id, p.product_name ?? null, p.niche ?? null, JSON.stringify(userInput), now, now).run()
    await env.DB.prepare(`INSERT INTO workflow_runs (id, product_id, status, created_at) VALUES (?, ?, 'queued', ?)`).bind(runId, productId, now).run()
    const engine = new ProductWorkflow(env)
    ctx.waitUntil(engine.run(runId, productId, domain_slug, category_slug, userInput))
    return { tool: 'create_product', args: p, ok: true, product_id: productId, summary: `Dispatched product agent for "${label}" (${domain_slug}/${category_slug}). The 15-step team is building it now.` }
  } catch (err) {
    return { tool: 'create_product', args: p, ok: false, summary: `Failed to start "${label}": ${err instanceof Error ? err.message : 'error'}` }
  }
}

async function rerunWorkflow(env: Env, ctx: ExecutionContext, prod: any): Promise<AgentStep> {
  const full = await env.DB.prepare(`
    SELECT p.id, p.name, p.niche, p.user_input, d.slug AS domain_slug, c.slug AS category_slug
    FROM products p JOIN domains d ON p.domain_id = d.id JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).bind(prod.id).first<any>()
  if (!full) return { tool: 'run_workflow', args: { product: prod.id }, ok: false, summary: 'Product not found.' }
  const runId = crypto.randomUUID()
  const now = new Date().toISOString()
  let userInput: Record<string, unknown> = {}
  try { userInput = full.user_input ? JSON.parse(full.user_input) : {} } catch {}
  await env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?').bind('running', now, full.id).run()
  await env.DB.prepare(`INSERT INTO workflow_runs (id, product_id, status, created_at) VALUES (?, ?, 'queued', ?)`).bind(runId, full.id, now).run()
  const engine = new ProductWorkflow(env)
  ctx.waitUntil(engine.run(runId, full.id, full.domain_slug, full.category_slug, userInput))
  return { tool: 'run_workflow', args: { product: full.id }, ok: true, product_id: full.id, summary: `Re-running the 15-step team on "${full.name || 'Untitled'}".` }
}

async function publishProduct(env: Env, prod: any): Promise<AgentStep> {
  const variants = await env.DB.prepare(`
    SELECT pv.*, pl.url as platform_url, pl.slug as platform_slug, pl.name as platform_name
    FROM platform_variants pv JOIN platforms pl ON pv.platform_id = pl.id
    WHERE pv.product_id = ? AND pv.status != 'published'
  `).bind(prod.id).all<any>()
  const list = variants.results || []
  if (list.length === 0) {
    return { tool: 'publish_product', args: { product: prod.id }, ok: false, summary: `"${prod.name || 'Untitled'}" has no unpublished platform variants to publish.` }
  }
  const results: string[] = []
  let published = 0
  for (const variant of list) {
    try {
      const payload = await buildListingPayload(env, variant)
      const outcome = await publishToPlatform(payload, env)
      if (outcome.status === 'success') {
        const now = new Date().toISOString()
        const url = outcome.url || `${variant.platform_url || '#'}/${variant.id}`
        await env.DB.prepare(`UPDATE platform_variants SET status = 'published', published_at = ?, published_url = ? WHERE id = ?`).bind(now, url, variant.id).run()
        published++
        results.push(`${variant.platform_name}: published`)
      } else {
        results.push(`${variant.platform_name}: ${outcome.error || 'failed'}`)
      }
    } catch (err) {
      results.push(`${variant.platform_name}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }
  if (published === list.length) {
    await env.DB.prepare(`UPDATE products SET status = 'published', updated_at = ? WHERE id = ?`).bind(new Date().toISOString(), prod.id).run()
  }
  return { tool: 'publish_product', args: { product: prod.id }, ok: published > 0, summary: `Publish attempt for "${prod.name || 'Untitled'}": ${results.join('; ')}` }
}

agentRoutes.post('/agent', async (c) => {
  const body = await c.req.json<{ message?: string; history?: ChatMessage[] }>()
  const message = (body.message || '').trim()
  const history = Array.isArray(body.history) ? body.history.slice(-8) : []
  if (!message) return c.json({ error: 'message is required' }, 400)

  const cats = await getCatalog(c.env)
  const catalog = cats.map((r) => `${r.domain_slug}/${r.category_slug} (${r.domain_name} → ${r.category_name})`)
  const validSlugs = new Set(cats.map((r) => `${r.domain_slug}/${r.category_slug}`))

  const overview = await getOverview(c.env)
  const convo = history.map((m) => `${m.role === 'user' ? 'CEO' : 'You'}: ${m.content}`).join('\n')

  const steps: AgentStep[] = []
  const scratch: string[] = []
  const executed = new Set<string>()
  let reply = ''

  const systemPrompt = `You are the CEO Manager of NEXUS, an AI digital-product engine. You have FULL control and you talk to the owner like a capable chief of staff: warm, brief, action-oriented.

You operate by choosing TOOLS. Each turn, respond with ONLY a JSON object — either a tool call or a final reply.

TOOLS:
- {"tool":"list_products","args":{"status":"<optional: running|pending_review|approved|rejected|published>","query":"<optional name search>"}}
- {"tool":"create_products","args":{"products":[{"domain_slug":"","category_slug":"","product_name":"","niche":"","description":"one line","keywords":"comma,separated"}]}}  // up to 5, slugs MUST be from the catalog
- {"tool":"run_workflow","args":{"product":"<id, id-prefix, or name>"}}  // (re)build a product with the agent team
- {"tool":"approve_product","args":{"product":"<ref>"}}
- {"tool":"reject_product","args":{"product":"<ref>","reason":"<short>"}}
- {"tool":"delete_product","args":{"product":"<ref>"}}
- {"tool":"publish_product","args":{"product":"<ref>"}}
- {"tool":"key_status","args":{}}  // which provider API keys are configured
- {"tool":"browse_web","args":{"url":"https://...","instruction":"<what to find on the page>"}}  // open a real web page in a headless browser, read it, and screenshot it

When you have enough to answer, respond with: {"reply":"<your message to the owner>"}

RULES:
- Use the live snapshot below to answer simple questions directly with a {"reply"} — don't call a tool you don't need.
- Only use catalog slugs. If none fit the owner's request, say so in your reply and suggest creating a domain/category.
- Never invent product IDs; reference products by name or the 8-char id shown.
- Be decisive: if the owner clearly wants action, take it, then report what you did.

CATALOG (valid domain/category slugs):
${catalog.length ? catalog.join('\n') : '(none configured yet)'}

LIVE SNAPSHOT:
${overview}`

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const prompt = `${systemPrompt}

Conversation so far:
${convo || '(new conversation)'}

Actions you have already taken this turn:
${scratch.length ? scratch.join('\n') : '(none yet)'}

The owner just said:
"${message}"

Respond with ONLY one JSON object (a tool call or a final {"reply"}).`

      const out = await callAI(c.env, prompt)
      const parsed = jsonFromModel(out)
      if (!parsed) { reply = out.trim() || 'Done.'; break }
      if (typeof parsed.reply === 'string' && !parsed.tool) { reply = parsed.reply; break }

      const tool = String(parsed.tool || '')
      const args = (parsed.args && typeof parsed.args === 'object') ? parsed.args : {}

      // Never run the same tool+args twice — prevents duplicate creates/deletes
      // and stops the model from looping on a read it already has.
      const sig = `${tool}:${JSON.stringify(args)}`
      if (executed.has(sig)) {
        // The model is repeating a tool it already ran — it has nothing new to
        // do, so stop looping and synthesize the final answer below.
        break
      }
      executed.add(sig)

      if (tool === 'list_products') {
        const status = typeof args.status === 'string' ? args.status : null
        const query = typeof args.query === 'string' ? args.query : null
        let sql = 'SELECT id, name, status, ai_score FROM products'
        const where: string[] = []
        const binds: unknown[] = []
        if (status) { where.push('status = ?'); binds.push(status) }
        if (query) { where.push('name LIKE ?'); binds.push(`%${query}%`) }
        if (where.length) sql += ' WHERE ' + where.join(' AND ')
        sql += ' ORDER BY created_at DESC LIMIT 20'
        const rows = await c.env.DB.prepare(sql).bind(...binds).all<any>()
        const found = rows.results || []
        // Full detail (with ids) goes to the model's scratchpad; the action
        // card shown to the owner stays short and readable.
        const detail = found.map((r) => `"${r.name || 'Untitled'}" [${(r.id as string).slice(0, 8)}] ${r.status}${typeof r.ai_score === 'number' ? ` (${r.ai_score})` : ''}`).join('; ') || 'no matching products'
        const cardSummary = found.length
          ? `Found ${found.length} product${found.length > 1 ? 's' : ''}: ${found.slice(0, 5).map((r) => r.name || 'Untitled').join(', ')}${found.length > 5 ? `, +${found.length - 5} more` : ''}.`
          : 'No matching products.'
        steps.push({ tool, args, ok: true, summary: cardSummary })
        scratch.push(`list_products → ${detail}`)
        continue
      }

      if (tool === 'create_products') {
        const products = Array.isArray(args.products) ? args.products.slice(0, 5) : []
        if (products.length === 0) { scratch.push('create_products → no products specified'); steps.push({ tool, args, ok: false, summary: 'No products specified.' }); continue }
        for (const p of products) {
          const step = await createOneProduct(c.env, c.executionCtx, p, validSlugs)
          steps.push(step)
          scratch.push(`create_product → ${step.summary}`)
        }
        continue
      }

      if (tool === 'key_status') {
        const summary = await getKeyStatus(c.env)
        steps.push({ tool, args, ok: true, summary })
        scratch.push(`key_status → ${summary}`)
        continue
      }

      if (tool === 'browse_web') {
        const url = typeof args.url === 'string' ? args.url : ''
        const instruction = typeof args.instruction === 'string' ? args.instruction : ''
        if (!url) {
          steps.push({ tool, args, ok: false, summary: 'No URL given to browse.' })
          scratch.push('browse_web → no url')
          continue
        }
        const r = await browse(c.env, url)
        if (!r.ok) {
          steps.push({ tool, args, ok: false, summary: `Could not open ${url}: ${r.error}` })
          scratch.push(`browse_web → failed: ${r.error}`)
          continue
        }
        const screenshotUrl = r.screenshotKey ? `/api/assets/r2/${r.screenshotKey}` : undefined
        const snippet = (r.text || '').slice(0, 4000)
        steps.push({ tool, args, ok: true, summary: `Opened ${r.title || url} and captured a screenshot.`, screenshot_url: screenshotUrl })
        scratch.push(`browse_web ${url}${instruction ? ` (goal: ${instruction})` : ''} → title: "${r.title || ''}"; page text: ${snippet || '(empty)'}`)
        continue
      }

      // Tools that operate on a single existing product.
      if (['run_workflow', 'approve_product', 'reject_product', 'delete_product', 'publish_product'].includes(tool)) {
        const ref = typeof args.product === 'string' ? args.product : ''
        const prod = await resolveProduct(c.env, ref)
        if (!prod) {
          const summary = `No product matched "${ref}".`
          steps.push({ tool, args, ok: false, summary })
          scratch.push(`${tool} → ${summary}`)
          continue
        }
        let step: AgentStep
        if (tool === 'run_workflow') {
          step = await rerunWorkflow(c.env, c.executionCtx, prod)
        } else if (tool === 'approve_product') {
          const now = new Date().toISOString()
          await c.env.DB.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?').bind('approved', now, prod.id).run()
          step = { tool, args, ok: true, product_id: prod.id, summary: `Approved "${prod.name || 'Untitled'}".` }
        } else if (tool === 'reject_product') {
          const now = new Date().toISOString()
          const reason = typeof args.reason === 'string' ? args.reason : 'Rejected by CEO'
          await c.env.DB.prepare(`UPDATE products SET status = 'rejected', graveyard_at = ?, graveyard_reason = ?, updated_at = ? WHERE id = ?`).bind(now, reason, now, prod.id).run()
          step = { tool, args, ok: true, product_id: prod.id, summary: `Rejected "${prod.name || 'Untitled'}" → ${reason}.` }
        } else if (tool === 'delete_product') {
          const assets = await c.env.DB.prepare('SELECT r2_key FROM assets WHERE product_id = ?').bind(prod.id).all<any>()
          await Promise.allSettled([
            c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(prod.id).run(),
            ...(assets.results || []).map((a: any) => (a.r2_key ? c.env.ASSETS.delete(a.r2_key) : Promise.resolve())),
            c.env.CONFIG.delete(`product:${prod.id}`),
          ])
          step = { tool, args, ok: true, summary: `Deleted "${prod.name || 'Untitled'}" and its files.` }
        } else {
          step = await publishProduct(c.env, prod)
        }
        steps.push(step)
        scratch.push(`${tool} → ${step.summary}`)
        continue
      }

      // Unknown tool — stop and let the model summarize.
      scratch.push(`Unknown tool "${tool}". Wrap up with a reply.`)
    }
  } catch (err) {
    return c.json({
      reply: 'I hit a snag reaching the AI engine. Try again in a moment.',
      steps,
      error: err instanceof Error ? err.message : 'agent_error',
    })
  }

  // The model ran tools but never wrote a final {"reply"} — compose a proper,
  // formatted written answer from what it did so the owner never sees a bare
  // "Done." status line.
  if (!reply) {
    try {
      reply = await composeReply(c.env, { message, convo, overview, scratch })
    } catch {
      reply = ''
    }
  }
  if (!reply) {
    reply = steps.length
      ? `Done. ${steps.filter((s) => s.ok).length}/${steps.length} action(s) completed.`
      : 'Understood.'
  }

  // Collapse duplicate action cards (e.g. the model ran list_products a few
  // times) so the owner sees a clean, de-duped list of what happened.
  const seenCards = new Set<string>()
  const cleanSteps = steps.filter((s) => {
    const k = `${s.tool}:${s.summary}`
    if (seenCards.has(k)) return false
    seenCards.add(k)
    return true
  })
  return c.json({ reply, steps: cleanSteps })
})

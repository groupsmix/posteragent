import { Hono } from 'hono'
import type { Env } from '../env'
import { rateLimit } from '../middleware/rate-limit'
import { kvCache } from '../middleware/kv-cache'

export const opportunityRoutes = new Hono<{ Bindings: Env }>()

// ── Types ────────────────────────────────────────────────────

interface OpportunityRow {
  id: string
  trend_name: string
  target_buyer: string
  product_idea: string
  why_it_sells: string
  evidence: string
  competition_level: string
  urgency: string
  risk_level: string
  suggested_format: string
  difficulty: string
  confidence_score: number
  score_demand: number
  score_competition_gap: number
  score_buyer_urgency: number
  score_ease: number
  score_monetization: number
  score_timing: number
  score_safety: number
  total_score: number
  niche: string | null
  category: string | null
  source_signals: string
  status: string
  is_guess: number
  linked_job_id: string | null
  linked_product_id: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
}

interface CreateOpportunityInput {
  trend_name: string
  target_buyer: string
  product_idea: string
  why_it_sells: string
  evidence?: Array<{ source: string; url?: string; snippet?: string }>
  competition_level?: string
  urgency?: string
  risk_level?: string
  suggested_format: string
  difficulty?: string
  confidence_score?: number
  score_demand?: number
  score_competition_gap?: number
  score_buyer_urgency?: number
  score_ease?: number
  score_monetization?: number
  score_timing?: number
  score_safety?: number
  niche?: string
  category?: string
  source_signals?: string[]
  is_guess?: boolean
  expires_at?: string
}

// ── List opportunities ───────────────────────────────────────

opportunityRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const format = c.req.query('format')
  const minScore = c.req.query('min_score')
  const niche = c.req.query('niche')

  let query = 'SELECT * FROM opportunities WHERE 1=1'
  const params: unknown[] = []

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  if (format) {
    query += ' AND suggested_format = ?'
    params.push(format)
  }
  if (minScore) {
    query += ' AND total_score >= ?'
    params.push(parseInt(minScore, 10))
  }
  if (niche) {
    query += ' AND niche = ?'
    params.push(niche)
  }

  query += ' ORDER BY total_score DESC, created_at DESC'

  const result = await c.env.DB.prepare(query).bind(...params).all<OpportunityRow>()
  const opportunities = (result.results ?? []).map(formatOpportunity)
  return c.json({ opportunities })
})

// ── Get single opportunity ───────────────────────────────────

opportunityRoutes.get('/:id', async (c) => {
  const { id } = c.req.param()
  const row = await c.env.DB.prepare('SELECT * FROM opportunities WHERE id = ?')
    .bind(id).first<OpportunityRow>()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ opportunity: formatOpportunity(row) })
})

// ── Create opportunity ───────────────────────────────────────

opportunityRoutes.post('/', async (c) => {
  const body = await c.req.json<CreateOpportunityInput>()

  if (!body.trend_name || !body.target_buyer || !body.product_idea || !body.why_it_sells || !body.suggested_format) {
    return c.json({ error: 'Missing required fields: trend_name, target_buyer, product_idea, why_it_sells, suggested_format' }, 400)
  }

  const validFormats = ['freelance', 'digital_product', 'pod', 'content']
  if (!validFormats.includes(body.suggested_format)) {
    return c.json({ error: `Invalid format. Must be one of: ${validFormats.join(', ')}` }, 400)
  }

  const scoreRanges: [string, number, number][] = [
    ['score_demand', 0, 20],
    ['score_competition_gap', 0, 15],
    ['score_buyer_urgency', 0, 15],
    ['score_ease', 0, 15],
    ['score_monetization', 0, 15],
    ['score_timing', 0, 10],
    ['score_safety', 0, 10],
  ]
  for (const [field, min, max] of scoreRanges) {
    const val = body[field as keyof CreateOpportunityInput] as number | undefined
    if (val !== undefined && (val < min || val > max)) {
      return c.json({ error: `${field} must be between ${min} and ${max}` }, 400)
    }
  }

  const id = crypto.randomUUID().replace(/-/g, '')

  await c.env.DB.prepare(`
    INSERT INTO opportunities (
      id, trend_name, target_buyer, product_idea, why_it_sells,
      evidence, competition_level, urgency, risk_level, suggested_format,
      difficulty, confidence_score,
      score_demand, score_competition_gap, score_buyer_urgency,
      score_ease, score_monetization, score_timing, score_safety,
      niche, category, source_signals, is_guess, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.trend_name,
    body.target_buyer,
    body.product_idea,
    body.why_it_sells,
    JSON.stringify(body.evidence ?? []),
    body.competition_level ?? 'medium',
    body.urgency ?? 'medium',
    body.risk_level ?? 'low',
    body.suggested_format,
    body.difficulty ?? 'medium',
    body.confidence_score ?? 0,
    body.score_demand ?? 0,
    body.score_competition_gap ?? 0,
    body.score_buyer_urgency ?? 0,
    body.score_ease ?? 0,
    body.score_monetization ?? 0,
    body.score_timing ?? 0,
    body.score_safety ?? 0,
    body.niche ?? null,
    body.category ?? null,
    JSON.stringify(body.source_signals ?? []),
    body.is_guess ? 1 : 0,
    body.expires_at ?? null,
  ).run()

  return c.json({ ok: true, id })
})

// ── Update opportunity status ────────────────────────────────

opportunityRoutes.patch('/:id/status', async (c) => {
  const { id } = c.req.param()
  const { status } = await c.req.json<{ status: string }>()

  const validStatuses = ['new', 'watchlist', 'approved', 'in_progress', 'completed', 'dismissed']
  if (!validStatuses.includes(status)) {
    return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400)
  }

  await c.env.DB.prepare(
    "UPDATE opportunities SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, id).run()

  return c.json({ ok: true })
})

// ── Delete opportunity ───────────────────────────────────────

opportunityRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param()
  await c.env.DB.prepare('DELETE FROM opportunities WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── AI: Scan for opportunities ───────────────────────────────

opportunityRoutes.post('/scan', rateLimit(5), async (c) => {
  const { niche } = await c.req.json<{ niche?: string }>()

  const prompt = buildScanPrompt(niche)

  try {
    const aiResponse = await c.env.AI_WORKER.fetch(new Request('https://ai-worker/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    }))

    const aiResult = await aiResponse.json() as { text?: string; error?: string }

    if (!aiResult.text) {
      return c.json({ error: 'AI scan failed', details: aiResult.error ?? 'No response' }, 500)
    }

    const opportunities = parseOpportunities(aiResult.text)

    const inserted: string[] = []
    for (const opp of opportunities) {
      const oppId = crypto.randomUUID().replace(/-/g, '')
      await c.env.DB.prepare(`
        INSERT INTO opportunities (
          id, trend_name, target_buyer, product_idea, why_it_sells,
          evidence, competition_level, urgency, risk_level, suggested_format,
          difficulty, confidence_score,
          score_demand, score_competition_gap, score_buyer_urgency,
          score_ease, score_monetization, score_timing, score_safety,
          niche, source_signals, is_guess
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        oppId, opp.trend_name, opp.target_buyer, opp.product_idea, opp.why_it_sells,
        JSON.stringify(opp.evidence), opp.competition_level, opp.urgency, opp.risk_level,
        opp.suggested_format, opp.difficulty, opp.confidence_score,
        opp.score_demand, opp.score_competition_gap, opp.score_buyer_urgency,
        opp.score_ease, opp.score_monetization, opp.score_timing, opp.score_safety,
        niche ?? null, JSON.stringify(opp.source_signals), opp.is_guess ? 1 : 0,
      ).run()
      inserted.push(oppId)
    }

    return c.json({ ok: true, scanned: opportunities.length, inserted_ids: inserted })
  } catch (err) {
    return c.json({ error: 'AI scan failed', details: String(err) }, 500)
  }
})

// ── Niche Factory: generate full niche plan ──────────────────

opportunityRoutes.post('/niche-factory', rateLimit(5), async (c) => {
  const { niche } = await c.req.json<{ niche: string }>()
  if (!niche) return c.json({ error: 'niche is required' }, 400)

  const prompt = buildNicheFactoryPrompt(niche)

  try {
    const aiResponse = await c.env.AI_WORKER.fetch(new Request('https://ai-worker/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: 4000, temperature: 0.7 }),
    }))

    const aiResult = await aiResponse.json() as { text?: string; error?: string }
    if (!aiResult.text) {
      return c.json({ error: 'AI generation failed', details: aiResult.error ?? 'No response' }, 500)
    }

    return c.json({ ok: true, niche, plan: aiResult.text })
  } catch (err) {
    return c.json({ error: 'Niche factory failed', details: String(err) }, 500)
  }
})

// ── Dashboard summary ────────────────────────────────────────

opportunityRoutes.get('/summary', kvCache(60), async (c) => {
  const topOpps = await c.env.DB.prepare(
    'SELECT * FROM opportunities WHERE status IN (?, ?) AND total_score >= 70 ORDER BY total_score DESC LIMIT 5'
  ).bind('new', 'watchlist').all<OpportunityRow>()

  const counts = await c.env.DB.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      suggested_format,
      AVG(total_score) as avg_score
    FROM opportunities
    GROUP BY status, suggested_format
  `).all<{ status: string; count: number; suggested_format: string; avg_score: number }>()

  const total = await c.env.DB.prepare('SELECT COUNT(*) as total FROM opportunities').first<{ total: number }>()

  return c.json({
    top_opportunities: (topOpps.results ?? []).map(formatOpportunity),
    breakdown: counts.results ?? [],
    total: total?.total ?? 0,
  })
})

// ── Helpers ──────────────────────────────────────────────────

function formatOpportunity(row: OpportunityRow) {
  return {
    ...row,
    evidence: safeParseJson(row.evidence),
    source_signals: safeParseJson(row.source_signals),
    is_guess: row.is_guess === 1,
  }
}

function safeParseJson(str: string): unknown {
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

interface ParsedOpportunity {
  trend_name: string
  target_buyer: string
  product_idea: string
  why_it_sells: string
  evidence: Array<{ source: string; url?: string; snippet?: string }>
  competition_level: string
  urgency: string
  risk_level: string
  suggested_format: string
  difficulty: string
  confidence_score: number
  score_demand: number
  score_competition_gap: number
  score_buyer_urgency: number
  score_ease: number
  score_monetization: number
  score_timing: number
  score_safety: number
  source_signals: string[]
  is_guess: boolean
}

function parseOpportunities(text: string): ParsedOpportunity[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []
    return parsed.map((item: Record<string, unknown>) => ({
      trend_name: String(item.trend_name ?? ''),
      target_buyer: String(item.target_buyer ?? ''),
      product_idea: String(item.product_idea ?? ''),
      why_it_sells: String(item.why_it_sells ?? ''),
      evidence: Array.isArray(item.evidence) ? item.evidence as ParsedOpportunity['evidence'] : [],
      competition_level: String(item.competition_level ?? 'medium'),
      urgency: String(item.urgency ?? 'medium'),
      risk_level: String(item.risk_level ?? 'low'),
      suggested_format: String(item.suggested_format ?? 'digital_product'),
      difficulty: String(item.difficulty ?? 'medium'),
      confidence_score: Number(item.confidence_score ?? 0),
      score_demand: Math.min(20, Number(item.score_demand ?? 0)),
      score_competition_gap: Math.min(15, Number(item.score_competition_gap ?? 0)),
      score_buyer_urgency: Math.min(15, Number(item.score_buyer_urgency ?? 0)),
      score_ease: Math.min(15, Number(item.score_ease ?? 0)),
      score_monetization: Math.min(15, Number(item.score_monetization ?? 0)),
      score_timing: Math.min(10, Number(item.score_timing ?? 0)),
      score_safety: Math.min(10, Number(item.score_safety ?? 0)),
      source_signals: Array.isArray(item.source_signals) ? item.source_signals as string[] : [],
      is_guess: Boolean(item.is_guess),
    }))
  } catch {
    return []
  }
}

function buildScanPrompt(niche?: string): string {
  const nicheClause = niche ? `Focus specifically on the "${niche}" niche.` : 'Scan across all profitable niches.'
  return `You are a Trend Prediction AI for a solo freelancer/creator who sells freelance services, digital products, and print-on-demand items.

${nicheClause}

Analyze current market signals and return a JSON array of 5 opportunities. Each opportunity must have:

{
  "trend_name": "short trend name",
  "target_buyer": "who buys this",
  "product_idea": "specific product/service to create",
  "why_it_sells": "1-2 sentence explanation with evidence",
  "evidence": [{"source": "Google Trends/TikTok/etc", "snippet": "brief data point"}],
  "competition_level": "low|medium|high|saturated",
  "urgency": "low|medium|high|urgent",
  "risk_level": "low|medium|high",
  "suggested_format": "freelance|digital_product|pod|content",
  "difficulty": "easy|medium|hard",
  "confidence_score": 0-100,
  "score_demand": 0-20,
  "score_competition_gap": 0-15,
  "score_buyer_urgency": 0-15,
  "score_ease": 0-15,
  "score_monetization": 0-15,
  "score_timing": 0-10,
  "score_safety": 0-10,
  "source_signals": ["google_trends", "tiktok", "etsy", etc],
  "is_guess": false
}

CRITICAL RULES:
- Only recommend opportunities scoring 70+ total
- Separate REAL signals (backed by data) from AI guesses. Set is_guess=true for speculation
- Never recommend anything involving brand names, celebrities, sports teams, copyrighted content
- Prioritize ideas that are easy to create with AI assistance
- Consider seasonal timing and upcoming events/holidays
- Include specific evidence for each recommendation

Return ONLY a valid JSON array. No explanation text.`
}

function buildNicheFactoryPrompt(niche: string): string {
  return `You are the Niche Factory AI. Given the niche "${niche}", generate a complete money plan.

Return a JSON object with:
{
  "niche": "${niche}",
  "freelance_offers": [
    {"title": "...", "description": "...", "price_range": "$X-$Y", "difficulty": "easy|medium|hard"}
  ],
  "digital_products": [
    {"title": "...", "description": "...", "price": "$X", "format": "template|guide|worksheet|content_pack"}
  ],
  "pod_products": [
    {"title": "...", "product_type": "mug|shirt|sticker|poster", "slogan_ideas": ["..."]}
  ],
  "outreach_messages": [
    {"channel": "email|linkedin|dm", "subject": "...", "message": "..."}
  ],
  "pricing_strategy": "...",
  "difficulty_score": 0-100,
  "expected_monthly_profit": "$X-$Y",
  "best_starting_product": "...",
  "risks": ["..."]
}

For "${niche}", think about:
- What specific pain points do they have?
- What would they pay money for?
- What can AI help create quickly?
- What POD products would this audience buy as gifts or for themselves?
- What digital tools/templates would save them time?

Be specific, not generic. Real product ideas, real pricing, real outreach.
Return ONLY valid JSON.`
}

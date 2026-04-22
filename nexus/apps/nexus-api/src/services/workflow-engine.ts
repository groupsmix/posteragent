// ============================================================
// NEXUS ProductWorkflow — 15-step AI product creation pipeline
// ============================================================
//
// Runs asynchronously after /workflow/start via ctx.waitUntil().
// Each step is persisted to `workflow_steps` before + after execution so the
// UI can poll `/api/workflow/:id` and watch progress live.
//
// Every AI call goes through the nexus-ai service binding, which wraps the
// 25+ model failover engine. Each step gets its own TaskType so the registry
// picks the best provider for the job.

import type { Env } from '../env'
import type { TaskType, AIRunTaskResponse } from '@nexus/types'

interface StepDef {
  name: string
  taskType: TaskType
  outputFormat: 'text' | 'json'
  buildPrompt: (ctx: WorkflowContext) => string
  apply: (ctx: WorkflowContext, raw: string) => void
}

interface WorkflowContext {
  runId: string
  productId: string
  domainSlug: string
  categorySlug: string
  userInput: Record<string, unknown>
  // Accumulated outputs from earlier steps — later steps can reference them.
  data: Record<string, any>
}

// ------------------------------------------------------------
// The 15 canonical steps (NEXUS-ARCHITECTURE-V4 §9)
// ------------------------------------------------------------

const STEPS: StepDef[] = [
  {
    name: 'research_market',
    taskType: 'research_market',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `You are a market researcher. Return JSON with fields {demand_signal, top_competitors:[{name,price}], price_range:{low,high,avg}, hooks:[string]}. Domain: ${ctx.domainSlug}. Category: ${ctx.categorySlug}. Niche: ${ctx.userInput.niche ?? 'general'}. Seed keywords: ${ctx.userInput.keywords ?? ''}.`,
    apply: (ctx, raw) => {
      ctx.data.market = safeJson(raw)
    },
  },
  {
    name: 'research_psychology',
    taskType: 'research_psychology',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Analyze the buyer psychology for a ${ctx.domainSlug}/${ctx.categorySlug} product in the niche "${ctx.userInput.niche ?? 'general'}". Return JSON {pains:[string], desires:[string], emotional_triggers:[string], voice:{tone,style}}.`,
    apply: (ctx, raw) => {
      ctx.data.psychology = safeJson(raw)
    },
  },
  {
    name: 'research_keywords',
    taskType: 'research_keywords',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Return JSON {primary:[string], long_tail:[string], question_keywords:[string]} for ${ctx.domainSlug}/${ctx.categorySlug}. Seed: ${ctx.userInput.keywords ?? '—'}.`,
    apply: (ctx, raw) => {
      ctx.data.keywords = safeJson(raw)
    },
  },
  {
    name: 'generate_content',
    taskType: 'generate_long_form',
    outputFormat: 'text',
    buildPrompt: (ctx) =>
      `Write the main product content (800-1400 words) for a ${ctx.domainSlug} ${ctx.categorySlug}. Tone: ${ctx.data.psychology?.voice?.tone ?? 'confident, helpful'}. Address the pains ${JSON.stringify(ctx.data.psychology?.pains ?? [])}. Include the long-tail keywords ${JSON.stringify(ctx.data.keywords?.long_tail ?? []).slice(0, 400)}. Language: ${ctx.userInput.language ?? 'en'}.`,
    apply: (ctx, raw) => {
      ctx.data.content = raw
    },
  },
  {
    name: 'generate_assets',
    taskType: 'generate_image_prompt',
    outputFormat: 'text',
    buildPrompt: (ctx) =>
      `Write ONE image generation prompt (≤80 words) for a ${ctx.domainSlug} ${ctx.categorySlug} product. Mood derived from: ${JSON.stringify(ctx.data.psychology?.emotional_triggers ?? []).slice(0, 200)}. Output the prompt only, no preamble.`,
    apply: (ctx, raw) => {
      ctx.data.image_prompt = raw.trim()
    },
  },
  {
    name: 'generate_seo',
    taskType: 'generate_seo_tags',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Return JSON {meta_title, meta_description, tags:[string] (13 items)} for product. Primary keywords: ${JSON.stringify(ctx.data.keywords?.primary ?? []).slice(0, 200)}. Content excerpt: "${String(ctx.data.content ?? '').slice(0, 400)}".`,
    apply: (ctx, raw) => {
      const j = safeJson(raw)
      ctx.data.seo = j
      ctx.data.tags = Array.isArray(j?.tags) ? j.tags : []
    },
  },
  {
    name: 'generate_title_variants',
    taskType: 'generate_short_copy',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Return JSON {titles:[string] (exactly 3 items, 60-80 chars each)} for a ${ctx.domainSlug} ${ctx.categorySlug} product using keywords ${JSON.stringify(ctx.data.keywords?.primary ?? []).slice(0, 160)}.`,
    apply: (ctx, raw) => {
      const j = safeJson(raw)
      ctx.data.title_variants = Array.isArray(j?.titles) ? j.titles : []
    },
  },
  {
    name: 'quality_editor',
    taskType: 'quality_editor',
    outputFormat: 'text',
    buildPrompt: (ctx) =>
      `Edit the following product copy for tone, flow, and grammar. Return the polished copy only. Copy:\n\n${String(ctx.data.content ?? '').slice(0, 4000)}`,
    apply: (ctx, raw) => {
      ctx.data.content = raw
    },
  },
  {
    name: 'quality_buyer_sim',
    taskType: 'quality_buyer_sim',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `You are the target buyer (pains: ${JSON.stringify(ctx.data.psychology?.pains ?? []).slice(0, 200)}). Return JSON {would_buy:boolean, objections:[string], score:number (0-10)} for the product "${ctx.data.title_variants?.[0] ?? ''}" with copy: "${String(ctx.data.content ?? '').slice(0, 600)}".`,
    apply: (ctx, raw) => {
      ctx.data.buyer_sim = safeJson(raw)
    },
  },
  {
    name: 'quality_competitor',
    taskType: 'quality_competitor',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Compare our product against competitors ${JSON.stringify(ctx.data.market?.top_competitors ?? []).slice(0, 300)}. Return JSON {gap_detected:boolean, summary:string, score:number (0-10)}.`,
    apply: (ctx, raw) => {
      ctx.data.competitor = safeJson(raw)
    },
  },
  {
    name: 'humanize',
    taskType: 'humanize',
    outputFormat: 'text',
    buildPrompt: (ctx) =>
      `Rewrite this copy to sound more human and less AI-generated. Keep substance and keywords. Return copy only.\n\n${String(ctx.data.content ?? '').slice(0, 4000)}`,
    apply: (ctx, raw) => {
      ctx.data.content = raw
    },
  },
  {
    name: 'revenue_estimate',
    taskType: 'revenue_estimate',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Return JSON {min:number, max:number, currency:string, confidence:"low"|"medium"|"high", reasoning:string} estimating 90-day revenue for a ${ctx.domainSlug} ${ctx.categorySlug} with market ${JSON.stringify(ctx.data.market?.price_range ?? {}).slice(0, 160)}.`,
    apply: (ctx, raw) => {
      ctx.data.revenue = safeJson(raw)
    },
  },
  {
    name: 'generate_platform_variants',
    taskType: 'platform_variation',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Return JSON {variants:[{platform_slug:string, title:string, description:string, tags:[string], price:number}]} for each of these platform slugs: ${JSON.stringify(ctx.userInput.selected_platform_ids ?? []).slice(0, 200)}. Base copy: "${String(ctx.data.content ?? '').slice(0, 600)}".`,
    apply: (ctx, raw) => {
      const j = safeJson(raw)
      ctx.data.platform_variants = Array.isArray(j?.variants) ? j.variants : []
    },
  },
  {
    name: 'generate_social_content',
    taskType: 'social_adaptation',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Return JSON {variants:[{channel_slug:string, caption:string, hashtags:[string], hook:string}]} for channels ${JSON.stringify(ctx.userInput.selected_social_channel_ids ?? []).slice(0, 200)} from base copy "${String(ctx.data.content ?? '').slice(0, 400)}".`,
    apply: (ctx, raw) => {
      const j = safeJson(raw)
      ctx.data.social_variants = Array.isArray(j?.variants) ? j.variants : []
    },
  },
  {
    name: 'quality_ceo',
    taskType: 'quality_ceo',
    outputFormat: 'json',
    buildPrompt: (ctx) =>
      `Final CEO review. Return JSON {overall_score:number (0-10), approved:boolean, scores:{title,description,seo,price,platform_fit,human_quality,competitive_position}, issues:[{section,problem,fix}], competitor_gap:string|null, strongest_element:string}. Product: title "${ctx.data.title_variants?.[0] ?? ''}", copy "${String(ctx.data.content ?? '').slice(0, 400)}", competitor ${JSON.stringify(ctx.data.competitor ?? {}).slice(0, 200)}.`,
    apply: (ctx, raw) => {
      ctx.data.ceo = safeJson(raw)
    },
  },
]

// ------------------------------------------------------------
// Engine
// ------------------------------------------------------------

export class ProductWorkflow {
  constructor(private env: Env) {}

  /**
   * Run the full 15-step pipeline. Errors in an individual step don't abort
   * the run — we mark the step failed, use a fallback, and continue, so the
   * user still gets a (partial) product to review.
   */
  async run(
    runId: string,
    productId: string,
    domainSlug: string,
    categorySlug: string,
    userInput: Record<string, unknown>,
  ): Promise<void> {
    const now = () => new Date().toISOString()
    const ctx: WorkflowContext = {
      runId,
      productId,
      domainSlug,
      categorySlug,
      userInput,
      data: {},
    }

    try {
      // Mark run running
      await this.env.DB.prepare(
        `UPDATE workflow_runs SET status = 'running', started_at = ?, total_steps = ? WHERE id = ?`
      ).bind(now(), STEPS.length, runId).run()

      for (let i = 0; i < STEPS.length; i++) {
        const step = STEPS[i]
        const stepId = crypto.randomUUID()

        // Insert + start
        await this.env.DB.prepare(
          `INSERT INTO workflow_steps (id, run_id, step_name, step_type, step_order, status, started_at)
           VALUES (?, ?, ?, ?, ?, 'running', ?)`
        ).bind(stepId, runId, step.name, step.taskType, i, now()).run()

        await this.env.DB.prepare(
          `UPDATE workflow_runs SET current_step = ? WHERE id = ?`
        ).bind(step.name, runId).run()

        try {
          const prompt = step.buildPrompt(ctx)
          const result = await this.callAI(step.taskType, prompt, step.outputFormat)
          step.apply(ctx, result.output)

          await this.env.DB.prepare(
            `UPDATE workflow_steps
               SET status='completed', completed_at=?, ai_model_used=?, ai_models_tried=?,
                   tokens_used=?, cost_usd=?, output_data=?
             WHERE id=?`
          ).bind(
            now(),
            result.model_used,
            JSON.stringify(result.models_tried),
            result.tokens_used ?? 0,
            result.cost_usd ?? 0,
            JSON.stringify({ preview: String(result.output).slice(0, 500) }),
            stepId,
          ).run()
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`[workflow:${runId}] step ${step.name} failed:`, message)
          await this.env.DB.prepare(
            `UPDATE workflow_steps SET status='failed', completed_at=?, error=? WHERE id=?`
          ).bind(now(), message, stepId).run()
          // keep going with whatever ctx.data we already have
        }
      }

      await this.persistResults(ctx)

      await this.env.DB.prepare(
        `UPDATE workflow_runs SET status='completed', completed_at=?, current_step=NULL WHERE id=?`
      ).bind(now(), runId).run()

      // Gate on CEO review toggle
      const settings = await this.env.DB.prepare(
        `SELECT ceo_review_required FROM settings LIMIT 1`
      ).first<{ ceo_review_required: number | null }>().catch(() => null)

      const nextStatus = settings?.ceo_review_required === 0 ? 'approved' : 'pending_review'

      await this.env.DB.prepare(
        `UPDATE products SET status=?, ai_score=?, updated_at=? WHERE id=?`
      ).bind(
        nextStatus,
        Number(ctx.data.ceo?.overall_score ?? 0) || 0,
        now(),
        productId,
      ).run()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[workflow:${runId}] FATAL:`, message)
      await this.env.DB.prepare(
        `UPDATE workflow_runs SET status='failed', completed_at=?, error=? WHERE id=?`
      ).bind(now(), message, runId).run()
      await this.env.DB.prepare(
        `UPDATE products SET status='rejected', updated_at=? WHERE id=?`
      ).bind(now(), productId).run()
    }
  }

  private async callAI(
    taskType: TaskType,
    prompt: string,
    outputFormat: 'text' | 'json',
  ): Promise<AIRunTaskResponse> {
    const req = new Request('https://nexus-ai/task', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskType, prompt, outputFormat, timeoutMs: 90000 }),
    })
    const res = await this.env.AI_WORKER.fetch(req)
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`AI worker ${taskType} failed: ${res.status} ${text}`)
    }
    return (await res.json()) as AIRunTaskResponse
  }

  // Persist AI outputs into the right tables so the review screen + listings
  // can render them.
  private async persistResults(ctx: WorkflowContext): Promise<void> {
    const now = new Date().toISOString()
    const productId = ctx.productId

    const title =
      (Array.isArray(ctx.data.title_variants) && ctx.data.title_variants[0]) ||
      ctx.data.seo?.meta_title ||
      null

    await this.env.DB.prepare(
      `UPDATE products SET name = COALESCE(?, name), revenue_estimate = ?, updated_at = ? WHERE id = ?`
    ).bind(
      title,
      ctx.data.revenue ? JSON.stringify(ctx.data.revenue) : null,
      now,
      productId,
    ).run()

    // Title variants
    if (Array.isArray(ctx.data.title_variants) && ctx.data.title_variants.length >= 1) {
      await this.env.DB.prepare(
        `INSERT INTO title_variants (id, product_id, variant_a, variant_b, variant_c, selected, created_at)
         VALUES (?, ?, ?, ?, ?, 'a', ?)`
      ).bind(
        crypto.randomUUID(),
        productId,
        ctx.data.title_variants[0] ?? null,
        ctx.data.title_variants[1] ?? null,
        ctx.data.title_variants[2] ?? null,
        now,
      ).run().catch(() => void 0)
    }

    // Platform variants — match platform slugs → platform IDs.
    if (Array.isArray(ctx.data.platform_variants)) {
      for (const v of ctx.data.platform_variants) {
        if (!v?.platform_slug) continue
        const platform = await this.env.DB.prepare(
          `SELECT id FROM platforms WHERE slug = ? LIMIT 1`
        ).bind(v.platform_slug).first<{ id: string }>()
        if (!platform) continue
        await this.env.DB.prepare(
          `INSERT INTO platform_variants
             (id, product_id, platform_id, title, description, tags, price, currency, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', 'draft', ?, ?)`
        ).bind(
          crypto.randomUUID(),
          productId,
          platform.id,
          v.title ?? null,
          v.description ?? null,
          Array.isArray(v.tags) ? v.tags.join(',') : null,
          typeof v.price === 'number' ? v.price : null,
          now,
          now,
        ).run().catch(() => void 0)
      }
    }

    // Social variants
    if (Array.isArray(ctx.data.social_variants)) {
      for (const v of ctx.data.social_variants) {
        if (!v?.channel_slug) continue
        const chan = await this.env.DB.prepare(
          `SELECT id FROM social_channels WHERE slug = ? LIMIT 1`
        ).bind(v.channel_slug).first<{ id: string }>()
        if (!chan) continue
        await this.env.DB.prepare(
          `INSERT INTO social_variants
             (id, product_id, channel_id, content, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'draft', ?, ?)`
        ).bind(
          crypto.randomUUID(),
          productId,
          chan.id,
          JSON.stringify({
            caption: v.caption ?? '',
            hashtags: Array.isArray(v.hashtags) ? v.hashtags : [],
            hook: v.hook ?? null,
          }),
          now,
          now,
        ).run().catch(() => void 0)
      }
    }

    // CEO review row
    if (ctx.data.ceo) {
      await this.env.DB.prepare(
        `INSERT INTO reviews (id, product_id, run_id, version, ai_score, section_scores, reviewed_at)
         VALUES (?, ?, ?, 1, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        productId,
        ctx.runId,
        Number(ctx.data.ceo?.overall_score ?? 0) || 0,
        JSON.stringify(ctx.data.ceo?.scores ?? {}),
        now,
      ).run().catch(() => void 0)
    }
  }
}

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

function safeJson(raw: unknown): any {
  if (typeof raw !== 'string') return raw
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    // Model sometimes wraps JSON in ```json ... ``` fences; strip and retry.
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenced) {
      try {
        return JSON.parse(fenced[1])
      } catch {
        /* fall through */
      }
    }
    return null
  }
}

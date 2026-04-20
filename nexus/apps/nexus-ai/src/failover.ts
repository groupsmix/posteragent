// ============================================================
// AI Failover Engine
// ============================================================
// Core failover logic with automatic model switching on failure.

import { AI_REGISTRY } from './registry'
import type { AIRegistryEntry, TaskType, FailoverResult, FailoverOptions, AIStatusCache } from './types'

interface Env {
  CONFIG: KVNamespace
  SECRETS: {
    get(key: string): Promise<string | null>
  }
}

/**
 * Run an AI task with automatic failover to next model on failure.
 * Checks rate limits, API keys, and handles errors gracefully.
 */
export async function runWithFailover(
  taskType: TaskType,
  prompt: string,
  env: Env,
  options: FailoverOptions = {}
): Promise<FailoverResult> {
  const { timeoutMs = 90000, outputFormat = 'text' } = options

  const models = AI_REGISTRY[taskType]
  if (!models || models.length === 0) {
    throw new Error(`No models registered for task type: ${taskType}`)
  }

  const tried: string[] = []

  for (const model of models) {
    // 1. Check if API key exists
    const apiKey = model.secretKey
      ? await getSecret(env, model.secretKey)
      : 'local'

    if (!apiKey) {
      console.log(`[NEXUS-AI] SKIP ${model.name} — no API key configured`)
      continue
    }

    // 2. Check rate limit status from KV
    const statusKey = `ai_status:${model.id}`
    const statusRaw = await env.CONFIG.get(statusKey, 'json')
    
    if (statusRaw) {
      const status = statusRaw as AIStatusCache
      if (Date.now() < status.reset_at) {
        const waitMin = Math.ceil((status.reset_at - Date.now()) / 60000)
        console.log(`[NEXUS-AI] SLEEP ${model.name} — rate limited (${waitMin}min remaining)`)
        continue
      }
    }

    tried.push(model.id)
    console.log(`[NEXUS-AI] TRY ${model.name} for task: ${taskType}`)

    try {
      const result = await callModelWithTimeout(
        model,
        apiKey,
        prompt,
        timeoutMs,
        outputFormat,
        env
      )

      console.log(`[NEXUS-AI] SUCCESS ${model.name} — ${result.tokens_used} tokens`)

      // Clear any previous rate limit status on success
      if (statusRaw) {
        await env.CONFIG.delete(statusKey)
      }

      return {
        output: result.output,
        model_used: model.id,
        models_tried: tried,
        tokens_used: result.tokens_used,
        cost_usd: result.cost_usd,
      }
    } catch (error: any) {
      const statusCode = error.status || error.statusCode || 0
      const errorMsg = error.message || 'Unknown error'

      if (statusCode === 429 || errorMsg.includes('rate_limit')) {
        // Rate limit — sleep for 1 hour
        const resetAt = Date.now() + 3_600_000
        await env.CONFIG.put(statusKey, JSON.stringify({
          type: 'rate_limited',
          reset_at: resetAt,
          hit_at: Date.now(),
        }), { expirationTtl: 3700 })
        console.log(`[NEXUS-AI] RATE_LIMIT ${model.name} — sleeping 1hr`)

      } else if (statusCode === 402 || errorMsg.includes('quota') || errorMsg.includes('insufficient_quota')) {
        // Daily quota — sleep until midnight UTC
        const midnight = new Date()
        midnight.setUTCHours(24, 0, 0, 0)
        const resetAt = midnight.getTime()
        await env.CONFIG.put(statusKey, JSON.stringify({
          type: 'quota_exceeded',
          reset_at: resetAt,
          hit_at: Date.now(),
        }), { expirationTtl: Math.ceil((resetAt - Date.now()) / 1000) + 60 })
        console.log(`[NEXUS-AI] QUOTA_EXCEEDED ${model.name} — sleeping until midnight`)

      } else if (statusCode === 401 || statusCode === 403) {
        // Invalid key — skip permanently until key changes
        await env.CONFIG.put(statusKey, JSON.stringify({
          type: 'invalid_key',
          reset_at: Date.now() + 86_400_000,
          hit_at: Date.now(),
        }), { expirationTtl: 86460 })
        console.log(`[NEXUS-AI] INVALID_KEY ${model.name}`)

      } else {
        console.log(`[NEXUS-AI] ERROR ${model.name}: ${statusCode} — ${errorMsg}`)
      }

      continue
    }
  }

  throw new Error(
    `All AI models failed for task "${taskType}". Tried: ${tried.join(', ')}`
  )
}

// ============================================================
// Model Callers
// ============================================================

async function callModelWithTimeout(
  model: AIRegistryEntry,
  apiKey: string,
  prompt: string,
  timeoutMs: number,
  outputFormat: string,
  env: Env
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    let result: { output: string; tokens_used: number; cost_usd: number }

    switch (model.provider) {
      case 'deepseek':
        result = await callOpenAICompatible(
          'https://api.deepseek.com/v1',
          apiKey,
          model,
          prompt,
          outputFormat,
          controller.signal
        )
        break

      case 'siliconflow':
        result = await callOpenAICompatible(
          'https://api.siliconflow.cn/v1',
          apiKey,
          model,
          prompt,
          outputFormat,
          controller.signal
        )
        break

      case 'groq':
        result = await callOpenAICompatible(
          'https://api.groq.com/openai/v1',
          apiKey,
          model,
          prompt,
          outputFormat,
          controller.signal
        )
        break

      case 'fireworks':
        result = await callOpenAICompatible(
          'https://api.fireworks.ai/inference/v1',
          apiKey,
          model,
          prompt,
          outputFormat,
          controller.signal
        )
        break

      case 'moonshot':
        result = await callOpenAICompatible(
          'https://api.moonshot.cn/v1',
          apiKey,
          model,
          prompt,
          outputFormat,
          controller.signal
        )
        break

      case 'anthropic':
        result = await callAnthropic(apiKey, model, prompt, controller.signal)
        break

      case 'openai':
        result = await callOpenAICompatible(
          'https://api.openai.com/v1',
          apiKey,
          model,
          prompt,
          outputFormat,
          controller.signal
        )
        break

      case 'google':
        result = await callGemini(apiKey, model, prompt, controller.signal)
        break

      case 'fal':
        result = await callFal(apiKey, model, prompt, controller.signal)
        break

      case 'huggingface':
        result = await callHuggingFace(apiKey, model, prompt, controller.signal)
        break

      case 'tavily':
        result = await callTavily(apiKey, prompt, controller.signal)
        break

      case 'exa':
        result = await callExa(apiKey, prompt, controller.signal)
        break

      case 'serpapi':
        result = await callSerpAPI(apiKey, prompt, controller.signal)
        break

      default:
        throw new Error(`Unknown provider: ${model.provider}`)
    }

    return result
  } finally {
    clearTimeout(timeout)
  }
}

// ============================================================
// OpenAI-Compatible API Caller
// ============================================================

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: AIRegistryEntry,
  prompt: string,
  outputFormat: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const body: Record<string, unknown> = {
    model: model.apiModelName,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    temperature: 0.7,
  }

  if (outputFormat === 'json') {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
    const error: any = new Error(err?.error?.message || response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json() as any
  const tokensUsed = data.usage?.total_tokens || 0
  const costUsd = (tokensUsed / 1_000_000) * (model.costPer1MTokens || 0)

  return {
    output: data.choices[0].message.content,
    tokens_used: tokensUsed,
    cost_usd: costUsd,
  }
}

// ============================================================
// Anthropic Caller
// ============================================================

async function callAnthropic(
  apiKey: string,
  model: AIRegistryEntry,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model.apiModelName,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
    const error: any = new Error(err?.error?.message || response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0
  const costUsd = (tokensUsed / 1_000_000) * 15 // Claude Opus rate

  return {
    output: data.content[0].text,
    tokens_used: tokensUsed,
    cost_usd: costUsd,
  }
}

// ============================================================
// Gemini Caller
// ============================================================

async function callGemini(
  apiKey: string,
  model: AIRegistryEntry,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model.apiModelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
      }),
      signal,
    }
  )

  if (!response.ok) {
    const error: any = new Error(response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json()
  return {
    output: data.candidates[0].content.parts[0].text,
    tokens_used: 0,
    cost_usd: 0,
  }
}

// ============================================================
// Fal.ai (FLUX) Caller
// ============================================================

async function callFal(
  apiKey: string,
  model: AIRegistryEntry,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  // For image generation, prompt is sent differently
  if (model.id.includes('flux')) {
    const response = await fetch('https://queue.fal.run/fal-ai/flux-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: { width: 1024, height: 1024 },
      }),
      signal,
    })

    if (!response.ok) {
      const error: any = new Error(response.statusText)
      error.status = response.status
      throw error
    }

    const data = await response.json()
    return {
      output: data.images[0].url,
      tokens_used: 0,
      cost_usd: 0,
    }
  }

  throw new Error(`Unhandled fal.ai model: ${model.id}`)
}

// ============================================================
// HuggingFace Caller
// ============================================================

async function callHuggingFace(
  apiKey: string,
  model: AIRegistryEntry,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model.apiModelName}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
      signal,
    }
  )

  if (!response.ok) {
    const error: any = new Error(response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const output = Array.isArray(data) ? data[0].generated_text : data

  return {
    output: typeof output === 'string' ? output : JSON.stringify(output),
    tokens_used: 0,
    cost_usd: 0,
  }
}

// ============================================================
// Tavily Search Caller
// ============================================================

async function callTavily(
  apiKey: string,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: prompt,
      search_depth: 'advanced',
      max_results: 10,
      include_answer: true,
      include_raw_content: false,
    }),
    signal,
  })

  if (!response.ok) {
    const error: any = new Error(response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json()

  return {
    output: JSON.stringify({
      answer: data.answer,
      results: data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    }),
    tokens_used: 0,
    cost_usd: 0,
  }
}

// ============================================================
// Exa Search Caller
// ============================================================

async function callExa(
  apiKey: string,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: prompt,
      numResults: 10,
      contents: { text: true },
    }),
    signal,
  })

  if (!response.ok) {
    const error: any = new Error(response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json()

  return {
    output: JSON.stringify({
      results: data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.text,
      })),
    }),
    tokens_used: 0,
    cost_usd: 0,
  }
}

// ============================================================
// SerpAPI Caller
// ============================================================

async function callSerpAPI(
  apiKey: string,
  prompt: string,
  signal: AbortSignal
): Promise<{ output: string; tokens_used: number; cost_usd: number }> {
  const params = new URLSearchParams({
    q: prompt,
    api_key: apiKey,
    engine: 'google',
  })

  const response = await fetch(`https://serpapi.com/search?${params.toString()}`, {
    signal,
  })

  if (!response.ok) {
    const error: any = new Error(response.statusText)
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const results = data.organic_results?.slice(0, 10) || []

  return {
    output: JSON.stringify({
      results: results.map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      })),
    }),
    tokens_used: 0,
    cost_usd: 0.05, // SerpAPI cost per search
  }
}

// ============================================================
// Helper Functions
// ============================================================

async function getSecret(env: Env, key: string): Promise<string | null> {
  if (!env.SECRETS) return null
  try {
    return await env.SECRETS.get(key)
  } catch {
    return null
  }
}

// Cost per 1M tokens lookup
const COST_PER_1M: Record<string, number> = {
  'deepseek-chat': 0.27,
  'deepseek-reasoner': 0.55,
  'Qwen/Qwen2.5-72B-Instruct': 0.20,
  'Qwen/Qwen2.5-7B-Instruct': 0.05,
}

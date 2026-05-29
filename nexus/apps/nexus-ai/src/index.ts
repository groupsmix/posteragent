// ============================================================
// NEXUS-AI Worker Entry Point
// ============================================================
// AI Failover Engine - Handles all AI calls with automatic failover.

import { Hono } from 'hono'
import { runWithFailover } from './failover'
import { generateImage } from './image'
import type { TaskType, AIRunTaskRequest, AIRunTaskResponse } from './types'

interface Env {
  CONFIG: KVNamespace
  AI?: { run(model: string, inputs: Record<string, unknown>): Promise<unknown> }
  SECRETS?: {
    get: (key: string) => Promise<string | null>
  }
  [key: string]: unknown
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================
// Main AI Task Endpoint
// ============================================================

app.post('/task', async (c) => {
  const body = await c.req.json<AIRunTaskRequest>()
  const { taskType, prompt, outputFormat = 'text', timeoutMs = 90000 } = body

  if (!taskType || !prompt) {
    return c.json({ error: 'taskType and prompt are required' }, 400)
  }

  try {
    const result = await runWithFailover(
      taskType as TaskType,
      prompt,
      c.env,
      { outputFormat, timeoutMs }
    )

    const response: AIRunTaskResponse = {
      output: result.output,
      model_used: result.model_used,
      models_tried: result.models_tried,
      tokens_used: result.tokens_used,
      cost_usd: result.cost_usd || 0,
    }

    return c.json(response)
  } catch (error) {
    console.error(`[NEXUS-AI] All models failed for task: ${taskType}`, error)
    return c.json(
      {
        error: 'All AI models failed',
        taskType,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// ============================================================
// Image Generation Endpoint
// ============================================================
// Returns a real generated image as base64 (or 204 when no image provider is
// configured, so the workflow can continue without one).

app.post('/image', async (c) => {
  const { prompt } = await c.req.json<{ prompt?: string }>()
  if (!prompt) return c.json({ error: 'prompt is required' }, 400)

  try {
    const image = await generateImage(prompt, c.env)
    if (!image) return c.body(null, 204)
    return c.json(image)
  } catch (error) {
    console.error('[NEXUS-AI] image generation failed', error)
    return c.json({ error: error instanceof Error ? error.message : 'image failed' }, 500)
  }
})

// ============================================================
// Health Check
// ============================================================

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'nexus-ai', timestamp: new Date().toISOString() })
})

// ============================================================
// Model Status Endpoint
// ============================================================

app.get('/models/:id/status', async (c) => {
  const modelId = c.req.param('id')
  const statusKey = `ai_status:${modelId}`

  const status = await c.env.CONFIG.get(statusKey, 'json')

  return c.json({
    model_id: modelId,
    status: status || 'active',
  })
})

// ============================================================
// Export Handler
// ============================================================

export default {
  fetch: app.fetch,
}

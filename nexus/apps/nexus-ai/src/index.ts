// ============================================================
// NEXUS-AI Worker Entry Point
// ============================================================
// AI Failover Engine - Handles all AI calls with automatic failover.

import { Hono } from 'hono'
import { runWithFailover } from './failover'
import type { TaskType, AIRunTaskRequest, AIRunTaskResponse } from './types'

interface Env {
  CONFIG: KVNamespace
  SECRETS: {
    get: (key: string) => Promise<string | null>
  }
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

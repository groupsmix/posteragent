import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { NexusApiEnv } from '@nexus/types/env'

const app = new Hono<{ Bindings: NexusApiEnv }>()

app.use('*', cors({ origin: (origin) => origin || '*' }))

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Placeholder routes — each will be implemented as a separate route module
app.get('/api/workflow', (c) => c.json({ message: 'Workflow routes — coming soon' }))
app.get('/api/products', (c) => c.json({ message: 'Product routes — coming soon' }))
app.get('/api/domains', (c) => c.json({ message: 'Domain routes — coming soon' }))
app.get('/api/platforms', (c) => c.json({ message: 'Platform routes — coming soon' }))
app.get('/api/settings', (c) => c.json({ message: 'Settings routes — coming soon' }))

export default {
  fetch: app.fetch,
}

// Stub Workflow class — full implementation will follow in a future PR.
// Exported here so wrangler can bind it as the ProductWorkflow class.
export class ProductWorkflow {
  async run() {
    return { status: 'not_implemented' }
  }
}

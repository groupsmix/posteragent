import type { D1Database, KVNamespace, R2Bucket, Ai, Fetcher } from '@cloudflare/workers-types'

// Environment bindings for Cloudflare Workers
export interface Env {
  // Main binding - D1 SQLite database
  DB: D1Database

  // KV namespace for config cache and rate limiting
  CONFIG: KVNamespace

  // R2 bucket for asset storage
  ASSETS: R2Bucket

  // Cloudflare Images / Workers AI binding
  IMAGES: Ai

  // Service binding to AI worker
  AI_WORKER: Fetcher

  // Cloudflare Workflows binding
  PRODUCT_WORKFLOW: {
    create(options: { id?: string; params?: unknown }): Promise<{ id: string }>
    get(id: string): Promise<unknown>
  }

  // Secrets Store for API keys
  SECRETS: {
    get(key: string): Promise<string | null>
  }

  // Cloudflare account ID for Images API
  CF_ACCOUNT_ID?: string

  // Cloudflare API token for Images API
  CF_API_TOKEN?: string
}

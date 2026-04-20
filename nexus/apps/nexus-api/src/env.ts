import type { D1Database, KVNamespace, R2Bucket, AI } from '@cloudflare/workers-types'

// Environment bindings for Cloudflare Workers
export interface Env {
  // Main binding - D1 SQLite database
  DB: D1Database
  
  // KV namespace for config cache and rate limiting
  CONFIG: KVNamespace
  
  // R2 bucket for asset storage
  ASSETS: R2Bucket
  
  // Cloudflare Images binding
  IMAGES: AI
  
  // Service binding to AI worker
  AI_WORKER: Fetcher
  
  // Cloudflare Workflows binding
  PRODUCT_WORKFLOW: any
  
  // Secrets Store for API keys
  SECRETS: any
  
  // Cloudflare account ID for Images API
  CF_ACCOUNT_ID?: string
  
  // Cloudflare API token for Images API
  CF_API_TOKEN?: string
}

// Extend Fetcher type for service binding
declare global {
  interface Fetcher {
    fetch(request: Request): Promise<Response>
  }
}

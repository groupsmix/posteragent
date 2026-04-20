/**
 * Cloudflare bindings for nexus-api worker.
 *
 * These types mirror the bindings declared in wrangler.toml so that
 * `env.*` access is fully typed throughout the worker code.
 */
export interface NexusApiEnv {
  // D1 database
  DB: D1Database

  // KV namespace for config & prompt cache
  CONFIG: KVNamespace

  // R2 bucket for assets
  ASSETS: R2Bucket

  // Cloudflare Images binding
  IMAGES: unknown

  // Service binding to nexus-ai worker
  AI_WORKER: Fetcher

  // Cloudflare Workflows binding
  PRODUCT_WORKFLOW: {
    create(options: { id: string; params: Record<string, unknown> }): Promise<{ id: string }>
    get(id: string): Promise<{ id: string; status: string }>
  }

  // Secrets Store binding
  SECRETS: {
    get(name: string): string | undefined
  }

  // Environment variables
  CF_ACCOUNT_ID: string
  CF_API_TOKEN: string
  FRONTEND_URL: string
}

/**
 * Cloudflare bindings for nexus-ai worker.
 */
export interface NexusAiEnv {
  // KV namespace for config & prompt cache
  CONFIG: KVNamespace

  // Secrets Store binding
  SECRETS: {
    get(name: string): string | undefined
  }
}

// Domain Types
export * from './domain'

// Product Types
export * from './product'

// Workflow Types
export * from './workflow'

// AI Types
export * from './ai'

// Platform Types
export * from './platform'

// Cloudflare Bindings
export interface Env {
  DB: D1Database
  CONFIG: KVNamespace
  ASSETS: R2Bucket
  IMAGES: CloudflareImages
  AI_WORKER: Fetcher
  PRODUCT_WORKFLOW: WorkflowEntryPoint
  SECRETS: SecretsStore
  CF_ACCOUNT_ID: string
  CF_API_TOKEN: string
}

// Cloudflare Worker types
declare const D1Database: unique symbol
declare const KVNamespace: unique symbol
declare const R2Bucket: unique symbol
declare const CloudflareImages: unique symbol
declare const Fetcher: unique symbol
declare const WorkflowEntryPoint: unique symbol
declare const SecretsStore: unique symbol

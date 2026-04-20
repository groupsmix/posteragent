// ============================================================
// Storage Layer Index
// ============================================================

export * from './d1'
export * from './kv'
export * from './r2'
export * from './cf-images'

import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import { createCFImagesAPI, type CFImagesAPI } from './cf-images'

export interface Storage {
  db: D1Database
  kv: KVNamespace
  r2: R2Bucket
  images: CFImagesAPI
  accountId: string
  apiToken: string
}

export function createStorage(
  db: D1Database,
  kv: KVNamespace,
  r2: R2Bucket,
  accountId: string,
  apiToken: string
): Storage {
  return {
    db,
    kv,
    r2,
    images: createCFImagesAPI(accountId, apiToken),
    accountId,
    apiToken,
  }
}

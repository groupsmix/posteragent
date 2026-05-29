import { Hono } from 'hono'
import type { Env } from '../env'

// ============================================================
// Access gate — a single shared password that locks the whole
// dashboard + API. Stored server-side in KV as a SHA-256 hash
// (never the plaintext). The returned token IS that hash and is
// sent back as `Authorization: Bearer <token>` on every request.
//
// Bootstrap rule: until a password is set, the API is open so the
// owner can't lock themselves out before choosing one.
// ============================================================

const KV_HASH = 'access_hash'
const SALT = 'nexus.access.v1:'

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getAccessHash(env: Env): Promise<string | null> {
  if (!env.CONFIG) return null
  return env.CONFIG.get(KV_HASH)
}

export const authRoutes = new Hono<{ Bindings: Env }>()

// Whether a password has been set (so the UI knows to show login vs setup).
authRoutes.get('/status', async (c) => {
  const hash = await getAccessHash(c.env)
  return c.json({ protected: Boolean(hash) })
})

// Exchange a password for a token.
authRoutes.post('/login', async (c) => {
  const { password } = await c.req.json<{ password?: string }>()
  const hash = await getAccessHash(c.env)
  if (!hash) return c.json({ error: 'No password set yet' }, 400)
  if (!password || (await hashPassword(password)) !== hash) {
    return c.json({ error: 'Wrong password' }, 401)
  }
  return c.json({ token: hash })
})

// Set (first time) or change the password.
// - First time: no auth needed (bootstrap).
// - Change: must present the current password.
authRoutes.post('/setup', async (c) => {
  const { password, current } = await c.req.json<{ password?: string; current?: string }>()
  if (!password || password.length < 4) {
    return c.json({ error: 'Password must be at least 4 characters' }, 400)
  }
  const existing = await getAccessHash(c.env)
  if (existing) {
    if (!current || (await hashPassword(current)) !== existing) {
      return c.json({ error: 'Current password is incorrect' }, 401)
    }
  }
  const hash = await hashPassword(password)
  await c.env.CONFIG.put(KV_HASH, hash)
  return c.json({ ok: true, token: hash })
})

// Remove the gate entirely (requires the current password).
authRoutes.post('/disable', async (c) => {
  const { current } = await c.req.json<{ current?: string }>()
  const existing = await getAccessHash(c.env)
  if (existing) {
    if (!current || (await hashPassword(current)) !== existing) {
      return c.json({ error: 'Current password is incorrect' }, 401)
    }
    await c.env.CONFIG.delete(KV_HASH)
  }
  return c.json({ ok: true })
})

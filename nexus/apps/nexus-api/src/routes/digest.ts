import { Hono } from 'hono'
import type { Env } from '../env'
import { buildDigest } from '../services/digest'

export const digestRoutes = new Hono<{ Bindings: Env }>()

// GET /digest — the morning report data for the dashboard card.
digestRoutes.get('/', async (c) => {
  const digest = await buildDigest(c.env)
  return c.json(digest)
})

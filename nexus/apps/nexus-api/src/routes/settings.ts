import { Hono } from 'hono'
import type { Env } from '../env'

export const settingsRoutes = new Hono<{ Bindings: Env }>()

// GET /settings - Get all settings
settingsRoutes.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM settings').all()
    
    // Transform rows into key-value object
    const settings: Record<string, any> = {}
    for (const row of result.results as any[]) {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value)
      } catch {
        settings[row.setting_key] = row.setting_value
      }
    }
    
    return c.json(settings)
  } catch (err) {
    console.error('Error fetching settings:', err)
    return c.json({ error: 'Failed to fetch settings' }, 500)
  }
})

// GET /settings/:key - Get specific setting
settingsRoutes.get('/:key', async (c) => {
  try {
    const key = c.req.param('key')
    
    const setting = await c.env.DB.prepare(
      'SELECT * FROM settings WHERE setting_key = ?'
    ).bind(key).first()
    
    if (!setting) {
      return c.json({ error: 'Setting not found' }, 404)
    }
    
    const result = (setting as any).setting_value
    try {
      return c.json({ key, value: JSON.parse(result) })
    } catch {
      return c.json({ key, value: result })
    }
  } catch (err) {
    console.error('Error fetching setting:', err)
    return c.json({ error: 'Failed to fetch setting' }, 500)
  }
})

// PATCH /settings - Update multiple settings
settingsRoutes.patch('/', async (c) => {
  try {
    const updates = await c.req.json()
    const now = new Date().toISOString()
    
    for (const [key, value] of Object.entries(updates)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      
      await c.env.DB.prepare(`
        INSERT INTO settings (setting_key, setting_value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = ?
      `).bind(key, stringValue, now, stringValue, now).run()
    }
    
    // Return updated settings
    const result = await c.env.DB.prepare('SELECT * FROM settings').all()
    const settings: Record<string, any> = {}
    for (const row of result.results as any[]) {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value)
      } catch {
        settings[row.setting_key] = row.setting_value
      }
    }
    
    return c.json(settings)
  } catch (err) {
    console.error('Error updating settings:', err)
    return c.json({ error: 'Failed to update settings' }, 500)
  }
})

// PATCH /settings/:key - Update specific setting
settingsRoutes.patch('/:key', async (c) => {
  try {
    const key = c.req.param('key')
    const { value } = await c.req.json()
    const now = new Date().toISOString()
    
    if (value === undefined) {
      return c.json({ error: 'value is required' }, 400)
    }
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    
    await c.env.DB.prepare(`
      INSERT INTO settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = ?
    `).bind(key, stringValue, now, stringValue, now).run()
    
    return c.json({ key, value })
  } catch (err) {
    console.error('Error updating setting:', err)
    return c.json({ error: 'Failed to update setting' }, 500)
  }
})

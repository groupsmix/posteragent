'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { SocialChannel } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function ManagerSocialPage() {
  const [channels, setChannels] = useState<SocialChannel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSocialChannels()
      .then(setChannels)
      .finally(() => setLoading(false))
  }, [])

  const add = async () => {
    const name = prompt('Channel name?')
    if (!name) return
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const c = await api.createSocialChannel({ name, slug })
    setChannels((prev) => [...prev, c])
  }

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><Megaphone className="h-6 w-6" /> Social channels</span>}
        subtitle="Channels the AI will post promotional content to."
        actions={
          <button onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow">
            <Plus className="h-4 w-4" /> New channel
          </button>
        }
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <ul className="space-y-2">
            {channels.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.slug}</div>
                </div>
                <button onClick={() => api.deleteSocialChannel(c.id).then(() => setChannels((prev) => prev.filter((x) => x.id !== c.id)))} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  )
}

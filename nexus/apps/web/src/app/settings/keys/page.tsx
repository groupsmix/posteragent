'use client'

import { useEffect, useState } from 'react'
import { KeyRound, Check, ExternalLink } from 'lucide-react'
import { api, type ApiKeyInfo } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

const GROUP_ORDER: ApiKeyInfo['group'][] = ['AI', 'Publishing', 'Social']
const GROUP_BLURB: Record<ApiKeyInfo['group'], string> = {
  AI: 'Text + image generation. Groq is free and all you need for real AI content.',
  Publishing: 'Storefronts where NEXUS lists finished products.',
  Social: 'Auto-posting. A free Zapier/Make webhook covers every platform.',
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.getKeys()
      .then((r) => setKeys(r.keys))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async () => {
    const payload = Object.fromEntries(
      Object.entries(drafts).filter(([, v]) => v !== undefined)
    )
    if (Object.keys(payload).length === 0) return
    setSaving(true)
    try {
      await api.saveKeys(payload)
      setDrafts({})
      setSavedAt(Date.now())
      load()
    } finally {
      setSaving(false)
    }
  }

  const dirty = Object.values(drafts).some((v) => v && v.length > 0)

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><KeyRound className="h-6 w-6" /> API keys</span>}
        subtitle="Add provider keys here — no terminal needed. Keys are stored server-side and used by the engine immediately."
      />
      <PageBody>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="max-w-2xl space-y-8">
            {GROUP_ORDER.map((group) => {
              const items = keys.filter((k) => k.group === group)
              if (items.length === 0) return null
              return (
                <div key={group} className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">{group}</h3>
                    <p className="text-xs text-muted-foreground">{GROUP_BLURB[group]}</p>
                  </div>
                  {items.map((k) => (
                    <div key={k.key} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{k.label}</label>
                        {k.configured ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Set
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                      </div>
                      <input
                        type="password"
                        autoComplete="off"
                        placeholder={k.configured ? (k.masked ?? '••••') : `Paste ${k.key}…`}
                        value={drafts[k.key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [k.key]: e.target.value }))}
                        className="input w-full font-mono text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">{k.key}</span>
                        {k.help?.startsWith('http') ? (
                          <a href={k.help} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                            Get key <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{k.help}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            <div className="sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 py-4 border-t border-border bg-background/95 backdrop-blur flex items-center gap-3">
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="rounded-lg bg-gradient-primary text-primary-foreground px-5 py-2 text-sm font-semibold shadow-glow disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save keys'}
              </button>
              {savedAt && !dirty && (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> Saved — the engine is using them now.
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">Leave a field blank to delete a key.</span>
            </div>
          </div>
        )}
      </PageBody>
    </>
  )
}

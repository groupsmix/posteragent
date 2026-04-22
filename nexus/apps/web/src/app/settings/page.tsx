'use client'

import { useEffect, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [])

  const update = async (patch: any) => {
    if (!settings) return
    setSaving(true)
    try {
      const next = { ...settings, ...patch }
      setSettings(next)
      await api.updateSettings(patch)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><SettingsIcon className="h-6 w-6" /> Settings</span>}
        subtitle="Global defaults for the NEXUS engine."
      />
      <PageBody>
        {loading || !settings ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="max-w-2xl space-y-4">
            <Row label="Default language">
              <input
                className="input w-48"
                defaultValue={settings.default_language ?? 'en'}
                onBlur={(e) => update({ default_language: e.target.value })}
              />
            </Row>
            <Row label="Default currency">
              <input
                className="input w-24"
                defaultValue={settings.default_currency ?? 'USD'}
                onBlur={(e) => update({ default_currency: e.target.value })}
              />
            </Row>
            <ToggleRow
              label="CEO review required"
              checked={!!settings.ceo_review_required}
              onChange={(v) => update({ ceo_review_required: v })}
            />
            <ToggleRow
              label="Auto-publish after approval"
              checked={!!settings.auto_publish}
              onChange={(v) => update({ auto_publish: v })}
            />
            <ToggleRow
              label="Trend radar enabled"
              checked={!!settings.trend_radar_enabled}
              onChange={(v) => update({ trend_radar_enabled: v })}
            />
            <Row label="Graveyard resurface (days)">
              <input
                type="number"
                className="input w-24"
                defaultValue={settings.graveyard_resurface_days ?? 30}
                onBlur={(e) => update({ graveyard_resurface_days: Number(e.target.value) })}
              />
            </Row>
            {saving && <div className="text-xs text-muted-foreground">Saving…</div>}
          </div>
        )}
      </PageBody>
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="text-sm">{label}</div>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Row label={label}>
      <button
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <div
          className={`h-5 w-5 bg-background rounded-full shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </Row>
  )
}

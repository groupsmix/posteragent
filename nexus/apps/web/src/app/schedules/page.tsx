'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Plus, Play, Trash2, Loader2, Inbox, FileText, Package, X } from 'lucide-react'
import { api, type Schedule, type Delivery, type DeliveryFull } from '@/lib/api'
import { PageHeader, PageBody } from '@/components/shell/AppShell'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [open, setDelivery] = useState<DeliveryFull | null>(null)

  const [form, setForm] = useState({
    name: '', task_type: 'blog', topic: '', instructions: '', frequency: 'daily', email: '',
  })

  async function refresh() {
    const [s, d] = await Promise.all([api.getSchedules(), api.getDeliveries()])
    setSchedules(s.schedules)
    setDeliveries(d.deliveries)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function create() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.createSchedule(form)
      setForm({ name: '', task_type: 'blog', topic: '', instructions: '', frequency: 'daily', email: '' })
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  async function runNow(id: string) {
    setRunningId(id)
    try {
      await api.runSchedule(id)
      await refresh()
    } finally {
      setRunningId(null)
    }
  }

  async function remove(id: string) {
    await api.deleteSchedule(id)
    await refresh()
  }

  async function openDelivery(id: string) {
    const d = await api.getDelivery(id)
    setDelivery(d.delivery)
  }

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2"><CalendarClock className="h-6 w-6" /> Scheduler</span>}
        subtitle="Define a recurring AI task once (e.g. 'every day write a blog post for site A in my style'). NEXUS runs it on schedule and drops the result in your Deliveries inbox — and emails it to you if you add an email address (set up a Resend key on the API keys page)."
      />
      <PageBody className="space-y-8">
        {/* Create form */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" /> New scheduled task</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Name
              <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Daily blog for Site A" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Task
              <select className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
                <option value="blog">Blog post</option>
                <option value="product">Build a product</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Site / topic
              <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Site A — productivity tips" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Frequency
              <select className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Email it to (optional)
              <input type="email" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="you@gmail.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Style / project context
              <textarea className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                rows={3} placeholder="Write in a friendly, expert tone. My site covers X for audience Y…"
                value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Runs on the daily cron (06:00 UTC). Use “Run now” to test instantly.</p>
            <button onClick={create} disabled={saving || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create schedule
            </button>
          </div>
        </div>

        {/* Schedules list */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Your schedules</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {s.task_type === 'product' ? <Package className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      {s.name}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{s.frequency}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.topic || '—'}{s.last_run_at ? ` · last run ${new Date(s.last_run_at).toLocaleString()}` : ' · never run'}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => runNow(s.id)} disabled={runningId === s.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-50">
                      {runningId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run now
                    </button>
                    <button onClick={() => remove(s.id)}
                      className="inline-flex items-center rounded-md border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliveries inbox */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Inbox className="h-4 w-4" /> Deliveries inbox</h2>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliveries yet. Run a schedule to produce one.</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <button key={d.id} onClick={() => openDelivery(d.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {d.kind === 'product' ? <Package className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="truncate">{d.title || 'Untitled'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()} · webhook: {d.webhook_status || 'n/a'} · {emailStatusLabel(d.email_status)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PageBody>

      {/* Delivery viewer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDelivery(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">{open.title}</h3>
              <button onClick={() => setDelivery(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm text-foreground">{open.body || '—'}</pre>
          </div>
        </div>
      )}
    </>
  )
}

function emailStatusLabel(status: string | null): string {
  switch (status) {
    case 'sent': return 'emailed ✓'
    case 'no_key': return 'email: add Resend key'
    case 'no_recipient': return 'email: set an address'
    case null:
    case '': return 'email: off'
    default: return 'email failed'
  }
}

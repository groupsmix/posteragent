'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { ProductDetail } from '@nexus/types'
import { PageHeader, PageBody } from '@/components/shell/AppShell'
import { ScoreBar } from '@/components/shared/ScoreBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  CheckCircle2, XCircle, AlertTriangle, ThumbsDown, ThumbsUp, Edit3,
} from 'lucide-react'

export default function ReviewPage() {
  const params = useParams<{ productId: string }>()
  const id = params?.productId as string
  const router = useRouter()
  const [p, setP] = useState<ProductDetail | null>(null)
  const [tab, setTab] = useState<'platforms' | 'social'>('platforms')
  const [activePlatform, setActivePlatform] = useState(0)
  const [activeSocial, setActiveSocial] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [editing, setEditing] = useState<null | 'title' | 'description' | 'tags'>(null)

  useEffect(() => {
    api.getProductDetail(id).then(setP).catch(() => setP(null))
  }, [id])

  if (!p) {
    return (
      <PageBody>
        <div className="text-sm text-muted-foreground">Loading review…</div>
      </PageBody>
    )
  }

  const approve = async () => {
    await api.approveProduct(p.id)
    router.push('/products')
  }
  const reject = async () => {
    await api.rejectProduct(p.id, feedback || 'No reason given')
    router.push('/graveyard')
  }
  const updateField = async (patch: Partial<ProductDetail>) => {
    setP({ ...p, ...patch })
    await api.updateProductSection(p.id, patch)
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title={
          <span>
            CEO Review{' '}
            <span className="text-muted-foreground font-normal text-base">· {p.name}</span>
          </span>
        }
        subtitle={<span>{p.domain_name} → {p.category_name}</span>}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={p.status} />
            <div className="rounded-full border border-border bg-card px-3 py-1.5 text-sm">
              AI score{' '}
              <span className="font-mono font-bold ml-1 text-gradient">
                {p.ai_score.toFixed(1)}
              </span>
              <span className="text-muted-foreground">/10</span>
            </div>
          </div>
        }
      />
      <PageBody>
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            <Section
              title="Title"
              actions={
                <button
                  onClick={() => setEditing('title')}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
              }
            >
              <div className="space-y-2">
                {p.title_variants.map((t, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                      p.selected_title_index === i
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="title"
                      checked={p.selected_title_index === i}
                      onChange={() => updateField({ selected_title_index: i })}
                      className="mt-1"
                    />
                    <div className="text-sm">{t}</div>
                  </label>
                ))}
              </div>
            </Section>

            <Section
              title="Description"
              actions={
                <button
                  onClick={() => setEditing(editing === 'description' ? null : 'description')}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
              }
            >
              {editing === 'description' ? (
                <textarea
                  defaultValue={p.description}
                  onBlur={(e) => updateField({ description: e.target.value })}
                  className="input min-h-32 w-full"
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {p.description}
                </p>
              )}
            </Section>

            <Section
              title="Tags"
              actions={
                <button
                  onClick={() => setEditing(editing === 'tags' ? null : 'tags')}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
              }
            >
              {editing === 'tags' ? (
                <input
                  defaultValue={p.tags.join(', ')}
                  onBlur={(e) =>
                    updateField({
                      tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="input w-full"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs rounded-full bg-muted px-2.5 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Pricing">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold tabular-nums">
                  ${p.price.toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {p.currency}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Revenue est. (90 days)
                  </div>
                  <div className="text-sm font-mono">
                    ${p.revenue_estimate_detail?.min ?? '—'}–${p.revenue_estimate_detail?.max ?? '—'}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Variations">
              <div className="flex border-b border-border mb-3">
                <button
                  onClick={() => setTab('platforms')}
                  className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                    tab === 'platforms'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  Platforms ({p.platform_variants.length})
                </button>
                <button
                  onClick={() => setTab('social')}
                  className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                    tab === 'social'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  Social ({p.social_variants.length})
                </button>
              </div>
              {tab === 'platforms' ? (
                <>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {p.platform_variants.map((v, i) => (
                      <button
                        key={v.id}
                        onClick={() => setActivePlatform(i)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          activePlatform === i
                            ? 'border-primary bg-primary/10'
                            : 'border-border'
                        }`}
                      >
                        {v.platform_name}
                      </button>
                    ))}
                  </div>
                  {p.platform_variants[activePlatform] && (
                    <div className="rounded-xl border border-border p-4 space-y-3 bg-background/50">
                      <div className="font-semibold text-sm">
                        {p.platform_variants[activePlatform].title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {p.platform_variants[activePlatform].description}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.platform_variants[activePlatform].tags.map((t: string) => (
                          <span key={t} className="text-[11px] rounded bg-muted px-1.5 py-0.5">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm font-mono">
                        ${p.platform_variants[activePlatform].price}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {p.social_variants.map((v, i) => (
                      <button
                        key={v.id}
                        onClick={() => setActiveSocial(i)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          activeSocial === i
                            ? 'border-primary bg-primary/10'
                            : 'border-border'
                        }`}
                      >
                        {v.channel_name}
                      </button>
                    ))}
                  </div>
                  {p.social_variants[activeSocial] && (
                    <div className="rounded-xl border border-border p-4 space-y-2 bg-background/50">
                      {p.social_variants[activeSocial].content.hook && (
                        <div className="text-xs text-muted-foreground italic">
                          Hook: {p.social_variants[activeSocial].content.hook}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">
                        {p.social_variants[activeSocial].content.caption}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.social_variants[activeSocial].content.hashtags.map((h: string) => (
                          <span key={h} className="text-[11px] text-primary">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Section>

            {p.launch_boost_pack && (
              <Section title="Launch boost pack">
                <div className="space-y-2">
                  {p.launch_boost_pack.posts.map((post, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm"
                    >
                      <div className="text-[11px] font-mono uppercase text-muted-foreground tabular-nums w-12 shrink-0">
                        {post.when}
                      </div>
                      <div className="text-xs font-medium w-24 shrink-0">{post.channel}</div>
                      <div className="text-foreground/80">{post.content}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-5">
            <Section title="Section scores">
              <div className="space-y-3">
                {Object.entries(p.section_scores).map(([k, v]) => (
                  <ScoreBar key={k} value={v as number} label={k} />
                ))}
              </div>
            </Section>

            {p.issues.length > 0 && (
              <Section title="Issues to fix">
                <ul className="space-y-3">
                  {p.issues.map((iss, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        <span className="font-medium capitalize">{iss.section}</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">{iss.problem}</div>
                      <div className="text-success mt-0.5">→ {iss.fix}</div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Listing health">
              <ul className="space-y-1.5 text-sm">
                {p.health_check.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {h.status === 'pass' && (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    )}
                    {h.status === 'warn' && (
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    )}
                    {h.status === 'fail' && (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div>{h.label}</div>
                      {h.detail && (
                        <div className="text-[11px] text-muted-foreground">{h.detail}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            {p.competitor_gap?.detected && (
              <Section title="Competitor gap">
                <div className="text-sm rounded-xl bg-success/10 border border-success/30 p-3 text-success">
                  {p.competitor_gap.summary}
                </div>
              </Section>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 mt-8 -mx-6 md:-mx-8 px-6 md:px-8 py-4 border-t border-border bg-background/95 backdrop-blur flex items-center justify-between gap-3">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to products
          </Link>
          <div className="flex items-center gap-2">
            {showReject ? (
              <div className="flex items-center gap-2">
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What's wrong? (sent back to AI)"
                  className="input w-72"
                />
                <button
                  onClick={reject}
                  className="inline-flex items-center gap-1 rounded-lg bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium"
                >
                  <ThumbsDown className="h-4 w-4" /> Reject
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="text-sm text-muted-foreground px-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowReject(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm hover:border-destructive/50 hover:text-destructive"
                >
                  <ThumbsDown className="h-4 w-4" /> Reject
                </button>
                <button
                  onClick={approve}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary text-primary-foreground px-5 py-2 text-sm font-semibold shadow-glow"
                >
                  <ThumbsUp className="h-4 w-4" /> Approve
                </button>
              </>
            )}
          </div>
        </div>
      </PageBody>
    </>
  )
}

function Section({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  )
}

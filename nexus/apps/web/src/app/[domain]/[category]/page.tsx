'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check, X } from 'lucide-react'
import Link from 'next/link'
import type { Platform, SocialChannel } from '@nexus/types'

export default function ProductSetupPage() {
  const params = useParams()
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [socialChannels, setSocialChannels] = useState<SocialChannel[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    language: 'en',
    niche: '',
    product_name: '',
    description: '',
    keywords: '',
    selected_platform_ids: [] as string[],
    post_to_social: false,
    selected_social_channel_ids: [] as string[],
    social_posting_mode: 'manual' as 'auto' | 'manual',
    let_ai_price: true,
    let_ai_audience: true,
    let_ai_style: true,
  })

  useEffect(() => {
    Promise.all([api.getPlatforms(), api.getSocialChannels()])
      .then(([p, s]) => { setPlatforms(p); setSocialChannels(s) })
      .finally(() => setLoading(false))
  }, [])

  const togglePlatform = (id: string) => {
    setForm(f => ({
      ...f,
      selected_platform_ids: f.selected_platform_ids.includes(id)
        ? f.selected_platform_ids.filter(p => p !== id)
        : [...f.selected_platform_ids, id]
    }))
  }

  const toggleSocial = (id: string) => {
    setForm(f => ({
      ...f,
      selected_social_channel_ids: f.selected_social_channel_ids.includes(id)
        ? f.selected_social_channel_ids.filter(s => s !== id)
        : [...f.selected_social_channel_ids, id]
    }))
  }

  const handleStart = async () => {
    setSubmitting(true)
    try {
      const result = await api.startWorkflow({
        domain_slug: params.domain as string,
        category_slug: params.category as string,
        user_input: form,
      })
      router.push(`/workflow/${result.workflow_id}`)
    } catch (e: any) {
      console.error(e)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">›</span>
          <Link href={`/${params.domain}`} className="hover:text-foreground capitalize">{params.domain}</Link>
          <span className="mx-2">›</span>
          <span className="capitalize">{params.category}</span>
        </nav>

        <h1 className="text-2xl font-bold mb-2 capitalize">{params.category}</h1>
        <p className="text-muted-foreground text-sm mb-8">
          All fields are optional. Leave empty and AI does everything.
        </p>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="text-sm font-medium">Language</label>
            <select
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
            </select>
          </div>

          {/* Optional Fields */}
          {[
            { key: 'niche', label: 'Niche', placeholder: 'e.g. "freelancers", "dog moms"' },
            { key: 'product_name', label: 'Product Name', placeholder: 'Leave empty for AI' },
            { key: 'description', label: 'Brief Description', placeholder: 'What this product does' },
            { key: 'keywords', label: 'Keywords', placeholder: 'e.g. "notion, crm, productivity"' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-muted-foreground">
                {label} <span className="text-xs">(optional)</span>
              </label>
              <Input
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="mt-1"
              />
            </div>
          ))}

          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Post to Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    form.selected_platform_ids.includes(p.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:border-primary/50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Post to Social Media?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, post_to_social: true }))}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    form.post_to_social
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, post_to_social: false }))}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    !form.post_to_social
                      ? 'bg-secondary text-secondary-foreground'
                      : 'border border-input'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {form.post_to_social && (
              <div className="flex flex-wrap gap-2">
                {socialChannels.map((ch: any) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleSocial(ch.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      form.selected_social_channel_ids.includes(ch.id)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-background border-input hover:border-purple-500/50'
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">AI Decisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'let_ai_price', label: 'Let AI suggest price' },
                { key: 'let_ai_audience', label: 'Let AI define target audience' },
                { key: 'let_ai_style', label: 'Let AI choose design style' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleStart}
              disabled={submitting}
              className="flex-1"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Workflow →'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

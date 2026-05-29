import type {
  Domain,
  Category,
  Platform,
  SocialChannel,
  Product,
  ProductDetail,
  WorkflowStatusResponse,
  TrendAlert,
  WinnerPattern,
  AIModelDashboardStatus,
  PromptTemplate,
  Settings,
} from '@nexus/types'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export interface ApiKeyInfo {
  key: string
  label: string
  group: 'AI' | 'Publishing' | 'Social' | 'Email'
  help: string
  worker: 'ai' | 'api'
  configured: boolean
  masked: string | null
}

export interface ManagerMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ManagerAction {
  type: 'create_product' | 'note'
  domain_slug?: string
  category_slug?: string
  product_name?: string
  niche?: string
  description?: string
  product_id?: string
  workflow_id?: string
  status?: 'started' | 'failed'
  detail?: string
}

export interface ManagerReply {
  reply: string
  actions: ManagerAction[]
}

export interface AgentStep {
  tool: string
  args: Record<string, unknown>
  ok: boolean
  summary: string
  product_id?: string
  screenshot_url?: string
}

export interface BrowseResult {
  ok: boolean
  url: string
  finalUrl?: string
  title?: string
  summary?: string | null
  text?: string
  screenshotUrl?: string | null
  error?: string
}

export interface AgentReply {
  reply: string
  steps: AgentStep[]
}

export interface TeamModel {
  name: string
  provider: string
  isFree: boolean
  configured: boolean
}

export interface TeamRole {
  role: string
  step: string
  wave: number
  taskType: string
  primary: TeamModel
  fallbacks: TeamModel[]
  free_safety_net: boolean
}

export interface TeamWave {
  wave: number
  parallel: boolean
  roles: TeamRole[]
}

export interface TeamReply {
  roles: TeamRole[]
  waves: TeamWave[]
}

export interface Schedule {
  id: string
  name: string
  task_type: string
  domain_slug: string | null
  category_slug: string | null
  topic: string | null
  instructions: string | null
  frequency: string
  active: number
  last_run_at: string | null
  created_at: string
  email: string | null
}

export interface NewSchedule {
  name: string
  task_type: string
  domain_slug?: string
  category_slug?: string
  topic?: string
  instructions?: string
  frequency: string
  email?: string
}

export interface Delivery {
  id: string
  schedule_id: string | null
  title: string | null
  kind: string
  product_id: string | null
  webhook_status: string | null
  email_status: string | null
  created_at: string
}

export interface DeliveryFull extends Delivery {
  body: string | null
}

export interface AutopilotWinner {
  id: string
  name: string
  status: string
  ai_score: number
  est: number
}

export interface AutopilotLogEntry {
  action: string
  product_id: string | null
  niche: string | null
  domain_slug: string | null
  note: string | null
  created_at: string
}

export interface AutopilotStatus {
  enabled: boolean
  per_run: number
  auto_approve: boolean
  auto_publish: boolean
  min_score: number
  products_built: number
  est_revenue: { low: number; high: number; currency: string }
  winners: AutopilotWinner[]
  recent: AutopilotLogEntry[]
}

export interface MarketingLogEntry {
  channel: string | null
  content: string | null
  status: string
  note: string | null
  created_at: string
  product_name?: string | null
}
export interface MarketingStatus {
  enabled: boolean
  per_run: number
  delivery_configured: boolean
  promotions_sent: number
  channels: { slug: string; name: string }[]
  recent: MarketingLogEntry[]
}

// Resolve an API-relative asset path (e.g. /api/assets/r2/...) to an absolute
// URL the browser can load. Absolute URLs are returned unchanged.
export function assetUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path}`
}

export interface RevenueProduct {
  id: string
  name: string
  sales: number
  revenue: number
  url: string | null
  published: boolean
}
export interface RevenueResponse {
  configured: boolean
  message?: string
  error?: string
  currency?: string
  total_sales?: number
  total_revenue?: number
  product_count?: number
  best_seller?: string | null
  products?: RevenueProduct[]
}

export interface Digest {
  date: string
  built_24h: number
  needs_review: number
  published: number
  approved: number
  spend_today: number
  spend_cap: number
  sales_configured: boolean
  total_sales: number
  total_revenue: number
  best_seller: string | null
  recent: { name: string; created_at: string }[]
}

export interface HistoryRun {
  id: string
  product_id: string
  product_name: string | null
  status: string
  failed_step: string | null
  step_count: number
  steps_completed: number
  steps_failed: number
  run_tokens: number
  run_cost_usd: number
  started_at: string | null
  completed_at: string | null
}

export interface PublishItem {
  id: string
  product_name: string | null
  title: string | null
  platform_name: string | null
  status: string
}

const TOKEN_KEY = 'nexus_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (res.status === 401) {
    // Token missing/stale — drop it and let the gate take over.
    setToken(null)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('nexus-auth-required'))
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || error.error || `API error: ${res.status}`)
  }
  return res.json()
}

export interface StartWorkflowInput {
  domain_slug: string
  category_slug: string
  user_input: {
    language?: string
    niche?: string
    product_name?: string
    description?: string
    keywords?: string
    selected_platform_ids?: string[]
    post_to_social?: boolean
    selected_social_channel_ids?: string[]
    social_posting_mode?: 'auto' | 'manual'
    let_ai_price?: boolean
    let_ai_audience?: boolean
    let_ai_style?: boolean
  }
}

export const api = {
  // Domains
  getDomains: () => apiFetch<Domain[]>('/api/domains'),
  createDomain: (data: Partial<Domain>) => apiFetch<Domain>('/api/domains', { method: 'POST', body: JSON.stringify(data) }),
  updateDomain: (id: string, data: Partial<Domain>) => apiFetch<Domain>(`/api/domains/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDomain: (id: string) => apiFetch<void>(`/api/domains/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: (domainId: string) => apiFetch<Category[]>(`/api/domains/${domainId}/categories`),
  createCategory: (domainId: string, data: Partial<Category>) => apiFetch<Category>(`/api/domains/${domainId}/categories`, { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) =>
    apiFetch<Category>(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => apiFetch<void>(`/api/categories/${id}`, { method: 'DELETE' }),
  getCategoryBySlug: (domainSlug: string, categorySlug: string) =>
    apiFetch<Category & { domain?: Domain }>(
      `/api/domains/${domainSlug}/categories/${categorySlug}`
    ),
  getDomainBySlug: (slug: string) => apiFetch<Domain>(`/api/domains/slug/${slug}`),

  // Workflow
  startWorkflow: (data: StartWorkflowInput) => apiFetch<{ workflow_id: string; product_id: string }>('/api/workflow/start', { method: 'POST', body: JSON.stringify(data) }),
  getWorkflowStatus: (id: string) => apiFetch<WorkflowStatusResponse>(`/api/workflow/${id}`),

  // Review
  approveProduct: (productId: string) => apiFetch<void>(`/api/review/${productId}/approve`, { method: 'POST' }),
  rejectProduct: (productId: string, feedback: string) => apiFetch<void>(`/api/review/${productId}/reject`, { method: 'POST', body: JSON.stringify({ feedback }) }),

  // Products
  getProducts: (filters?: { status?: string; domain_id?: string; limit?: number }) =>
    apiFetch<{ products: Product[] }>(`/api/products?${new URLSearchParams(filters as Record<string, string>)}`),
  getProduct: (id: string) => apiFetch<Product>(`/api/products/${id}`),
  getProductDetail: (id: string) => apiFetch<ProductDetail>(`/api/products/${id}/detail`),
  generateDeliverable: (id: string, opts?: { format?: string; force?: boolean }) => {
    const qs = new URLSearchParams()
    if (opts?.format) qs.set('format', opts.format)
    if (opts?.force) qs.set('force', '1')
    const q = qs.toString()
    return apiFetch<{ ok: boolean; deliverable_url: string; deliverable_format: string }>(
      `/api/products/${id}/generate-deliverable${q ? `?${q}` : ''}`,
      { method: 'POST' },
    )
  },
  updateProductSection: (id: string, patch: Partial<ProductDetail>) =>
    apiFetch<ProductDetail>(`/api/products/${id}/detail`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteProduct: (id: string) => apiFetch<void>(`/api/products/${id}`, { method: 'DELETE' }),

  // Trends
  getTrends: () => apiFetch<TrendAlert[]>('/api/trends'),
  dismissTrend: (id: string) => apiFetch<void>(`/api/trends/${id}/dismiss`, { method: 'POST' }),
  startTrendWorkflow: (id: string) => apiFetch<{ workflow_id: string }>(`/api/trends/${id}/start`, { method: 'POST' }),

  // Winners
  getWinnerPatterns: () => apiFetch<WinnerPattern[]>('/api/winners'),

  // AI Models
  getAIModels: () => apiFetch<AIModelDashboardStatus[]>('/api/ai-models'),
  updateAIModel: (id: string, data: Partial<AIModelDashboardStatus>) => apiFetch<AIModelDashboardStatus>(`/api/ai-models/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Platforms
  getPlatforms: () => apiFetch<Platform[]>('/api/platforms'),
  createPlatform: (data: Partial<Platform>) => apiFetch<Platform>('/api/platforms', { method: 'POST', body: JSON.stringify(data) }),
  updatePlatform: (id: string, data: Partial<Platform>) => apiFetch<Platform>(`/api/platforms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePlatform: (id: string) => apiFetch<void>(`/api/platforms/${id}`, { method: 'DELETE' }),

  // Social
  getSocialChannels: () => apiFetch<SocialChannel[]>('/api/social'),
  createSocialChannel: (data: Partial<SocialChannel>) => apiFetch<SocialChannel>('/api/social', { method: 'POST', body: JSON.stringify(data) }),
  updateSocialChannel: (id: string, data: Partial<SocialChannel>) => apiFetch<SocialChannel>(`/api/social/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSocialChannel: (id: string) => apiFetch<void>(`/api/social/${id}`, { method: 'DELETE' }),

  // Prompts
  getPrompts: (layer?: string) => apiFetch<PromptTemplate[]>(`/api/prompts${layer ? `?layer=${layer}` : ''}`),
  updatePrompt: (id: string, promptText: string) => apiFetch<PromptTemplate>(`/api/prompts/${id}`, { method: 'PATCH', body: JSON.stringify({ prompt_text: promptText }) }),

  // Settings
  getSettings: () => apiFetch<Settings>('/api/settings'),
  updateSettings: (data: Partial<Settings>) => apiFetch<Settings>('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  // API keys (dashboard-managed provider credentials)
  getKeys: () => apiFetch<{ keys: ApiKeyInfo[] }>('/api/keys'),
  saveKeys: (keys: Record<string, string>) =>
    apiFetch<{ ok: boolean; written: number; ai_forwarded: boolean }>('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),

  // AI cost meter + daily spend cap
  getSpend: () => apiFetch<{ today: number; cap: number; cap_reached: boolean }>('/api/keys/spend'),
  setCap: (cap_usd: number) =>
    apiFetch<{ ok: boolean; cap: number }>('/api/keys/cap', {
      method: 'POST',
      body: JSON.stringify({ cap_usd }),
    }),

  // Per-provider ON/OFF (key stays saved)
  getProviders: () => apiFetch<{ providers: { secretKey: string; off: boolean }[] }>('/api/keys/providers'),
  toggleProvider: (secretKey: string, off: boolean) =>
    apiFetch<{ ok: boolean; secretKey: string; off: boolean }>('/api/keys/providers/toggle', {
      method: 'POST',
      body: JSON.stringify({ secretKey, off }),
    }),

  // CEO Manager (chat orchestrator)
  managerChat: (message: string, history: ManagerMessage[]) =>
    apiFetch<ManagerReply>('/api/manager/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // CEO Agent (full-control, tool-using)
  managerAgent: (message: string, history: ManagerMessage[]) =>
    apiFetch<AgentReply>('/api/manager/agent', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // Browser automation (headless browser on the Workers Paid plan)
  browserStatus: () => apiFetch<{ enabled: boolean }>('/api/browser/status'),
  browserRun: (url: string, instruction?: string) =>
    apiFetch<BrowseResult>('/api/browser/run', {
      method: 'POST',
      body: JSON.stringify({ url, instruction }),
    }),

  // AI agent team line-up
  getTeam: () => apiFetch<TeamReply>('/api/team'),

  // Scheduler
  getSchedules: () => apiFetch<{ schedules: Schedule[] }>('/api/schedules'),
  createSchedule: (s: NewSchedule) =>
    apiFetch<{ id: string; ok: boolean }>('/api/schedules', { method: 'POST', body: JSON.stringify(s) }),
  toggleSchedule: (id: string, active: boolean) =>
    apiFetch<void>(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteSchedule: (id: string) => apiFetch<void>(`/api/schedules/${id}`, { method: 'DELETE' }),
  runSchedule: (id: string) =>
    apiFetch<{ ok: boolean; delivery: { id: string; title: string; kind: string } }>(`/api/schedules/${id}/run`, { method: 'POST' }),
  getDeliveries: () => apiFetch<{ deliveries: Delivery[] }>('/api/schedules/deliveries/list'),
  getDelivery: (id: string) => apiFetch<{ delivery: DeliveryFull }>(`/api/schedules/deliveries/${id}`),

  // Autopilot money engine
  getAutopilot: () => apiFetch<AutopilotStatus>('/api/autopilot/status'),
  toggleAutopilot: (patch: { enabled?: boolean; per_run?: number; auto_approve?: boolean; auto_publish?: boolean; min_score?: number }) =>
    apiFetch<{ ok: boolean; enabled: boolean }>('/api/autopilot/toggle', {
      method: 'POST', body: JSON.stringify(patch),
    }),
  runAutopilot: () => apiFetch<{ ok: boolean; built: number }>('/api/autopilot/run', { method: 'POST' }),

  // Marketing team
  getMarketing: () => apiFetch<MarketingStatus>('/api/marketing/status'),
  toggleMarketing: (patch: { enabled?: boolean; per_run?: number }) =>
    apiFetch<{ ok: boolean; enabled: boolean }>('/api/marketing/toggle', {
      method: 'POST',
      body: JSON.stringify(patch),
    }),
  runMarketing: () => apiFetch<{ ok: boolean; promoted: number }>('/api/marketing/run', { method: 'POST' }),

  // Graveyard
  getGraveyard: () => apiFetch<{ products: Product[] }>('/api/graveyard'),
  restoreProduct: (id: string) => apiFetch<void>(`/api/graveyard/${id}/restore`, { method: 'POST' }),

  // History
  getHistory: () => apiFetch<{ runs: HistoryRun[] }>('/api/history'),

  // Publish
  getPublishQueue: () => apiFetch<{ items: PublishItem[] }>('/api/publish'),
  publishItem: (id: string) => apiFetch<void>(`/api/publish/${id}`, { method: 'POST' }),

  // Revenue (real Gumroad sales)
  getRevenue: () => apiFetch<RevenueResponse>('/api/revenue'),

  // Daily digest / morning report
  getDigest: () => apiFetch<Digest>('/api/digest'),

  // Access gate
  getAuthStatus: () => apiFetch<{ protected: boolean }>('/api/auth/status'),
  login: (password: string) =>
    apiFetch<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  setupPassword: (password: string, current?: string) =>
    apiFetch<{ ok: boolean; token: string }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ password, current }),
    }),
  disableAuth: (current: string) =>
    apiFetch<{ ok: boolean }>('/api/auth/disable', { method: 'POST', body: JSON.stringify({ current }) }),
}

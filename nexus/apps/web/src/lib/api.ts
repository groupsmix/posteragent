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
  type: 'create_product' | 'note' | 'browse' | 'list_product' | 'check_sales' | 'create_pod' | 'run_campaign' | 'analyze_niche'
  domain_slug?: string
  category_slug?: string
  product_name?: string
  niche?: string
  description?: string
  product_id?: string
  workflow_id?: string
  status?: 'started' | 'failed'
  detail?: string
  url?: string
  instruction?: string
  platform?: string
}

export interface ActionStep {
  description: string
  status: 'pending' | 'running' | 'done' | 'error'
  screenshot?: string
  timestamp?: string
}

export interface ActionResult {
  success: boolean
  message: string
  action_type: string
  data?: Record<string, unknown>
  screenshots?: string[]
  steps?: ActionStep[]
}

export interface ManagerReply {
  reply: string
  actions: ManagerAction[]
  action_results?: ActionResult[]
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

// Browser-action types
export type ActionType = 'click' | 'type' | 'select' | 'scroll' | 'wait' | 'screenshot' | 'navigate' | 'fillForm'

export interface BrowserAction {
  type: ActionType
  selector?: string
  value?: string
  url?: string
  waitMs?: number
  fields?: Record<string, string>
}

export interface BrowserActionResult {
  action: ActionType
  ok: boolean
  message?: string
  screenshotKey?: string
  durationMs: number
}

export interface ExecutionResult {
  ok: boolean
  results: BrowserActionResult[]
  totalMs: number
  error?: string
}

export interface FlowInfo {
  name: string
  platform: string
  stepCount: number
  variables: string[]
}

export interface PlatformStatusInfo {
  name: string
  method: 'browser' | 'api'
  configured: boolean
  requiresAuth: boolean
  baseUrl: string
}

export interface ListingResult {
  platform: string
  ok: boolean
  execution?: ExecutionResult
  error?: string
  listingId?: string
}

export interface PlatformListing {
  id: string
  product_id: string
  platform: string
  platform_url: string | null
  status: string
  listed_at: string | null
  error: string | null
  created_at: string
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

export interface DigestScheduleRun {
  name: string
  status: string
  ran_at: string
}

export interface DigestError {
  product_name: string | null
  failed_step: string | null
  created_at: string
}

// Learning Loop types
export interface LearningPatternRow {
  id: string
  pattern_type: string
  pattern_value: string
  times_seen: number
  times_sold: number
  total_revenue: number
  confidence_score: number
  confidence: number
  sample_count: number
  domain_id: string | null
  category_id: string | null
  source: string
  last_seen_at: string | null
  updated_at: string
}

export interface LearningStats {
  total_sales_synced: number
  total_revenue: number
  patterns_extracted: number
  top_patterns: LearningPatternRow[]
  last_sync_at: string | null
  last_analysis_at: string | null
  improvement_trend: { period: string; revenue: number }[]
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
  schedules_ran: number
  schedules_succeeded: number
  schedules_failed: number
  schedule_runs: DigestScheduleRun[]
  errors: DigestError[]
  top_product: string | null
}

export interface DigestRecord {
  id: string
  date: string
  data: Digest
  created_at: string
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

// Gumroad types
export interface GumroadProductInfo {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  short_url: string
  published: boolean
  sales_count: number
  sales_usd_cents: number
  views_count: number
}

export interface GumroadSaleInfo {
  id: string
  email: string
  price: number
  product_id: string
  product_name: string
  created_at: string
  refunded: boolean
}

export interface GumroadAnalyticsInfo {
  product_id: string
  views: number
  sales: number
  revenue_cents: number
}

// Scoring types
export interface ProductScoreDetail {
  titleScore: number
  descriptionScore: number
  completeness: number
  priceScore: number
  total: number
}

export interface QualityGateResult {
  pass: boolean
  issues: string[]
  score: number
}

export interface ProductScoreResponse {
  score: ProductScoreDetail
  quality_gate: QualityGateResult
  post_build_gate: QualityGateResult
}

export interface NicheScoreDetail {
  demand: number
  gap: number
  priceRange: number
  volume: number
  total: number
  recommendation: string
}

export interface NicheScoreResponse {
  niche_score: NicheScoreDetail
  quality_gate: QualityGateResult
}

// POD (Print on Demand) types
export interface PODShop {
  id: number
  title: string
  sales_channel: string
}

export interface PODBlueprint {
  id: number
  title: string
  description: string
  brand: string
  model: string
  images: string[]
}

export interface PODProduct {
  id: string
  printify_product_id: string | null
  shop_id: string | null
  blueprint_id: number | null
  title: string
  description: string | null
  niche: string | null
  product_type: string
  design_prompt: string | null
  design_url: string | null
  status: string
  printify_url: string | null
  price_cents: number
  created_at: string
  published_at: string | null
}

export interface PODDesignSpec {
  prompt: string
  productType: string
  niche: string
  dimensions: { width: number; height: number }
  style: string
  elements: { title: string; tagline: string; layout: string }
}

export interface PODCreateResult {
  id: string
  title: string
  description: string
  design: PODDesignSpec
  printify_product_id: string | null
  status: string
}

export interface PODStats {
  total_products: number
  published: number
  revenue_estimate_cents: number
  revenue_estimate_usd: number
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

  // Hyperbeam live browser
  hyperbeamCreate: (url?: string) =>
    apiFetch<{ ok: boolean; sessionId: string; embedUrl: string }>('/api/hyperbeam/session', {
      method: 'POST',
      body: JSON.stringify(url ? { url } : {}),
    }),
  hyperbeamDestroy: (sessionId: string) =>
    apiFetch<{ ok: boolean }>(`/api/hyperbeam/session/${sessionId}`, { method: 'DELETE' }),

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
  getDigestToday: () => apiFetch<Digest>('/api/digest/today'),
  getDigestHistory: () => apiFetch<{ digests: DigestRecord[] }>('/api/digest/history'),
  generateDigest: () => apiFetch<{ ok: boolean; digest: Digest }>('/api/digest/generate', { method: 'POST' }),
  sendDigestEmail: (to?: string) =>
    apiFetch<{ ok: boolean; status: string; digest: Digest }>('/api/digest/email', {
      method: 'POST',
      body: JSON.stringify(to ? { to } : {}),
    }),

  // Learning Loop
  getLearningStats: () => apiFetch<LearningStats>('/api/learning/stats'),
  getLearningPatterns: () => apiFetch<{ patterns: LearningPatternRow[]; total: number }>('/api/learning/patterns'),
  syncLearning: () => apiFetch<{ ok: boolean; synced: number; total_revenue: number; error?: string }>('/api/learning/sync', { method: 'POST' }),
  analyzeLearning: () => apiFetch<{ ok: boolean; patterns_created: number; patterns_updated: number }>('/api/learning/analyze', { method: 'POST' }),

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

  // Gumroad integration
  getGumroadProducts: () => apiFetch<{ products: GumroadProductInfo[] }>('/api/gumroad/products'),
  createGumroadProduct: (data: { name: string; price: number; description?: string; id?: string }) =>
    apiFetch<{ product: GumroadProductInfo }>('/api/gumroad/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGumroadSales: (opts?: { after?: string; before?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (opts?.after) qs.set('after', opts.after)
    if (opts?.before) qs.set('before', opts.before)
    if (opts?.page) qs.set('page', String(opts.page))
    const q = qs.toString()
    return apiFetch<{ sales: GumroadSaleInfo[] }>(`/api/gumroad/sales${q ? `?${q}` : ''}`)
  },
  getGumroadAnalytics: (productId: string) =>
    apiFetch<{ analytics: GumroadAnalyticsInfo }>(`/api/gumroad/products/${productId}/analytics`),

  // Scoring + quality gates
  getProductScore: (id: string) =>
    apiFetch<ProductScoreResponse>(`/api/products/${id}/score`),
  scoreNiche: (niche: string) =>
    apiFetch<NicheScoreResponse>('/api/niches/score', {
      method: 'POST',
      body: JSON.stringify({ niche }),
    }),

  // Print on Demand (POD)
  getPodShops: () => apiFetch<{ shops: PODShop[] }>('/api/pod/shops'),
  getPodBlueprints: () => apiFetch<{ blueprints: PODBlueprint[]; total: number }>('/api/pod/blueprints'),
  getPodProducts: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    return apiFetch<{ products: PODProduct[] }>(`/api/pod/products${qs}`)
  },
  createPodProduct: (data: { niche: string; productType: string; title?: string; description?: string; shopId?: string; blueprintId?: number }) =>
    apiFetch<PODCreateResult>('/api/pod/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publishPodProduct: (id: string) =>
    apiFetch<{ ok: boolean; id: string; status: string }>(`/api/pod/products/${id}/publish`, { method: 'POST' }),
  getPodStats: () => apiFetch<PODStats>('/api/pod/stats'),

  // Browser actions & multi-platform listing
  executeBrowserActions: (actions: BrowserAction[]) =>
    apiFetch<ExecutionResult>('/api/browser/actions', {
      method: 'POST',
      body: JSON.stringify({ actions }),
    }),
  getBrowserFlows: () => apiFetch<{ flows: FlowInfo[] }>('/api/browser/flows'),
  executeBrowserFlow: (name: string, variables?: Record<string, string>) =>
    apiFetch<ExecutionResult & { flow: string; platform: string }>(`/api/browser/flows/${name}/execute`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    }),
  getPlatformStatuses: () =>
    apiFetch<{ platforms: PlatformStatusInfo[] }>('/api/browser/platforms/status'),
  listOnPlatform: (platformName: string, product: Record<string, string>) =>
    apiFetch<ListingResult>(`/api/browser/platforms/${platformName}/list`, {
      method: 'POST',
      body: JSON.stringify({ product }),
    }),
  listOnAllPlatforms: (product: Record<string, string>, platforms?: string[]) =>
    apiFetch<{ results: ListingResult[] }>('/api/browser/platforms/list-all', {
      method: 'POST',
      body: JSON.stringify({ product, platforms }),
    }),
  getPlatformListings: (productId?: string) => {
    const qs = productId ? `?product_id=${productId}` : ''
    return apiFetch<{ listings: PlatformListing[] }>(`/api/browser/platforms/listings${qs}`)
  },

  // Observability
  getObservability: () =>
    apiFetch<{
      summary: {
        recent_workflows: number
        failed_workflows: number
        success_workflows: number
        failed_ai_steps: number
        product_counts: Record<string, number>
        ai_spend_today: number
        ai_spend_cap: number
        ai_cap_reached: boolean
      }
      failed_steps: Array<{
        run_id: string
        step_name: string
        status: string
        model_used: string | null
        error: string | null
        started_at: string | null
        completed_at: string | null
      }>
      recent_workflows: Array<{
        id: string
        status: string
        domain_slug: string | null
        category_slug: string | null
        created_at: string
        updated_at: string | null
      }>
      publish_results: Array<{
        id: string
        title: string
        status: string
        domain_slug: string | null
        gumroad_url: string | null
        created_at: string
      }>
    }>('/api/observability'),
}

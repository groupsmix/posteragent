import type {
  Domain,
  Category,
  Platform,
  SocialChannel,
  Product,
  ProductDetail,
} from '@nexus/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `API error: ${res.status}`)
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
  getWorkflowStatus: (id: string) => apiFetch<any>(`/api/workflow/${id}`),

  // Review
  approveProduct: (productId: string) => apiFetch<void>(`/api/review/${productId}/approve`, { method: 'POST' }),
  rejectProduct: (productId: string, feedback: string) => apiFetch<void>(`/api/review/${productId}/reject`, { method: 'POST', body: JSON.stringify({ feedback }) }),

  // Products
  getProducts: (filters?: { status?: string; domain_id?: string; limit?: number }) =>
    apiFetch<{ products: Product[] }>(`/api/products?${new URLSearchParams(filters as any)}`),
  getProduct: (id: string) => apiFetch<Product>(`/api/products/${id}`),
  getProductDetail: (id: string) => apiFetch<ProductDetail>(`/api/products/${id}/detail`),
  updateProductSection: (id: string, patch: Partial<ProductDetail>) =>
    apiFetch<ProductDetail>(`/api/products/${id}/detail`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteProduct: (id: string) => apiFetch<void>(`/api/products/${id}`, { method: 'DELETE' }),

  // Trends
  getTrends: () => apiFetch<any[]>('/api/trends'),
  dismissTrend: (id: string) => apiFetch<void>(`/api/trends/${id}/dismiss`, { method: 'POST' }),
  startTrendWorkflow: (id: string) => apiFetch<{ workflow_id: string }>(`/api/trends/${id}/start`, { method: 'POST' }),

  // Winners
  getWinnerPatterns: () => apiFetch<any[]>('/api/winners'),

  // AI Models
  getAIModels: () => apiFetch<any[]>('/api/ai-models'),
  updateAIModel: (id: string, data: any) => apiFetch<any>(`/api/ai-models/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

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
  getPrompts: (layer?: string) => apiFetch<any[]>(`/api/prompts${layer ? `?layer=${layer}` : ''}`),
  updatePrompt: (id: string, promptText: string) => apiFetch<any>(`/api/prompts/${id}`, { method: 'PATCH', body: JSON.stringify({ prompt_text: promptText }) }),

  // Settings
  getSettings: () => apiFetch<any>('/api/settings'),
  updateSettings: (data: any) => apiFetch<any>('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  // Graveyard
  getGraveyard: () => apiFetch<{ products: Product[] }>('/api/graveyard'),
  restoreProduct: (id: string) => apiFetch<void>(`/api/graveyard/${id}/restore`, { method: 'POST' }),

  // History
  getHistory: () => apiFetch<{ runs: any[] }>('/api/workflow/history'),

  // Publish
  getPublishQueue: () => apiFetch<{ items: any[] }>('/api/publish'),
  publishItem: (id: string) => apiFetch<void>(`/api/publish/${id}`, { method: 'POST' }),
}

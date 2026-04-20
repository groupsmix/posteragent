export type ProductStatus = 
  | 'draft'
  | 'running'
  | 'pending_review'
  | 'in_revision'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'
  | 'graveyard'

export interface Product {
  id: string
  domain_id: string
  category_id: string
  name: string | null
  niche: string | null
  language: string
  user_input: string | null
  status: ProductStatus
  ai_score: number | null
  revenue_estimate: string | null
  winner_patterns: string | null
  graveyard_at: string | null
  graveyard_reason: string | null
  resurface_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithDetails extends Product {
  domain?: {
    id: string
    name: string
    slug: string
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  platforms?: PlatformVariant[]
  social_content?: SocialVariant[]
}

export interface PlatformVariant {
  id: string
  product_id: string
  platform_id: string
  title: string | null
  description: string | null
  tags: string | null
  price: number | null
  currency: string
  additional_data: string | null
  status: 'draft' | 'approved' | 'published'
  published_at: string | null
  published_url: string | null
  created_at: string
  updated_at: string
}

export interface SocialVariant {
  id: string
  product_id: string
  channel_id: string
  content: string
  status: 'draft' | 'approved' | 'published'
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  product_id: string
  step_id: string | null
  asset_type: AssetType
  r2_key: string | null
  cf_image_id: string | null
  cdn_url: string | null
  filename: string | null
  mime_type: string | null
  file_size_bytes: number | null
  metadata: string | null
  created_at: string
}

export type AssetType = 
  | 'image_design'
  | 'image_mockup'
  | 'pdf'
  | 'audio'
  | 'export'
  | 'thumbnail'

export interface UserInput {
  language: string
  niche?: string
  product_name?: string
  description?: string
  keywords?: string
  selected_platform_ids: string[]
  post_to_social: boolean
  selected_social_channel_ids: string[]
  social_posting_mode: 'auto' | 'manual'
  let_ai_price: boolean
  let_ai_audience: boolean
  let_ai_style: boolean
}

export interface RevenueEstimate {
  min: number
  max: number
  currency: string
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
}

export type CreateProductInput = Pick<Product, 'domain_id' | 'category_id' | 'language'> & {
  niche?: string
  name?: string
  user_input?: UserInput
}

export type ProductFilters = {
  status?: ProductStatus
  domain_id?: string
  category_id?: string
  graveyard?: boolean
  limit?: number
  offset?: number
}

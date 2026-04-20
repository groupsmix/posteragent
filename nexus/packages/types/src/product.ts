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

export interface Asset {
  id: string
  product_id: string
  step_id: string | null
  asset_type: 'image_design' | 'image_mockup' | 'pdf' | 'audio' | 'export' | 'thumbnail'
  r2_key: string | null
  cf_image_id: string | null
  cdn_url: string | null
  filename: string | null
  mime_type: string | null
  file_size_bytes: number | null
  metadata: string | null
  created_at: string
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
  status: string
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface TitleVariant {
  id: string
  product_id: string
  platform_id: string | null
  variant_a: string | null
  variant_b: string | null
  variant_c: string | null
  selected: 'a' | 'b' | 'c' | null
  created_at: string
}

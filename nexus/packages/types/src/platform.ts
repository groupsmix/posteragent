export interface Platform {
  id: string
  name: string
  slug: string
  url: string | null
  title_max_chars: number | null
  description_max: number | null
  tag_count: number | null
  tag_max_chars: number | null
  audience: string | null
  tone: string | null
  seo_style: string | null
  description_style: string | null
  cta_style: string | null
  forbidden_words: string | null
  rules_json: string | null
  is_active: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SocialChannel {
  id: string
  name: string
  slug: string
  caption_max_chars: number | null
  hashtag_count: number | null
  tone: string | null
  format: string | null
  content_types: string | null
  posting_mode: 'auto' | 'manual'
  is_active: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  product_id: string
  run_id: string | null
  version: number
  ai_score: number | null
  section_scores: string | null
  decision: 'approved' | 'rejected' | null
  feedback: string | null
  revised_sections: string | null
  reviewed_at: string
}

export interface TrendAlert {
  id: string
  domain_id: string | null
  trend_keyword: string
  trend_score: number | null
  demand_window: string | null
  source: string | null
  suggested_niche: string | null
  status: 'new' | 'dismissed' | 'started'
  detected_at: string
  dismissed_at: string | null
  workflow_id: string | null
}

export interface WinnerPattern {
  id: string
  domain_id: string | null
  category_id: string | null
  pattern_type: string
  pattern_data: string
  confidence: number
  sample_size: number
  created_at: string
  updated_at: string
}

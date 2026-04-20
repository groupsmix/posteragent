export interface Domain {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  domain_id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: number
  created_at: string
}

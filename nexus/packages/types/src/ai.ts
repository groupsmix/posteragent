export type TaskType =
  | 'text_generation'
  | 'text_editing'
  | 'image_generation'
  | 'audio_generation'
  | 'web_search'
  | 'mockup_generation'

export type ModelStatus = 'active' | 'sleeping' | 'rate_limited' | 'error'

export interface AIModel {
  id: string
  name: string
  provider: string
  task_types: TaskType[]
  priority: number
  secretKey: string | null
  endpoint: string
  max_tokens: number
  rate_limit_rpm: number
  cost_per_1k_tokens: number
  status: ModelStatus
  is_free: boolean
}

export interface AIModelStatus {
  model_id: string
  type: ModelStatus
  reset_at?: number
  last_error?: string
  updated_at: string
}

export interface FailoverResult {
  output: string
  model_used: string
  models_tried: string[]
  tokens_used: number
}

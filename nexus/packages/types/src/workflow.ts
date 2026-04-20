export type WorkflowRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type WorkflowStepType =
  | 'research_market'
  | 'research_psychology'
  | 'generate_content'
  | 'generate_image'
  | 'generate_audio'
  | 'seo_format'
  | 'quality_editor'
  | 'quality_buyer_sim'
  | 'quality_competitor'
  | 'quality_ceo'
  | 'platform_variation'
  | 'social_adaptation'
  | 'health_check'
  | 'revenue_estimate'
  | 'mockup'
  | 'humanize'

export type WorkflowStepStatus = 'waiting' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowRun {
  id: string
  product_id: string
  cf_workflow_id: string | null
  status: WorkflowRunStatus
  current_step: string | null
  total_steps: number
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface WorkflowStep {
  id: string
  run_id: string
  step_name: string
  step_type: WorkflowStepType
  step_order: number
  status: WorkflowStepStatus
  ai_model_used: string | null
  ai_models_tried: string | null
  input_data: string | null
  output_data: string | null
  tokens_used: number
  cost_usd: number
  started_at: string | null
  completed_at: string | null
  error: string | null
}

export interface WorkflowStartInput {
  domain_slug: string
  category_slug: string
  user_input: {
    language?: string
    niche?: string
    product_name?: string
    [key: string]: unknown
  }
}

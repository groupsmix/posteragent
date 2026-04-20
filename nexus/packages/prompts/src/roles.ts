/**
 * Role prompts define the specific task context for each workflow step.
 */
export interface RolePrompt {
  id: string
  name: string
  prompt: string
}

export const ROLE_PROMPTS: Record<string, RolePrompt> = {
  market_research: {
    id: 'market_research',
    name: 'Market Research',
    prompt: `Analyze the market for this product niche. Identify:
1. Top 5 competitors and their positioning
2. Price range analysis (low/mid/high)
3. Key search terms buyers use
4. Gaps in current market offerings
5. Buyer pain points not being addressed

Output as structured JSON.`,
  },
  content_generation: {
    id: 'content_generation',
    name: 'Content Generation',
    prompt: `Generate a complete product listing with:
1. Three title variants (A/B/C testing)
2. Full product description (benefit-focused, scannable)
3. Bullet points / key features
4. SEO-optimized tags
5. Suggested pricing with rationale

Follow the platform's specific formatting rules exactly.`,
  },
  quality_review: {
    id: 'quality_review',
    name: 'Quality Review',
    prompt: `Review this product listing against these criteria:
- Title: Clear, keyword-rich, within character limits
- Description: Compelling, scannable, benefit-focused
- Tags: Relevant, specific, not overstuffed
- Price: Competitive within market range
- Platform fit: Matches platform culture and rules
- AI detection: Would this pass as human-written?
- Competitor gap: Does this offer something different?

Score each section 0-10. Provide specific fix suggestions for anything below 7.`,
  },
}

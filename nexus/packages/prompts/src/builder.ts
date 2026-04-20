import { MASTER_SYSTEM_PROMPT } from './master'
import { PERSONAS } from './personas'
import { ROLE_PROMPTS } from './roles'

/**
 * Prompt builder that assembles all layers into a final prompt.
 * Layers are stacked in priority order:
 *   0. Persona
 *   1. Master system prompt
 *   2. Role prompt
 *   3. Domain context
 *   4. Category context
 *   5. Platform rules
 *   6. Winner patterns
 *   7. User input
 */
export interface PromptBuildOptions {
  personaId?: string
  roleId?: string
  domainPrompt?: string
  categoryPrompt?: string
  platformPrompt?: string
  socialPrompt?: string
  winnerPatterns?: string
  userInput?: string
  language?: string
}

export function buildPrompt(options: PromptBuildOptions): string {
  const layers: string[] = []

  // Layer 0: Persona
  if (options.personaId) {
    const persona = PERSONAS[options.personaId]
    if (persona) {
      layers.push(persona.prompt)
    }
  }

  // Layer 1: Master system prompt
  layers.push(MASTER_SYSTEM_PROMPT)

  // Layer 2: Role prompt
  if (options.roleId) {
    const role = ROLE_PROMPTS[options.roleId]
    if (role) {
      layers.push(role.prompt)
    }
  }

  // Layer 3: Domain context
  if (options.domainPrompt) {
    layers.push(`## Domain Context\n${options.domainPrompt}`)
  }

  // Layer 4: Category context
  if (options.categoryPrompt) {
    layers.push(`## Category Context\n${options.categoryPrompt}`)
  }

  // Layer 5: Platform rules
  if (options.platformPrompt) {
    layers.push(`## Platform Rules\n${options.platformPrompt}`)
  }

  // Layer 5b: Social channel rules
  if (options.socialPrompt) {
    layers.push(`## Social Channel Rules\n${options.socialPrompt}`)
  }

  // Layer 6: Winner patterns
  if (options.winnerPatterns) {
    layers.push(`## Winning Patterns (learned from past approvals)\n${options.winnerPatterns}`)
  }

  // Layer 7: User input
  if (options.userInput) {
    layers.push(`## User Input\n${options.userInput}`)
  }

  // Language override
  if (options.language && options.language !== 'en') {
    layers.push(`## Language Requirement\nAll output MUST be in: ${options.language}`)
  }

  return layers.join('\n\n---\n\n')
}

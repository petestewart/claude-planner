/**
 * ContextBuilder - Builds system prompt with project context
 */

import type {
  ProjectContext,
  GenerationMode,
  RequirementSummary,
  DecisionSummary,
  SpecSummary,
} from './types'

/**
 * Builds system prompt with project context
 */
export class ContextBuilder {
  /**
   * Build complete context prompt from project context
   */
  build(context: ProjectContext): string {
    const sections: string[] = []

    sections.push(this.buildHeader(context))
    sections.push(this.buildRequirements(context.requirements))
    sections.push(this.buildDecisions(context.decisions))
    sections.push(this.buildExistingSpecs(context.existingSpecs))
    sections.push(this.buildInstructions(context))

    return sections.filter(Boolean).join('\n\n')
  }

  private buildHeader(context: ProjectContext): string {
    return `# Project Context

**Project:** ${context.projectName}
**Target Language:** ${context.targetLanguage}
**Generation Mode:** ${context.generationMode}
**Root Path:** ${context.rootPath}`
  }

  private buildRequirements(requirements: RequirementSummary[]): string {
    if (!requirements.length) return ''

    const lines = ['## Requirements Gathered']
    for (const req of requirements) {
      lines.push(`\n### ${req.category}`)
      for (const item of req.items) {
        lines.push(`- ${item}`)
      }
    }
    return lines.join('\n')
  }

  private buildDecisions(decisions: DecisionSummary[]): string {
    if (!decisions.length) return ''

    const lines = ['## Decisions Made']
    for (const dec of decisions) {
      lines.push(`- **${dec.topic}:** ${dec.choice}`)
    }
    return lines.join('\n')
  }

  private buildExistingSpecs(specs: SpecSummary[]): string {
    if (!specs.length) return ''

    const lines = ['## Existing Spec Files']
    for (const spec of specs) {
      const status = spec.status === 'draft' ? ' (draft)' : ''
      lines.push(`- ${spec.path}: ${spec.title}${status}`)
    }
    return lines.join('\n')
  }

  private buildInstructions(context: ProjectContext): string {
    return `## Instructions

You are helping design specifications for the "${context.projectName}" project.

Generation Mode: **${context.generationMode}**
${this.getModeInstructions(context.generationMode)}

When generating spec files, follow the structure from DESIGN_PHILOSOPHY.md:
- CLAUDE.md for agent guidelines
- specs/README.md for spec index
- specs/[feature].md for feature specifications
- PLAN.md for implementation phases

Always generate code examples in ${context.targetLanguage}.`
  }

  private getModeInstructions(mode: GenerationMode): string {
    switch (mode) {
      case 'incremental':
        return `- Generate one file at a time
- Wait for user approval before proceeding
- Ask clarifying questions as needed`

      case 'all-at-once':
        return `- Generate all spec files in sequence
- Provide a summary of generated files
- User can review and request changes after`

      case 'draft-then-refine':
        return `- Generate all files as drafts
- Mark files with [DRAFT] status
- Iterate based on user feedback`
    }
  }
}

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
 * Options for building context
 */
export interface ContextBuilderOptions {
  /** Maximum context size in characters (default: 16000) */
  maxSize?: number
  /** Maximum number of requirements per category to include (default: 20) */
  maxRequirementsPerCategory?: number
  /** Maximum number of decisions to include (default: 30) */
  maxDecisions?: number
  /** Maximum number of specs to include (default: 30) */
  maxSpecs?: number
}

const DEFAULT_OPTIONS: Required<ContextBuilderOptions> = {
  maxSize: 16000,
  maxRequirementsPerCategory: 20,
  maxDecisions: 30,
  maxSpecs: 30,
}

/**
 * Builds system prompt with project context
 */
export class ContextBuilder {
  private options: Required<ContextBuilderOptions>

  constructor(options: ContextBuilderOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Build complete context prompt from project context
   * Automatically summarizes if context exceeds size limits
   */
  build(context: ProjectContext): string {
    // First, try building full context
    let result = this.buildFull(context)

    // If too large, build summarized version
    if (result.length > this.options.maxSize) {
      result = this.buildSummarized(context)
    }

    return result
  }

  /**
   * Build full context without truncation
   */
  private buildFull(context: ProjectContext): string {
    const sections: string[] = []

    sections.push(this.buildHeader(context))
    sections.push(this.buildRequirements(context.requirements))
    sections.push(this.buildDecisions(context.decisions))
    sections.push(this.buildExistingSpecs(context.existingSpecs))
    sections.push(this.buildInstructions(context))

    return sections.filter(Boolean).join('\n\n')
  }

  /**
   * Build summarized context when full context is too large
   */
  private buildSummarized(context: ProjectContext): string {
    const sections: string[] = []

    sections.push(this.buildHeader(context))
    sections.push(this.buildRequirementsSummarized(context.requirements))
    sections.push(this.buildDecisionsSummarized(context.decisions))
    sections.push(this.buildExistingSpecsSummarized(context.existingSpecs))
    sections.push(this.buildInstructions(context))
    sections.push(this.buildTruncationNotice(context))

    return sections.filter(Boolean).join('\n\n')
  }

  /**
   * Build truncation notice when context was summarized
   */
  private buildTruncationNotice(context: ProjectContext): string {
    const totalReqs = context.requirements.reduce((sum, r) => sum + r.items.length, 0)
    const totalDecs = context.decisions.length
    const totalSpecs = context.existingSpecs.length

    const notices: string[] = []

    if (totalReqs > this.options.maxRequirementsPerCategory * context.requirements.length) {
      notices.push(`${totalReqs} total requirements (showing most recent)`)
    }
    if (totalDecs > this.options.maxDecisions) {
      notices.push(`${totalDecs} total decisions (showing most recent ${this.options.maxDecisions})`)
    }
    if (totalSpecs > this.options.maxSpecs) {
      notices.push(`${totalSpecs} total specs (showing most recent ${this.options.maxSpecs})`)
    }

    if (notices.length === 0) return ''

    return `*Note: Context was summarized due to size limits. Full data: ${notices.join(', ')}*`
  }

  /**
   * Build summarized requirements with truncation
   */
  private buildRequirementsSummarized(requirements: RequirementSummary[]): string {
    if (!requirements.length) return ''

    const lines = ['## Requirements Gathered (Summary)']
    for (const req of requirements) {
      lines.push(`\n### ${req.category}`)
      const itemsToShow = req.items.slice(-this.options.maxRequirementsPerCategory)
      for (const item of itemsToShow) {
        lines.push(`- ${item}`)
      }
      if (req.items.length > this.options.maxRequirementsPerCategory) {
        lines.push(`- *(${req.items.length - this.options.maxRequirementsPerCategory} earlier items omitted)*`)
      }
    }
    return lines.join('\n')
  }

  /**
   * Build summarized decisions with truncation
   */
  private buildDecisionsSummarized(decisions: DecisionSummary[]): string {
    if (!decisions.length) return ''

    const lines = ['## Decisions Made (Summary)']
    const decisionsToShow = decisions.slice(-this.options.maxDecisions)
    for (const dec of decisionsToShow) {
      lines.push(`- **${dec.topic}:** ${dec.choice}`)
    }
    if (decisions.length > this.options.maxDecisions) {
      lines.push(`*(${decisions.length - this.options.maxDecisions} earlier decisions omitted)*`)
    }
    return lines.join('\n')
  }

  /**
   * Build summarized existing specs with truncation
   */
  private buildExistingSpecsSummarized(specs: SpecSummary[]): string {
    if (!specs.length) return ''

    const lines = ['## Existing Spec Files (Summary)']
    const specsToShow = specs.slice(-this.options.maxSpecs)
    for (const spec of specsToShow) {
      const status = spec.status === 'draft' ? ' (draft)' : ''
      lines.push(`- ${spec.path}: ${spec.title}${status}`)
    }
    if (specs.length > this.options.maxSpecs) {
      lines.push(`*(${specs.length - this.options.maxSpecs} earlier specs omitted)*`)
    }
    return lines.join('\n')
  }

  /**
   * Get the estimated size of the context
   */
  estimateSize(context: ProjectContext): number {
    return this.buildFull(context).length
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

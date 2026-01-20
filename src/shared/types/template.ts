import type { GenerationMode } from './project'

/**
 * Template category for classification
 */
export type TemplateCategory =
  | 'web-app'
  | 'cli-tool'
  | 'library'
  | 'api-service'
  | 'mobile-app'
  | 'desktop-app'
  | 'other'

/**
 * Template metadata for display in lists
 */
export interface TemplateInfo {
  /** Unique template identifier */
  id: string
  /** Display name */
  name: string
  /** Brief description */
  description: string
  /** Template category */
  category: TemplateCategory
  /** Whether this is a built-in template */
  isBuiltIn: boolean
  /** Tags for filtering */
  tags: string[]
}

/**
 * Full template definition with content and configuration
 */
export interface Template extends TemplateInfo {
  /** Author (for custom templates) */
  author?: string
  /** Version string */
  version: string
  /** When template was created */
  createdAt: string
  /** When template was last modified */
  updatedAt: string
  /** Files included in this template */
  files: TemplateFile[]
  /** Variables required by this template */
  variables: TemplateVariable[]
  /** Question flow for requirements gathering */
  questionFlow: QuestionSection[]
  /** Default generation mode */
  defaultGenerationMode: GenerationMode
}

/**
 * A file within the template
 */
export interface TemplateFile {
  /** Output file path (can use variables) */
  outputPath: string
  /** Handlebars template content or path to .hbs file */
  template: string
  /** File description */
  description: string
  /** Whether file is required or optional */
  required: boolean
}

/**
 * Variable that can be substituted in templates
 */
export interface TemplateVariable {
  /** Variable name (used as {{name}} in templates) */
  name: string
  /** Display label */
  label: string
  /** Variable type */
  type: 'string' | 'boolean' | 'array' | 'select' | 'multiline'
  /** Default value */
  default?: unknown
  /** Options for select type */
  options?: { value: string; label: string }[]
  /** Whether variable is required */
  required: boolean
  /** Help text */
  description?: string
}

/**
 * Section of questions for requirements gathering
 */
export interface QuestionSection {
  /** Section identifier */
  id: string
  /** Section title */
  title: string
  /** Questions in this section */
  questions: TemplateQuestion[]
  /** Condition for showing this section */
  condition?: QuestionCondition
}

/**
 * A question to ask during requirements gathering
 */
export interface TemplateQuestion {
  /** Question identifier */
  id: string
  /** Question text */
  text: string
  /** Type of response expected */
  type: 'text' | 'multiline' | 'select' | 'multiselect' | 'boolean'
  /** Options for select/multiselect */
  options?: { value: string; label: string }[]
  /** Variable to store answer in */
  variable: string
  /** Whether question is required */
  required: boolean
  /** Follow-up prompt for Claude to elaborate */
  followUpPrompt?: string
  /** Condition for showing this question */
  condition?: QuestionCondition
}

/**
 * Condition for conditional questions/sections
 */
export interface QuestionCondition {
  /** Variable to check */
  variable: string
  /** Operator */
  operator: 'equals' | 'notEquals' | 'contains' | 'notEmpty'
  /** Value to compare against */
  value?: unknown
}

/**
 * Result of rendering a template
 */
export interface RenderedTemplate {
  files: RenderedFile[]
}

/**
 * A rendered file ready to be written
 */
export interface RenderedFile {
  path: string
  content: string
}

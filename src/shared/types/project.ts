/**
 * Represents the current state of a spec project
 * Used for context management with Claude
 */
export interface ProjectState {
  /** Unique project identifier */
  id: string

  /** Project root directory path */
  rootPath: string

  /** User-provided project name */
  name: string

  /** Target programming language for code examples */
  targetLanguage: string

  /** Selected template ID */
  templateId: string

  /** High-level requirements gathered from conversation */
  requirements: Requirement[]

  /** Decisions made during conversation */
  decisions: Decision[]

  /** Generated spec files */
  generatedFiles: GeneratedFile[]

  /** Current generation mode */
  generationMode: GenerationMode

  /** Git configuration */
  gitConfig: GitConfig

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

export interface Requirement {
  id: string
  category: 'functional' | 'non-functional' | 'constraint'
  description: string
  priority: 'must' | 'should' | 'could'
  source: 'user' | 'agent-inferred'
}

export interface Decision {
  id: string
  topic: string
  choice: string
  rationale: string
  timestamp: string
}

export interface GeneratedFile {
  path: string
  status: 'draft' | 'approved' | 'modified'
  lastGenerated: string
  lastModified: string
}

export type GenerationMode = 'incremental' | 'all-at-once' | 'draft-then-refine'

export interface GitConfig {
  enabled: boolean
  autoCommit: boolean
  initialized: boolean
}

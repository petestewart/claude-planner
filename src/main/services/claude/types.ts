/**
 * Claude service type definitions
 */

/**
 * Claude service configuration
 */
export interface ClaudeServiceOptions {
  /** Path to Claude CLI executable (default: 'claude') */
  cliPath?: string

  /** Working directory for CLI execution */
  workingDirectory: string

  /** Timeout for response in ms (default: 300000 = 5 min) */
  timeout?: number

  /** Enable verbose logging */
  debug?: boolean
}

/**
 * Generation mode for spec creation
 */
export type GenerationMode = 'incremental' | 'all-at-once' | 'draft-then-refine'

/**
 * Requirement summary for context
 */
export interface RequirementSummary {
  category: string
  items: string[]
}

/**
 * Decision summary for context
 */
export interface DecisionSummary {
  topic: string
  choice: string
}

/**
 * Spec file summary for context
 */
export interface SpecSummary {
  path: string
  title: string
  status: 'draft' | 'complete'
}

/**
 * Project context sent with each message
 */
export interface ProjectContext {
  /** Project identifier */
  projectId: string

  /** Project name */
  projectName: string

  /** Root directory path */
  rootPath: string

  /** Target programming language */
  targetLanguage: string

  /** Current generation mode */
  generationMode: GenerationMode

  /** Summary of requirements gathered */
  requirements: RequirementSummary[]

  /** Key decisions made */
  decisions: DecisionSummary[]

  /** Existing spec files (paths and brief summaries) */
  existingSpecs: SpecSummary[]
}

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  /** Project context to include */
  context?: ProjectContext

  /** System prompt override */
  systemPrompt?: string

  /** Files to include in context */
  includeFiles?: string[]

  /** Session ID for conversation continuity */
  sessionId?: string

  /** Whether this is a continuation of an existing session */
  continueSession?: boolean
}

/**
 * Current service status
 */
export interface ClaudeStatus {
  /** Whether service is ready */
  ready: boolean

  /** Current state */
  state: 'idle' | 'sending' | 'streaming' | 'error'

  /** Error message if state is 'error' */
  errorMessage?: string

  /** CLI version if detected */
  cliVersion?: string
}

/**
 * Events emitted during response streaming
 */
export type StreamEvent =
  | { type: 'start'; timestamp: string }
  | { type: 'text'; content: string }
  | { type: 'file_start'; path: string; action: 'create' | 'modify' | 'delete' }
  | { type: 'file_content'; path: string; content: string }
  | { type: 'file_end'; path: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_use'; tool: string; input: unknown }
  | { type: 'complete'; timestamp: string }
  | { type: 'error'; message: string; code?: string }

/**
 * Parsed file change from stream
 */
export interface FileChange {
  path: string
  action: 'create' | 'modify' | 'delete'
  content?: string
}

/**
 * Main service interface
 */
export interface ClaudeService {
  /** Send a message and get streaming response */
  sendMessage(
    message: string,
    options?: SendMessageOptions
  ): AsyncGenerator<StreamEvent>

  /** Cancel current request */
  cancel(): Promise<void>

  /** Get current service status */
  getStatus(): ClaudeStatus

  /** Check if CLI is available */
  checkAvailability(): Promise<boolean>

  /** Dispose resources */
  dispose(): void
}

/**
 * Error codes for Claude service errors
 */
export type ClaudeErrorCode =
  | 'NOT_AVAILABLE'
  | 'BUSY'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'CLI_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN'

/**
 * Claude service errors
 */
export class ClaudeServiceError extends Error {
  constructor(
    message: string,
    public code: ClaudeErrorCode
  ) {
    super(message)
    this.name = 'ClaudeServiceError'
  }
}

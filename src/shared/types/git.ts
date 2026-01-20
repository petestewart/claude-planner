/**
 * Git repository status
 */
export interface GitStatus {
  branch: string
  staged: GitFileChange[]
  unstaged: GitFileChange[]
  untracked: string[]
  ahead: number
  behind: number
}

export interface GitFileChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  oldPath?: string // For renamed files
}

/**
 * Claude service status
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
 * Events emitted during Claude response streaming
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
 * Init options for Claude service
 */
export interface ClaudeInitOptions {
  workingDirectory: string
  cliPath?: string
  debug?: boolean
}

/**
 * Init result from Claude service
 */
export interface ClaudeInitResult {
  available: boolean
  status: ClaudeStatus
}

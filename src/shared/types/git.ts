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
  available: boolean
  version?: string
  error?: string
}

/**
 * Git Service Types
 *
 * Type definitions for the git integration service.
 * This service has NO Electron dependencies and can be extracted
 * as a standalone module.
 */

/**
 * Git service configuration
 */
export interface GitServiceOptions {
  /** Repository root directory */
  cwd: string

  /** Enable automatic commits (default: false) */
  autoCommit?: boolean

  /** Auto-commit delay in ms (default: 5000) */
  autoCommitDelay?: number

  /** Default commit message template */
  commitMessageTemplate?: string

  /** Git executable path (default: 'git') */
  gitPath?: string

  /** Enable debug logging */
  debug?: boolean
}

/**
 * Main service interface
 */
export interface GitService {
  /** Initialize a new git repository */
  init(): Promise<void>

  /** Check if directory is a git repository */
  isRepo(): Promise<boolean>

  /** Get repository status */
  getStatus(): Promise<GitStatus>

  /** Stage files for commit */
  stage(files: string[]): Promise<void>

  /** Stage all changes */
  stageAll(): Promise<void>

  /** Unstage files */
  unstage(files: string[]): Promise<void>

  /** Create a commit */
  commit(message: string): Promise<CommitInfo>

  /** Get diff for file(s) */
  diff(options?: DiffOptions): Promise<FileDiff[]>

  /** Get recent commits */
  log(limit?: number): Promise<CommitInfo[]>

  /** Set auto-commit enabled */
  setAutoCommit(enabled: boolean): void

  /** Trigger auto-commit check (debounced) */
  triggerAutoCommit(): void

  /** Dispose resources */
  dispose(): void
}

/**
 * Repository status
 */
export interface GitStatus {
  /** Is this a git repository */
  isRepo: boolean

  /** Current branch name */
  branch: string | null

  /** Staged files */
  staged: FileStatus[]

  /** Modified but unstaged files */
  modified: FileStatus[]

  /** Untracked files */
  untracked: string[]

  /** Whether there are uncommitted changes */
  isDirty: boolean
}

/**
 * Status of a single file
 */
export interface FileStatus {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  oldPath?: string // For renamed/copied
}

/**
 * Options for getting diffs
 */
export interface DiffOptions {
  /** Specific files to diff (default: all) */
  files?: string[]

  /** Include staged changes */
  staged?: boolean

  /** Compare against specific commit */
  commit?: string

  /** Number of context lines (default: 3) */
  contextLines?: number
}

/**
 * Diff for a single file
 */
export interface FileDiff {
  /** File path */
  path: string

  /** Old path (if renamed) */
  oldPath?: string

  /** Change type */
  type: 'added' | 'modified' | 'deleted' | 'renamed'

  /** Diff hunks */
  hunks: DiffHunk[]

  /** Raw diff text */
  raw: string
}

/**
 * A hunk in a diff
 */
export interface DiffHunk {
  /** Starting line in old file */
  oldStart: number

  /** Number of lines in old file */
  oldLines: number

  /** Starting line in new file */
  newStart: number

  /** Number of lines in new file */
  newLines: number

  /** Lines in the hunk */
  lines: DiffLine[]
}

/**
 * A single line in a diff
 */
export interface DiffLine {
  type: 'context' | 'add' | 'delete'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

/**
 * Information about a commit
 */
export interface CommitInfo {
  /** Commit hash (full) */
  hash: string

  /** Short hash */
  shortHash: string

  /** Commit message */
  message: string

  /** Author name */
  authorName: string

  /** Author email */
  authorEmail: string

  /** Commit timestamp */
  timestamp: string

  /** Files changed in this commit */
  files?: string[]
}

/**
 * Git configuration stored in project state
 */
export interface GitConfig {
  /** Whether git integration is enabled */
  enabled: boolean

  /** Auto-commit on file changes */
  autoCommit: boolean

  /** Auto-commit delay in ms */
  autoCommitDelay: number

  /** Commit message template */
  commitMessageTemplate: string
}

/**
 * Default git configuration
 */
export const DEFAULT_GIT_CONFIG: GitConfig = {
  enabled: true,
  autoCommit: false,
  autoCommitDelay: 5000,
  commitMessageTemplate: 'Update specs',
}

/**
 * Git error codes
 */
export type GitErrorCode =
  | 'NOT_REPO'
  | 'NOT_INITIALIZED'
  | 'COMMAND_FAILED'
  | 'MERGE_CONFLICT'
  | 'UNKNOWN'

/**
 * Git-specific errors
 */
export class GitServiceError extends Error {
  constructor(
    message: string,
    public code: GitErrorCode
  ) {
    super(message)
    this.name = 'GitServiceError'
  }
}

/**
 * Git command execution error
 */
export class GitExecutionError extends Error {
  constructor(
    public command: string[],
    public exitCode: number | null,
    public stderr: string
  ) {
    super(`Git command failed: git ${command.join(' ')}\n${stderr}`)
    this.name = 'GitExecutionError'
  }
}

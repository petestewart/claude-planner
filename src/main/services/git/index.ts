/**
 * Git Service Module
 *
 * This module has NO Electron dependencies and can be extracted
 * as @spec-planner/git-service
 */

export { createGitService } from './git-service'
export { GitExecutor } from './git-executor'
export { DiffParser } from './diff-parser'

export type {
  GitService,
  GitServiceOptions,
  GitStatus,
  FileStatus,
  CommitInfo,
  DiffOptions,
  FileDiff,
  DiffHunk,
  DiffLine,
  GitConfig,
  GitErrorCode,
} from './types'

export { GitServiceError, GitExecutionError, DEFAULT_GIT_CONFIG } from './types'

/**
 * Claude Service Module
 *
 * This module is designed to be extractable as a standalone module.
 * It has no direct Electron dependencies - only Node.js APIs.
 */

export { createClaudeService } from './claude-service'
export { ProcessManager } from './process-manager'
export { StreamParser } from './stream-parser'
export { ContextBuilder } from './context-builder'

export type {
  ClaudeService,
  ClaudeServiceOptions,
  ClaudeStatus,
  SendMessageOptions,
  StreamEvent,
  ProjectContext,
  GenerationMode,
  RequirementSummary,
  DecisionSummary,
  SpecSummary,
  FileChange,
  ClaudeErrorCode,
} from './types'

export { ClaudeServiceError } from './types'

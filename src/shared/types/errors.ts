/**
 * Base error class for Spec Planner
 */
export class SpecPlannerError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SpecPlannerError'
  }
}

export class FileOperationError extends SpecPlannerError {
  constructor(
    message: string,
    public path: string,
    public operation: string
  ) {
    super(message, 'FILE_OPERATION_ERROR', { path, operation })
    this.name = 'FileOperationError'
  }
}

export class ClaudeServiceError extends SpecPlannerError {
  constructor(
    message: string,
    public exitCode?: number
  ) {
    super(message, 'CLAUDE_SERVICE_ERROR', { exitCode })
    this.name = 'ClaudeServiceError'
  }
}

export class GitOperationError extends SpecPlannerError {
  constructor(
    message: string,
    public command: string
  ) {
    super(message, 'GIT_OPERATION_ERROR', { command })
    this.name = 'GitOperationError'
  }
}

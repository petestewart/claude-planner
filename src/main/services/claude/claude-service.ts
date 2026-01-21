/**
 * ClaudeService - Main service implementation for Claude CLI integration
 */

import type {
  ClaudeService,
  ClaudeServiceOptions,
  ClaudeStatus,
  StreamEvent,
  SendMessageOptions,
  ProjectContext,
} from './types'
import { ClaudeServiceError } from './types'
import { ProcessManager } from './process-manager'
import { StreamParser } from './stream-parser'
import { ContextBuilder } from './context-builder'

const DEFAULT_TIMEOUT = 300000 // 5 minutes

/**
 * Claude service implementation
 */
class ClaudeServiceImpl implements ClaudeService {
  private processManager: ProcessManager
  private status: ClaudeStatus
  private currentAbortController: AbortController | null = null
  private contextBuilder: ContextBuilder

  constructor(private options: ClaudeServiceOptions) {
    this.processManager = new ProcessManager(options.cliPath ?? 'claude')
    this.contextBuilder = new ContextBuilder()
    this.status = { ready: false, state: 'idle' }
  }

  async *sendMessage(
    message: string,
    options?: SendMessageOptions
  ): AsyncGenerator<StreamEvent> {
    if (this.status.state !== 'idle') {
      throw new ClaudeServiceError('Service is busy', 'BUSY')
    }

    this.currentAbortController = new AbortController()
    this.status.state = 'sending'

    const parser = new StreamParser()

    try {
      // Build command with context
      const args = this.buildCommand(message, options)

      if (this.options.debug) {
        console.warn('[ClaudeService] Running:', this.options.cliPath ?? 'claude', args.join(' '))
      }

      // Yield start event
      yield { type: 'start', timestamp: new Date().toISOString() }
      this.status.state = 'streaming'

      // Spawn process and get stream
      const stream = this.processManager.spawn(args, {
        cwd: this.options.workingDirectory,
        signal: this.currentAbortController.signal,
        timeout: this.options.timeout ?? DEFAULT_TIMEOUT,
      })

      // Parse and yield events from stream
      for await (const chunk of stream) {
        if (this.options.debug) {
          console.warn('[ClaudeService] Chunk:', chunk)
        }

        const events = parser.parse(chunk)
        for (const event of events) {
          yield event
        }
      }

      // Flush any remaining buffered content
      const flushEvents = parser.flush()
      for (const event of flushEvents) {
        yield event
      }

      // Yield complete event
      yield { type: 'complete', timestamp: new Date().toISOString() }
    } catch (error) {
      if (error instanceof ClaudeServiceError && error.code === 'CANCELLED') {
        yield { type: 'error', message: 'Request cancelled', code: 'CANCELLED' }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        yield { type: 'error', message: errorMessage, code: 'UNKNOWN' }
        this.status.state = 'error'
        this.status.errorMessage = errorMessage
      }
    } finally {
      if (this.status.state !== 'error') {
        this.status.state = 'idle'
      }
      this.currentAbortController = null
    }
  }

  async cancel(): Promise<void> {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
    }
  }

  getStatus(): ClaudeStatus {
    return { ...this.status }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const result = await this.processManager.checkAvailability()
      this.status.ready = result.available
      if (result.version) {
        this.status.cliVersion = result.version
      }
      return result.available
    } catch {
      this.status.ready = false
      return false
    }
  }

  dispose(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
    }
    this.processManager.kill()
  }

  private buildCommand(
    message: string,
    options?: SendMessageOptions
  ): string[] {
    // Build command arguments for Claude CLI
    // Use --print flag for non-interactive mode and stream-json for structured output
    // Note: --verbose is required when using --print with stream-json
    const args: string[] = ['--print', '--output-format', 'stream-json', '--verbose']

    // Add context via system prompt if provided
    if (options?.context) {
      const contextPrompt = this.buildContextPrompt(options.context)
      args.push('--system-prompt', contextPrompt)
    } else if (options?.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt)
    }

    // Add files to include in context
    if (options?.includeFiles?.length) {
      for (const file of options.includeFiles) {
        args.push('--add-dir', file)
      }
    }

    // Add the message as the final argument
    args.push(message)

    return args
  }

  private buildContextPrompt(context: ProjectContext): string {
    return this.contextBuilder.build(context)
  }
}

/**
 * Factory function for creating Claude service
 */
export function createClaudeService(
  options: ClaudeServiceOptions
): ClaudeService {
  return new ClaudeServiceImpl(options)
}

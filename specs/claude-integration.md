# Claude Integration

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Manage interaction with Claude Code CLI as a subprocess, handling message sending, response streaming, file change detection, and context management.

### Goals
- Spawn and manage Claude Code CLI process
- Stream responses in real-time to the UI
- Parse file changes from CLI output
- Maintain project context across conversations
- Support cancellation of in-progress requests
- Design for future extraction as standalone module

### Non-Goals
- Direct Anthropic API integration (future consideration)
- Multiple simultaneous conversations
- Conversation branching or history management beyond current session

## 2. Architecture

### Component Structure

```
src/main/services/claude/
├── index.ts                    # Public exports, factory function
├── types.ts                    # Type definitions
├── claude-service.ts           # Main service implementation
├── process-manager.ts          # Subprocess lifecycle
├── stream-parser.ts            # Parse CLI output
├── context-builder.ts          # Build context for prompts
└── __tests__/
    ├── claude-service.test.ts
    ├── stream-parser.test.ts
    └── context-builder.test.ts
```

### Service Extraction Pattern

```typescript
// This service is designed to be extractable as a standalone module
// It has no direct Electron dependencies - only Node.js APIs

// index.ts
export { createClaudeService } from './claude-service'
export type {
  ClaudeService,
  ClaudeServiceOptions,
  SendMessageOptions,
  StreamEvent,
  ClaudeStatus,
} from './types'
```

### Data Flow

```
┌─────────────────┐
│  Renderer IPC   │ ── claude:send(message, context)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IPC Handler    │ ── validates, routes to service
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ClaudeService   │ ── orchestrates send flow
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ProcessManager  │ ── spawns CLI, manages lifecycle
└────────┬────────┘
         │ stdout
         ▼
┌─────────────────┐
│  StreamParser   │ ── extracts text, file changes
└────────┬────────┘
         │ StreamEvent
         ▼
┌─────────────────┐
│  IPC Handler    │ ── emits claude:stream events
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Renderer       │ ── updates ChatStore
└─────────────────┘
```

## 3. Core Types

### 3.1 Service Types

```typescript
/**
 * Claude service configuration
 */
interface ClaudeServiceOptions {
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
 * Main service interface
 */
interface ClaudeService {
  /** Send a message and get streaming response */
  sendMessage(message: string, options?: SendMessageOptions): AsyncIterable<StreamEvent>

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
 * Options for sending a message
 */
interface SendMessageOptions {
  /** Project context to include */
  context?: ProjectContext

  /** System prompt override */
  systemPrompt?: string

  /** Files to include in context */
  includeFiles?: string[]
}

/**
 * Current service status
 */
interface ClaudeStatus {
  /** Whether service is ready */
  ready: boolean

  /** Current state */
  state: 'idle' | 'sending' | 'streaming' | 'error'

  /** Error message if state is 'error' */
  errorMessage?: string

  /** CLI version if detected */
  cliVersion?: string
}
```

### 3.2 Stream Types

```typescript
/**
 * Events emitted during response streaming
 */
type StreamEvent =
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
interface FileChange {
  path: string
  action: 'create' | 'modify' | 'delete'
  content?: string
}
```

### 3.3 Context Types

```typescript
/**
 * Project context sent with each message
 */
interface ProjectContext {
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

interface RequirementSummary {
  category: string
  items: string[]
}

interface DecisionSummary {
  topic: string
  choice: string
}

interface SpecSummary {
  path: string
  title: string
  status: 'draft' | 'complete'
}
```

## 4. Components

### 4.1 ClaudeService

```typescript
/**
 * Factory function for creating Claude service
 */
function createClaudeService(options: ClaudeServiceOptions): ClaudeService {
  return new ClaudeServiceImpl(options)
}

class ClaudeServiceImpl implements ClaudeService {
  private processManager: ProcessManager
  private status: ClaudeStatus
  private currentAbortController: AbortController | null = null

  constructor(private options: ClaudeServiceOptions) {
    this.processManager = new ProcessManager(options.cliPath ?? 'claude')
    this.status = { ready: false, state: 'idle' }
  }

  async *sendMessage(
    message: string,
    options?: SendMessageOptions
  ): AsyncIterable<StreamEvent> {
    if (this.status.state !== 'idle') {
      throw new ClaudeServiceError('Service is busy', 'BUSY')
    }

    this.currentAbortController = new AbortController()
    this.status.state = 'sending'

    try {
      // Build command with context
      const command = this.buildCommand(message, options)

      // Spawn process and get stream
      const stream = this.processManager.spawn(command, {
        cwd: this.options.workingDirectory,
        signal: this.currentAbortController.signal,
      })

      yield { type: 'start', timestamp: new Date().toISOString() }
      this.status.state = 'streaming'

      // Parse and yield events from stream
      const parser = new StreamParser()
      for await (const chunk of stream) {
        const events = parser.parse(chunk)
        for (const event of events) {
          yield event
        }
      }

      yield { type: 'complete', timestamp: new Date().toISOString() }
    } catch (error) {
      if (error.name === 'AbortError') {
        yield { type: 'error', message: 'Request cancelled', code: 'CANCELLED' }
      } else {
        yield { type: 'error', message: error.message, code: 'UNKNOWN' }
      }
    } finally {
      this.status.state = 'idle'
      this.currentAbortController = null
    }
  }

  async cancel(): Promise<void> {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
    }
  }

  private buildCommand(message: string, options?: SendMessageOptions): string[] {
    const args: string[] = ['--print', '--output-format', 'stream-json']

    if (options?.context) {
      // Add context via system prompt or file
      const contextPrompt = this.buildContextPrompt(options.context)
      args.push('--system-prompt', contextPrompt)
    }

    if (options?.includeFiles?.length) {
      for (const file of options.includeFiles) {
        args.push('--file', file)
      }
    }

    args.push(message)
    return args
  }

  private buildContextPrompt(context: ProjectContext): string {
    return new ContextBuilder().build(context)
  }
}
```

### 4.2 ProcessManager

```typescript
/**
 * Manages Claude CLI subprocess lifecycle
 */
class ProcessManager {
  private currentProcess: ChildProcess | null = null

  constructor(private cliPath: string) {}

  /**
   * Spawn CLI process and return async iterator of stdout chunks
   */
  async *spawn(
    args: string[],
    options: { cwd: string; signal: AbortSignal }
  ): AsyncIterable<string> {
    const process = spawn(this.cliPath, args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.currentProcess = process

    // Handle abort signal
    const abortHandler = () => {
      process.kill('SIGTERM')
    }
    options.signal.addEventListener('abort', abortHandler)

    try {
      // Yield stdout chunks as they arrive
      for await (const chunk of process.stdout) {
        yield chunk.toString()
      }

      // Check exit code
      const exitCode = await new Promise<number>((resolve) => {
        process.on('close', resolve)
      })

      if (exitCode !== 0) {
        const stderr = await this.collectStderr(process)
        throw new ClaudeServiceError(
          `CLI exited with code ${exitCode}: ${stderr}`,
          'CLI_ERROR'
        )
      }
    } finally {
      options.signal.removeEventListener('abort', abortHandler)
      this.currentProcess = null
    }
  }

  private async collectStderr(process: ChildProcess): Promise<string> {
    const chunks: string[] = []
    for await (const chunk of process.stderr) {
      chunks.push(chunk.toString())
    }
    return chunks.join('')
  }
}
```

### 4.3 StreamParser

```typescript
/**
 * Parses Claude CLI stream-json output into structured events
 */
class StreamParser {
  private buffer = ''
  private currentFile: { path: string; action: string; content: string[] } | null = null

  /**
   * Parse a chunk of CLI output and return events
   */
  parse(chunk: string): StreamEvent[] {
    this.buffer += chunk
    const events: StreamEvent[] = []

    // Process complete lines
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? '' // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const event = this.parseLine(line)
        if (event) {
          events.push(event)
        }
      } catch (error) {
        // Log parse error but continue
        console.warn('Failed to parse stream line:', line, error)
      }
    }

    return events
  }

  private parseLine(line: string): StreamEvent | null {
    // CLI stream-json format
    const json = JSON.parse(line)

    switch (json.type) {
      case 'assistant_text':
        return { type: 'text', content: json.text }

      case 'thinking':
        return { type: 'thinking', content: json.text }

      case 'tool_use':
        return this.handleToolUse(json)

      case 'result':
        // Final result, may contain file changes
        return null

      default:
        return null
    }
  }

  private handleToolUse(json: any): StreamEvent | null {
    const { tool, input } = json

    // Detect file operations
    if (tool === 'write_file' || tool === 'edit_file') {
      return {
        type: 'file_start',
        path: input.path,
        action: tool === 'write_file' ? 'create' : 'modify',
      }
    }

    return { type: 'tool_use', tool, input }
  }
}
```

### 4.4 ContextBuilder

```typescript
/**
 * Builds system prompt with project context
 */
class ContextBuilder {
  build(context: ProjectContext): string {
    const sections: string[] = []

    sections.push(this.buildHeader(context))
    sections.push(this.buildRequirements(context.requirements))
    sections.push(this.buildDecisions(context.decisions))
    sections.push(this.buildExistingSpecs(context.existingSpecs))
    sections.push(this.buildInstructions(context))

    return sections.filter(Boolean).join('\n\n')
  }

  private buildHeader(context: ProjectContext): string {
    return `# Project Context

**Project:** ${context.projectName}
**Target Language:** ${context.targetLanguage}
**Generation Mode:** ${context.generationMode}
**Root Path:** ${context.rootPath}`
  }

  private buildRequirements(requirements: RequirementSummary[]): string {
    if (!requirements.length) return ''

    const lines = ['## Requirements Gathered']
    for (const req of requirements) {
      lines.push(`\n### ${req.category}`)
      for (const item of req.items) {
        lines.push(`- ${item}`)
      }
    }
    return lines.join('\n')
  }

  private buildDecisions(decisions: DecisionSummary[]): string {
    if (!decisions.length) return ''

    const lines = ['## Decisions Made']
    for (const dec of decisions) {
      lines.push(`- **${dec.topic}:** ${dec.choice}`)
    }
    return lines.join('\n')
  }

  private buildExistingSpecs(specs: SpecSummary[]): string {
    if (!specs.length) return ''

    const lines = ['## Existing Spec Files']
    for (const spec of specs) {
      const status = spec.status === 'draft' ? ' (draft)' : ''
      lines.push(`- ${spec.path}: ${spec.title}${status}`)
    }
    return lines.join('\n')
  }

  private buildInstructions(context: ProjectContext): string {
    return `## Instructions

You are helping design specifications for the "${context.projectName}" project.

Generation Mode: **${context.generationMode}**
${this.getModeInstructions(context.generationMode)}

When generating spec files, follow the structure from DESIGN_PHILOSOPHY.md:
- CLAUDE.md for agent guidelines
- specs/README.md for spec index
- specs/[feature].md for feature specifications
- PLAN.md for implementation phases

Always generate code examples in ${context.targetLanguage}.`
  }

  private getModeInstructions(mode: GenerationMode): string {
    switch (mode) {
      case 'incremental':
        return `- Generate one file at a time
- Wait for user approval before proceeding
- Ask clarifying questions as needed`

      case 'all-at-once':
        return `- Generate all spec files in sequence
- Provide a summary of generated files
- User can review and request changes after`

      case 'draft-then-refine':
        return `- Generate all files as drafts
- Mark files with [DRAFT] status
- Iterate based on user feedback`
    }
  }
}
```

## 5. IPC Integration

### 5.1 IPC Handlers (Main Process)

```typescript
// src/main/ipc/claude-handlers.ts

import { ipcMain } from 'electron'
import { createClaudeService, ClaudeService } from '../services/claude'

let claudeService: ClaudeService | null = null

export function registerClaudeHandlers(mainWindow: BrowserWindow) {
  // Initialize service
  ipcMain.handle('claude:init', async (event, options) => {
    claudeService = createClaudeService({
      workingDirectory: options.workingDirectory,
      cliPath: options.cliPath,
    })

    const available = await claudeService.checkAvailability()
    return { available, status: claudeService.getStatus() }
  })

  // Send message (starts streaming)
  ipcMain.handle('claude:send', async (event, message, context) => {
    if (!claudeService) {
      throw new Error('Claude service not initialized')
    }

    // Stream events to renderer
    try {
      for await (const streamEvent of claudeService.sendMessage(message, { context })) {
        mainWindow.webContents.send('claude:stream', streamEvent)
      }
    } catch (error) {
      mainWindow.webContents.send('claude:stream', {
        type: 'error',
        message: error.message,
      })
    }
  })

  // Cancel current request
  ipcMain.handle('claude:cancel', async () => {
    if (claudeService) {
      await claudeService.cancel()
    }
  })

  // Get status
  ipcMain.handle('claude:status', () => {
    return claudeService?.getStatus() ?? { ready: false, state: 'idle' }
  })
}
```

### 5.2 Preload API

```typescript
// src/preload/claude-api.ts

export const claudeApi = {
  init: (options: { workingDirectory: string; cliPath?: string }) =>
    ipcRenderer.invoke('claude:init', options),

  send: (message: string, context?: ProjectContext) =>
    ipcRenderer.invoke('claude:send', message, context),

  onStream: (callback: (event: StreamEvent) => void) => {
    const handler = (_: IpcRendererEvent, event: StreamEvent) => callback(event)
    ipcRenderer.on('claude:stream', handler)
    return () => ipcRenderer.removeListener('claude:stream', handler)
  },

  cancel: () => ipcRenderer.invoke('claude:cancel'),

  getStatus: () => ipcRenderer.invoke('claude:status'),
}
```

## 6. Error Handling

```typescript
/**
 * Claude service errors
 */
class ClaudeServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_AVAILABLE'
      | 'BUSY'
      | 'TIMEOUT'
      | 'CANCELLED'
      | 'CLI_ERROR'
      | 'PARSE_ERROR'
      | 'UNKNOWN'
  ) {
    super(message)
    this.name = 'ClaudeServiceError'
  }
}

// Error recovery strategies:
// - NOT_AVAILABLE: Prompt user to install/configure CLI
// - BUSY: Queue or reject request
// - TIMEOUT: Allow retry
// - CANCELLED: Normal flow, no action needed
// - CLI_ERROR: Show error, allow retry
// - PARSE_ERROR: Log warning, continue if possible
```

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// stream-parser.test.ts
describe('StreamParser', () => {
  it('parses text events', () => {
    const parser = new StreamParser()
    const events = parser.parse('{"type":"assistant_text","text":"Hello"}\n')
    expect(events).toEqual([{ type: 'text', content: 'Hello' }])
  })

  it('handles partial lines', () => {
    const parser = new StreamParser()
    expect(parser.parse('{"type":"assis')).toEqual([])
    expect(parser.parse('tant_text","text":"Hi"}\n')).toEqual([
      { type: 'text', content: 'Hi' },
    ])
  })

  it('parses file operations', () => {
    // ...
  })
})

// context-builder.test.ts
describe('ContextBuilder', () => {
  it('builds complete context prompt', () => {
    const builder = new ContextBuilder()
    const prompt = builder.build({
      projectId: '123',
      projectName: 'Test Project',
      // ...
    })
    expect(prompt).toContain('Test Project')
    expect(prompt).toContain('## Requirements')
  })
})
```

### 7.2 Integration Tests

```typescript
// claude-service.test.ts
describe('ClaudeService', () => {
  it('sends message and streams response', async () => {
    const service = createClaudeService({
      workingDirectory: '/tmp/test',
      cliPath: mockCliPath,
    })

    const events: StreamEvent[] = []
    for await (const event of service.sendMessage('Hello')) {
      events.push(event)
    }

    expect(events[0].type).toBe('start')
    expect(events[events.length - 1].type).toBe('complete')
  })

  it('handles cancellation', async () => {
    // ...
  })
})
```

## 8. Implementation Phases

### Phase 1: Service Foundation
**Goal:** Basic service structure
- [ ] Create service types
- [ ] Implement ClaudeService skeleton
- [ ] Implement ProcessManager
- [ ] Add error types

### Phase 2: Stream Parsing
**Goal:** Parse CLI output
- [ ] Implement StreamParser
- [ ] Handle text events
- [ ] Handle file operation events
- [ ] Add unit tests

### Phase 3: Context Building
**Goal:** Build project context
- [ ] Implement ContextBuilder
- [ ] Add generation mode instructions
- [ ] Test context prompt output

### Phase 4: IPC Integration
**Goal:** Connect to Electron
- [ ] Register IPC handlers
- [ ] Implement preload API
- [ ] Connect to ChatStore
- [ ] Test round-trip flow

### Phase 5: Cancellation & Timeout
**Goal:** Handle interrupts
- [ ] Implement cancel flow
- [ ] Add timeout handling
- [ ] Test abort scenarios

### Phase 6: Polish
**Goal:** Production ready
- [ ] Add comprehensive error handling
- [ ] Add debug logging
- [ ] Performance optimization
- [ ] Documentation

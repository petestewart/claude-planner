# Architecture

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Define the system architecture for Spec Planner, an Electron application that helps users create software specifications and implementation plans through conversational AI interaction.

### Goals
- Clean separation between Electron main and renderer processes
- Modular services that can be extracted for a larger orchestration suite
- Type-safe IPC communication
- Responsive UI with real-time file updates

### Non-Goals
- Multi-user collaboration (single user only)
- Cloud storage or sync
- Plugin system (may be added later)
- Mobile or web deployment

## 2. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron App                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Renderer Process                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐ │ │
│  │  │ File Browser│ │   Editor    │ │    Chat Interface     │ │ │
│  │  │  Component  │ │  Component  │ │      Component        │ │ │
│  │  └──────┬──────┘ └──────┬──────┘ └───────────┬───────────┘ │ │
│  │         │               │                     │             │ │
│  │  ┌──────┴───────────────┴─────────────────────┴───────────┐ │ │
│  │  │                   Zustand Stores                        │ │ │
│  │  │  FileStore │ EditorStore │ ChatStore │ ProjectStore    │ │ │
│  │  └──────────────────────────┬─────────────────────────────┘ │ │
│  └─────────────────────────────┼───────────────────────────────┘ │
│                                │ IPC (contextBridge)             │
│  ┌─────────────────────────────┼───────────────────────────────┐ │
│  │                    Main Process                              │ │
│  │  ┌──────────────────────────┴─────────────────────────────┐ │ │
│  │  │                    IPC Handlers                         │ │ │
│  │  └──────────────────────────┬─────────────────────────────┘ │ │
│  │         ┌───────────────────┼───────────────────┐           │ │
│  │         ▼                   ▼                   ▼           │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │ │
│  │  │   Claude    │     │    File     │     │     Git     │   │ │
│  │  │   Service   │     │   Service   │     │   Service   │   │ │
│  │  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘   │ │
│  └─────────┼───────────────────┼───────────────────┼───────────┘ │
└────────────┼───────────────────┼───────────────────┼─────────────┘
             │                   │                   │
             ▼                   ▼                   ▼
      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │ Claude Code │     │ File System │     │     Git     │
      │     CLI     │     │             │     │   Repos     │
      └─────────────┘     └─────────────┘     └─────────────┘
```

### Process Responsibilities

#### Main Process
- Window management
- File system operations (read, write, watch)
- Claude Code CLI subprocess management
- Git operations
- IPC request handling
- Application lifecycle

#### Renderer Process
- UI rendering (React)
- User interaction handling
- Local state management (Zustand)
- IPC request initiation

## 3. Core Types

### 3.1 Project State

```typescript
/**
 * Represents the current state of a spec project
 * Used for context management with Claude
 */
interface ProjectState {
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

interface Requirement {
  id: string
  category: 'functional' | 'non-functional' | 'constraint'
  description: string
  priority: 'must' | 'should' | 'could'
  source: 'user' | 'agent-inferred'
}

interface Decision {
  id: string
  topic: string
  choice: string
  rationale: string
  timestamp: string
}

interface GeneratedFile {
  path: string
  status: 'draft' | 'approved' | 'modified'
  lastGenerated: string
  lastModified: string
}

type GenerationMode = 'incremental' | 'all-at-once' | 'draft-then-refine'

interface GitConfig {
  enabled: boolean
  autoCommit: boolean
  initialized: boolean
}
```

### 3.2 File System Types

```typescript
/**
 * Represents a node in the file tree
 */
interface FileNode {
  /** File or directory name */
  name: string

  /** Absolute path */
  path: string

  /** Node type */
  type: 'file' | 'directory'

  /** Children (for directories) */
  children?: FileNode[]

  /** File extension (for files) */
  extension?: string

  /** Whether the node is expanded in the tree */
  expanded?: boolean
}

/**
 * File watcher event
 */
interface FileWatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  timestamp: string
}
```

### 3.3 Chat Types

```typescript
/**
 * A message in the chat conversation
 */
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string

  /** Files referenced or modified by this message */
  relatedFiles?: string[]

  /** Whether this message is still streaming */
  streaming?: boolean
}

/**
 * Chat session state
 */
interface ChatSession {
  id: string
  projectId: string
  messages: ChatMessage[]
  status: 'idle' | 'waiting' | 'streaming'
}
```

### 3.4 Editor Types

```typescript
/**
 * Editor state for the markdown editor
 */
interface EditorState {
  /** Currently open file path (null if none) */
  currentFile: string | null

  /** File content */
  content: string

  /** Whether content has unsaved changes */
  isDirty: boolean

  /** Current editing mode */
  mode: 'wysiwyg' | 'markdown'

  /** Cursor position */
  cursorPosition: CursorPosition
}

interface CursorPosition {
  line: number
  column: number
}
```

## 4. IPC API

### 4.1 Channel Definitions

```typescript
/**
 * IPC channels for main/renderer communication
 */
const IPC_CHANNELS = {
  // File operations
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_LIST: 'file:list',
  FILE_WATCH_START: 'file:watch:start',
  FILE_WATCH_STOP: 'file:watch:stop',
  FILE_WATCH_EVENT: 'file:watch:event', // main -> renderer

  // Directory operations
  DIR_SELECT: 'dir:select',
  DIR_CREATE: 'dir:create',

  // Claude operations
  CLAUDE_SEND: 'claude:send',
  CLAUDE_STREAM: 'claude:stream', // main -> renderer
  CLAUDE_CANCEL: 'claude:cancel',
  CLAUDE_STATUS: 'claude:status',

  // Git operations
  GIT_INIT: 'git:init',
  GIT_COMMIT: 'git:commit',
  GIT_STATUS: 'git:status',
  GIT_DIFF: 'git:diff',

  // Project operations
  PROJECT_LOAD: 'project:load',
  PROJECT_SAVE: 'project:save',
  PROJECT_STATE: 'project:state',

  // Template operations
  TEMPLATE_LIST: 'template:list',
  TEMPLATE_GET: 'template:get',
  TEMPLATE_SAVE: 'template:save',
} as const
```

### 4.2 Preload API

```typescript
/**
 * API exposed to renderer via contextBridge
 */
interface ElectronAPI {
  file: {
    read(path: string): Promise<string>
    write(path: string, content: string): Promise<void>
    list(path: string): Promise<FileNode[]>
    watchStart(path: string): Promise<void>
    watchStop(path: string): Promise<void>
    onWatchEvent(callback: (event: FileWatchEvent) => void): () => void
  }

  dir: {
    select(): Promise<string | null>
    create(path: string): Promise<void>
  }

  claude: {
    send(message: string, context: ProjectState): Promise<void>
    onStream(callback: (chunk: string) => void): () => void
    cancel(): Promise<void>
    getStatus(): Promise<ClaudeStatus>
  }

  git: {
    init(path: string): Promise<void>
    commit(message: string, files: string[]): Promise<string>
    status(): Promise<GitStatus>
    diff(file?: string): Promise<string>
  }

  project: {
    load(path: string): Promise<ProjectState>
    save(state: ProjectState): Promise<void>
  }

  template: {
    list(): Promise<TemplateInfo[]>
    get(id: string): Promise<Template>
    save(template: Template): Promise<void>
  }
}
```

## 5. Data Flow

### 5.1 User Sends Chat Message

```
User types message
        │
        ▼
┌─────────────────┐
│  ChatInterface  │
│    Component    │
└────────┬────────┘
         │ dispatch(sendMessage)
         ▼
┌─────────────────┐
│   ChatStore     │ ── adds message, sets status='waiting'
└────────┬────────┘
         │ window.api.claude.send()
         ▼
┌─────────────────┐
│  IPC Handler    │
│  (main process) │
└────────┬────────┘
         │ spawn subprocess
         ▼
┌─────────────────┐
│  ClaudeService  │ ── manages CLI subprocess
└────────┬────────┘
         │ stdout chunks
         ▼
┌─────────────────┐
│  IPC Stream     │ ── sends chunks to renderer
└────────┬────────┘
         │ onStream callback
         ▼
┌─────────────────┐
│   ChatStore     │ ── appends to message, updates UI
└─────────────────┘
```

### 5.2 Agent Updates File

```
Claude outputs file content
        │
        ▼
┌─────────────────┐
│  ClaudeService  │ ── parses output, detects file write
└────────┬────────┘
         │ fileService.write()
         ▼
┌─────────────────┐
│  FileService    │ ── writes to disk
└────────┬────────┘
         │ chokidar detects change
         ▼
┌─────────────────┐
│  FileWatcher    │ ── emits FILE_WATCH_EVENT
└────────┬────────┘
         │ IPC event
         ▼
┌─────────────────┐
│   FileStore     │ ── updates tree, notifies components
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌────────┐
│Browser│ │ Editor │ ── reloads if file is open
└───────┘ └────────┘
```

## 6. Module Extraction Strategy

Each service is designed for future extraction:

### Service Interface Pattern

```typescript
// Each service exports:
// 1. Types (can be shared across modules)
// 2. Factory function (creates instance)
// 3. Default implementation

// git-service/types.ts
export interface GitService {
  init(path: string): Promise<void>
  commit(message: string, files: string[]): Promise<string>
  status(): Promise<GitStatus>
  diff(file?: string): Promise<string>
}

export interface GitServiceOptions {
  cwd: string
  autoCommit?: boolean
}

// git-service/index.ts
export function createGitService(options: GitServiceOptions): GitService {
  return new GitServiceImpl(options)
}

// Usage in main process
const gitService = createGitService({ cwd: projectPath, autoCommit: true })

// Future: extract to @spec-planner/git-service package
```

### Extraction Checklist
- [ ] Service has no direct dependencies on Electron APIs
- [ ] Service communicates only via its typed interface
- [ ] Service options are passed via factory function
- [ ] Service can be instantiated independently
- [ ] Service has its own test suite

## 7. Error Handling

### Error Types

```typescript
/**
 * Base error class for Spec Planner
 */
class SpecPlannerError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SpecPlannerError'
  }
}

class FileOperationError extends SpecPlannerError {
  constructor(message: string, public path: string, public operation: string) {
    super(message, 'FILE_OPERATION_ERROR', { path, operation })
    this.name = 'FileOperationError'
  }
}

class ClaudeServiceError extends SpecPlannerError {
  constructor(message: string, public exitCode?: number) {
    super(message, 'CLAUDE_SERVICE_ERROR', { exitCode })
    this.name = 'ClaudeServiceError'
  }
}

class GitOperationError extends SpecPlannerError {
  constructor(message: string, public command: string) {
    super(message, 'GIT_OPERATION_ERROR', { command })
    this.name = 'GitOperationError'
  }
}
```

### Error Propagation

```
Service Error
     │
     ▼
┌─────────────────┐
│  IPC Handler    │ ── catches, wraps in IPC response
└────────┬────────┘
         │ { success: false, error: { code, message } }
         ▼
┌─────────────────┐
│  Renderer       │ ── displays to user, logs
└─────────────────┘
```

## 8. Security Considerations

- **Context Isolation:** Renderer has no direct Node.js access
- **Preload Script:** Only exposes specific APIs via contextBridge
- **File Access:** Limited to user-selected directories
- **No Eval:** Content Security Policy blocks eval and inline scripts
- **Subprocess:** Claude CLI runs with inherited user permissions

## 9. Testing Strategy

### Unit Tests
- Service logic (file operations, git commands)
- Store reducers and selectors
- Utility functions

### Integration Tests
- IPC round-trips
- File watcher behavior
- Claude CLI interaction (mocked)

### Component Tests
- React components with React Testing Library
- User interaction flows
- State synchronization

### E2E Tests (Playwright)
- Full application flows
- File creation and editing
- Chat conversation

## 10. Implementation Phases

See [PLAN.md](../PLAN.md) for detailed implementation tracking.

### Phase Overview
1. **Project Setup** - Electron + TypeScript + React scaffolding
2. **Core Layout** - Split pane UI shell
3. **File Browser** - Directory tree and selection
4. **Markdown Editor** - WYSIWYG editing with mode toggle
5. **Chat Interface** - Message display and input
6. **Claude Integration** - CLI subprocess management
7. **Project State** - State management and persistence
8. **Template System** - Built-in and custom templates
9. **Git Integration** - Version control operations
10. **Generation Modes** - Incremental, all-at-once, draft-refine
11. **Polish** - Error handling, loading states, UX refinement
12. **Testing** - Comprehensive test coverage

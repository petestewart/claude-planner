# Git Integration

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Provide version control integration for tracking changes to spec files. Supports automatic commits, diff viewing, and repository initialization. Designed as an extractable module for future integration into a larger orchestration suite.

### Goals
- Initialize git repos for new projects
- Auto-commit spec changes (configurable)
- Show diffs when files change
- Display git status in UI
- Design for extraction as standalone module
- No dependency on Electron APIs

### Non-Goals
- Full git client (push, pull, branches)
- Merge conflict resolution
- Git history visualization
- Remote repository management

## 2. Architecture

### Component Structure

```
src/main/services/git/
├── index.ts                    # Public exports, factory function
├── types.ts                    # Type definitions
├── git-service.ts              # Main service implementation
├── git-executor.ts             # Execute git commands
├── diff-parser.ts              # Parse diff output
└── __tests__/
    ├── git-service.test.ts
    ├── git-executor.test.ts
    └── diff-parser.test.ts
```

### Service Extraction Pattern

```typescript
// This service has NO Electron dependencies
// It can be extracted as @spec-planner/git-service

// index.ts
export { createGitService } from './git-service'
export type {
  GitService,
  GitServiceOptions,
  GitStatus,
  FileDiff,
  CommitInfo,
} from './types'
```

### Data Flow

```
┌─────────────────┐
│  File Watcher   │ ── file changed
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitService     │ ── checks if auto-commit enabled
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitExecutor    │ ── runs git commands
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Git CLI        │ ── actual git operations
└─────────────────┘
```

## 3. Core Types

### 3.1 Service Types

```typescript
/**
 * Git service configuration
 */
interface GitServiceOptions {
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
interface GitService {
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
interface GitStatus {
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
interface FileStatus {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  oldPath?: string // For renamed/copied
}
```

### 3.2 Diff Types

```typescript
/**
 * Options for getting diffs
 */
interface DiffOptions {
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
interface FileDiff {
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
interface DiffHunk {
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
interface DiffLine {
  type: 'context' | 'add' | 'delete'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}
```

### 3.3 Commit Types

```typescript
/**
 * Information about a commit
 */
interface CommitInfo {
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
```

## 4. Components

### 4.1 GitService Implementation

```typescript
/**
 * Factory function for creating git service
 */
function createGitService(options: GitServiceOptions): GitService {
  return new GitServiceImpl(options)
}

class GitServiceImpl implements GitService {
  private executor: GitExecutor
  private autoCommitEnabled: boolean
  private autoCommitTimer: NodeJS.Timeout | null = null
  private pendingChanges: Set<string> = new Set()

  constructor(private options: GitServiceOptions) {
    this.executor = new GitExecutor(options.gitPath ?? 'git', options.cwd)
    this.autoCommitEnabled = options.autoCommit ?? false
  }

  async init(): Promise<void> {
    await this.executor.run(['init'])

    // Create .gitignore with sensible defaults
    const gitignore = `# Dependencies
node_modules/

# Build output
dist/
build/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db
`
    await fs.writeFile(path.join(this.options.cwd, '.gitignore'), gitignore)
  }

  async isRepo(): Promise<boolean> {
    try {
      await this.executor.run(['rev-parse', '--is-inside-work-tree'])
      return true
    } catch {
      return false
    }
  }

  async getStatus(): Promise<GitStatus> {
    const isRepo = await this.isRepo()
    if (!isRepo) {
      return {
        isRepo: false,
        branch: null,
        staged: [],
        modified: [],
        untracked: [],
        isDirty: false,
      }
    }

    // Get branch name
    const branch = await this.getCurrentBranch()

    // Get status
    const statusOutput = await this.executor.run([
      'status',
      '--porcelain=v2',
      '--branch',
    ])

    const { staged, modified, untracked } = this.parseStatusOutput(statusOutput)

    return {
      isRepo: true,
      branch,
      staged,
      modified,
      untracked,
      isDirty: staged.length > 0 || modified.length > 0 || untracked.length > 0,
    }
  }

  async stage(files: string[]): Promise<void> {
    if (files.length === 0) return
    await this.executor.run(['add', '--', ...files])
  }

  async stageAll(): Promise<void> {
    await this.executor.run(['add', '-A'])
  }

  async unstage(files: string[]): Promise<void> {
    if (files.length === 0) return
    await this.executor.run(['reset', 'HEAD', '--', ...files])
  }

  async commit(message: string): Promise<CommitInfo> {
    await this.executor.run(['commit', '-m', message])

    // Get info about the commit we just made
    const log = await this.log(1)
    return log[0]
  }

  async diff(options?: DiffOptions): Promise<FileDiff[]> {
    const args = ['diff']

    if (options?.staged) {
      args.push('--cached')
    }

    if (options?.commit) {
      args.push(options.commit)
    }

    if (options?.contextLines !== undefined) {
      args.push(`-U${options.contextLines}`)
    }

    if (options?.files?.length) {
      args.push('--', ...options.files)
    }

    const output = await this.executor.run(args)
    return new DiffParser().parse(output)
  }

  async log(limit = 10): Promise<CommitInfo[]> {
    const format = '%H%n%h%n%s%n%an%n%ae%n%aI'
    const output = await this.executor.run([
      'log',
      `--format=${format}`,
      `-n${limit}`,
    ])

    return this.parseLogOutput(output)
  }

  setAutoCommit(enabled: boolean): void {
    this.autoCommitEnabled = enabled

    if (!enabled && this.autoCommitTimer) {
      clearTimeout(this.autoCommitTimer)
      this.autoCommitTimer = null
      this.pendingChanges.clear()
    }
  }

  triggerAutoCommit(): void {
    if (!this.autoCommitEnabled) return

    // Debounce auto-commit
    if (this.autoCommitTimer) {
      clearTimeout(this.autoCommitTimer)
    }

    this.autoCommitTimer = setTimeout(async () => {
      await this.performAutoCommit()
    }, this.options.autoCommitDelay ?? 5000)
  }

  private async performAutoCommit(): Promise<void> {
    try {
      const status = await this.getStatus()
      if (!status.isDirty) return

      await this.stageAll()

      const message = this.generateCommitMessage(status)
      await this.commit(message)

      this.pendingChanges.clear()
    } catch (error) {
      console.error('Auto-commit failed:', error)
    }
  }

  private generateCommitMessage(status: GitStatus): string {
    const template = this.options.commitMessageTemplate ?? 'Update specs'

    const changes: string[] = []
    if (status.staged.length + status.modified.length > 0) {
      const files = [...status.staged, ...status.modified]
      if (files.length <= 3) {
        changes.push(files.map((f) => f.path).join(', '))
      } else {
        changes.push(`${files.length} files`)
      }
    }

    if (changes.length > 0) {
      return `${template}: ${changes.join(', ')}`
    }

    return template
  }

  dispose(): void {
    if (this.autoCommitTimer) {
      clearTimeout(this.autoCommitTimer)
    }
  }
}
```

### 4.2 GitExecutor

```typescript
/**
 * Executes git commands
 */
class GitExecutor {
  constructor(
    private gitPath: string,
    private cwd: string
  ) {}

  /**
   * Run a git command and return stdout
   */
  async run(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.gitPath, args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      process.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new GitExecutionError(args, code, stderr))
        }
      })

      process.on('error', (error) => {
        reject(new GitExecutionError(args, -1, error.message))
      })
    })
  }
}

class GitExecutionError extends Error {
  constructor(
    public command: string[],
    public exitCode: number | null,
    public stderr: string
  ) {
    super(`Git command failed: git ${command.join(' ')}\n${stderr}`)
    this.name = 'GitExecutionError'
  }
}
```

### 4.3 DiffParser

```typescript
/**
 * Parses git diff output into structured data
 */
class DiffParser {
  parse(diffOutput: string): FileDiff[] {
    const diffs: FileDiff[] = []
    const fileSections = this.splitByFile(diffOutput)

    for (const section of fileSections) {
      const diff = this.parseFileSection(section)
      if (diff) {
        diffs.push(diff)
      }
    }

    return diffs
  }

  private splitByFile(output: string): string[] {
    const sections: string[] = []
    const lines = output.split('\n')

    let current: string[] = []
    for (const line of lines) {
      if (line.startsWith('diff --git') && current.length > 0) {
        sections.push(current.join('\n'))
        current = []
      }
      current.push(line)
    }

    if (current.length > 0) {
      sections.push(current.join('\n'))
    }

    return sections
  }

  private parseFileSection(section: string): FileDiff | null {
    const lines = section.split('\n')

    // Parse header
    const diffLine = lines.find((l) => l.startsWith('diff --git'))
    if (!diffLine) return null

    const pathMatch = diffLine.match(/diff --git a\/(.+) b\/(.+)/)
    if (!pathMatch) return null

    const [, oldPath, newPath] = pathMatch
    const path = newPath

    // Determine type
    let type: FileDiff['type'] = 'modified'
    if (lines.some((l) => l.startsWith('new file'))) {
      type = 'added'
    } else if (lines.some((l) => l.startsWith('deleted file'))) {
      type = 'deleted'
    } else if (lines.some((l) => l.startsWith('rename from'))) {
      type = 'renamed'
    }

    // Parse hunks
    const hunks = this.parseHunks(lines)

    return {
      path,
      oldPath: type === 'renamed' ? oldPath : undefined,
      type,
      hunks,
      raw: section,
    }
  }

  private parseHunks(lines: string[]): DiffHunk[] {
    const hunks: DiffHunk[] = []
    let currentHunk: DiffHunk | null = null
    let oldLine = 0
    let newLine = 0

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // New hunk
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1], 10),
            oldLines: parseInt(match[2] || '1', 10),
            newStart: parseInt(match[3], 10),
            newLines: parseInt(match[4] || '1', 10),
            lines: [],
          }
          hunks.push(currentHunk)
          oldLine = currentHunk.oldStart
          newLine = currentHunk.newStart
        }
      } else if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.lines.push({
            type: 'add',
            content: line.slice(1),
            newLineNumber: newLine++,
          })
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({
            type: 'delete',
            content: line.slice(1),
            oldLineNumber: oldLine++,
          })
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push({
            type: 'context',
            content: line.slice(1),
            oldLineNumber: oldLine++,
            newLineNumber: newLine++,
          })
        }
      }
    }

    return hunks
  }
}
```

## 5. IPC Integration

### 5.1 IPC Handlers

```typescript
// src/main/ipc/git-handlers.ts

import { ipcMain } from 'electron'
import { createGitService, GitService } from '../services/git'

let gitService: GitService | null = null

export function registerGitHandlers() {
  ipcMain.handle('git:init', async (event, cwd: string, options?: GitServiceOptions) => {
    gitService = createGitService({ cwd, ...options })
    await gitService.init()
    return { success: true }
  })

  ipcMain.handle('git:status', async () => {
    if (!gitService) throw new Error('Git service not initialized')
    return gitService.getStatus()
  })

  ipcMain.handle('git:commit', async (event, message: string) => {
    if (!gitService) throw new Error('Git service not initialized')
    return gitService.commit(message)
  })

  ipcMain.handle('git:diff', async (event, options?: DiffOptions) => {
    if (!gitService) throw new Error('Git service not initialized')
    return gitService.diff(options)
  })

  ipcMain.handle('git:log', async (event, limit?: number) => {
    if (!gitService) throw new Error('Git service not initialized')
    return gitService.log(limit)
  })

  ipcMain.handle('git:setAutoCommit', async (event, enabled: boolean) => {
    if (!gitService) throw new Error('Git service not initialized')
    gitService.setAutoCommit(enabled)
  })
}
```

### 5.2 Preload API

```typescript
// src/preload/git-api.ts

export const gitApi = {
  init: (cwd: string, options?: Partial<GitServiceOptions>) =>
    ipcRenderer.invoke('git:init', cwd, options),

  getStatus: () =>
    ipcRenderer.invoke('git:status'),

  commit: (message: string) =>
    ipcRenderer.invoke('git:commit', message),

  diff: (options?: DiffOptions) =>
    ipcRenderer.invoke('git:diff', options),

  log: (limit?: number) =>
    ipcRenderer.invoke('git:log', limit),

  setAutoCommit: (enabled: boolean) =>
    ipcRenderer.invoke('git:setAutoCommit', enabled),
}
```

## 6. UI Components

### 6.1 GitStatusIndicator

```typescript
interface GitStatusIndicatorProps {
  status: GitStatus
  autoCommitEnabled: boolean
  onAutoCommitToggle: (enabled: boolean) => void
}

/**
 * Compact status bar indicator showing:
 * - Branch name
 * - Dirty indicator (dot if uncommitted changes)
 * - Auto-commit toggle
 */
```

### 6.2 DiffViewer

```typescript
interface DiffViewerProps {
  diff: FileDiff
  onClose: () => void
}

/**
 * Shows diff in side-by-side or unified view:
 * - Syntax highlighting
 * - Line numbers
 * - Add/delete highlighting
 */
```

## 7. Configuration

```typescript
/**
 * Git configuration stored in project state
 */
interface GitConfig {
  /** Whether git integration is enabled */
  enabled: boolean

  /** Auto-commit on file changes */
  autoCommit: boolean

  /** Auto-commit delay in ms */
  autoCommitDelay: number

  /** Commit message template */
  commitMessageTemplate: string
}

const DEFAULT_GIT_CONFIG: GitConfig = {
  enabled: true,
  autoCommit: false,
  autoCommitDelay: 5000,
  commitMessageTemplate: 'Update specs',
}
```

## 8. Error Handling

```typescript
/**
 * Git-specific errors
 */
class GitServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_REPO'
      | 'NOT_INITIALIZED'
      | 'COMMAND_FAILED'
      | 'MERGE_CONFLICT'
      | 'UNKNOWN'
  ) {
    super(message)
    this.name = 'GitServiceError'
  }
}

// Error recovery:
// - NOT_REPO: Prompt to initialize
// - COMMAND_FAILED: Show error, allow retry
// - MERGE_CONFLICT: Currently not supported, show warning
```

## 9. Implementation Phases

### Phase 1: Service Foundation
**Goal:** Basic git operations
- [ ] Create service types
- [ ] Implement GitExecutor
- [ ] Implement isRepo, init
- [ ] Test basic commands

### Phase 2: Status & Stage
**Goal:** Track changes
- [ ] Implement getStatus
- [ ] Parse porcelain output
- [ ] Implement stage/unstage
- [ ] Test with various states

### Phase 3: Commit & Log
**Goal:** Create commits
- [ ] Implement commit
- [ ] Implement log
- [ ] Parse commit info
- [ ] Test commit flow

### Phase 4: Diff Parsing
**Goal:** Show diffs
- [ ] Implement DiffParser
- [ ] Parse hunks and lines
- [ ] Create DiffViewer component
- [ ] Test various diff types

### Phase 5: Auto-Commit
**Goal:** Automatic commits
- [ ] Implement triggerAutoCommit
- [ ] Add debounce logic
- [ ] Generate commit messages
- [ ] Connect to file watcher
- [ ] Test auto-commit flow

### Phase 6: IPC & UI
**Goal:** Connect to app
- [ ] Register IPC handlers
- [ ] Create GitStatusIndicator
- [ ] Add to status bar
- [ ] Add settings UI
- [ ] Test end-to-end

### Phase 7: Polish
**Goal:** Production ready
- [ ] Comprehensive error handling
- [ ] Performance optimization
- [ ] Edge case testing
- [ ] Documentation

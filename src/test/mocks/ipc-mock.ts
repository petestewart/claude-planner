/**
 * IPC Mock for Renderer Tests
 *
 * Provides typed mocks for the Electron IPC API exposed via contextBridge.
 * This module creates comprehensive mocks for all window.api methods with
 * sensible defaults and utilities for test customization.
 */

import type { FileNode, FileWatchEvent } from '../../shared/types/file'
import type {
  ClaudeStatus,
  StreamEvent,
  ClaudeInitOptions,
  ClaudeInitResult,
} from '../../shared/types/git'
import type { ProjectState } from '../../shared/types/project'
import type { TemplateInfo, Template } from '../../shared/types/template'
import type { UpdateStatus } from '../../shared/types/electron-api'
import type {
  GitStatus,
  GitServiceOptions,
  CommitInfo,
  DiffOptions,
  FileDiff,
} from '../../main/services/git/types'

// Type for mocked functions with Jest mock capabilities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFn<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>, Parameters<T>>

/**
 * Interface for the mocked API with Jest mock functions
 */
export interface MockedElectronAPI {
  file: {
    read: MockedFn<(path: string) => Promise<string>>
    write: MockedFn<(path: string, content: string) => Promise<void>>
    create: MockedFn<(path: string, content?: string) => Promise<void>>
    rename: MockedFn<(oldPath: string, newPath: string) => Promise<void>>
    delete: MockedFn<(path: string) => Promise<void>>
    list: MockedFn<(path: string) => Promise<FileNode>>
    watchStart: MockedFn<(path: string) => Promise<void>>
    watchStop: MockedFn<(path: string) => Promise<void>>
    onWatchEvent: MockedFn<(callback: (event: FileWatchEvent) => void) => () => void>
  }

  dir: {
    select: MockedFn<() => Promise<string | null>>
    create: MockedFn<(path: string) => Promise<void>>
  }

  claude: {
    init: MockedFn<(options: ClaudeInitOptions) => Promise<ClaudeInitResult>>
    send: MockedFn<(message: string, context?: ProjectState) => Promise<void>>
    onStream: MockedFn<(callback: (event: StreamEvent) => void) => () => void>
    cancel: MockedFn<() => Promise<void>>
    getStatus: MockedFn<() => Promise<ClaudeStatus>>
  }

  git: {
    init: MockedFn<
      (cwd: string, options?: Partial<GitServiceOptions>) => Promise<{ success: boolean }>
    >
    connect: MockedFn<
      (cwd: string, options?: Partial<GitServiceOptions>) => Promise<{ isRepo: boolean }>
    >
    isRepo: MockedFn<(cwd?: string) => Promise<boolean>>
    status: MockedFn<() => Promise<GitStatus>>
    stage: MockedFn<(files: string[]) => Promise<void>>
    stageAll: MockedFn<() => Promise<void>>
    unstage: MockedFn<(files: string[]) => Promise<void>>
    commit: MockedFn<(message: string) => Promise<CommitInfo>>
    diff: MockedFn<(options?: DiffOptions) => Promise<FileDiff[]>>
    log: MockedFn<(limit?: number) => Promise<CommitInfo[]>>
    setAutoCommit: MockedFn<(enabled: boolean) => Promise<{ success: boolean }>>
    triggerAutoCommit: MockedFn<() => Promise<{ success: boolean }>>
  }

  project: {
    load: MockedFn<(path: string) => Promise<ProjectState>>
    save: MockedFn<(state: ProjectState) => Promise<void>>
  }

  template: {
    list: MockedFn<() => Promise<TemplateInfo[]>>
    get: MockedFn<(id: string) => Promise<Template>>
    save: MockedFn<(template: Template) => Promise<void>>
    delete: MockedFn<(id: string) => Promise<void>>
    getCustomPath: MockedFn<() => Promise<string>>
    getDefaultPath: MockedFn<() => Promise<string>>
    setCustomPath: MockedFn<(path: string | null) => Promise<void>>
  }

  updater: {
    check: MockedFn<() => Promise<UpdateStatus>>
    download: MockedFn<() => Promise<void>>
    install: MockedFn<() => Promise<void>>
    getStatus: MockedFn<() => Promise<UpdateStatus>>
    onStatus: MockedFn<(callback: (status: UpdateStatus) => void) => () => void>
  }
}

/**
 * Default mock data for common test scenarios
 */
export const mockDefaults = {
  fileNode: (overrides?: Partial<FileNode>): FileNode => ({
    id: '/test/project',
    name: 'project',
    path: '/test/project',
    type: 'directory',
    depth: 0,
    children: [],
    ...overrides,
  }),

  fileNodeWithChildren: (): FileNode => ({
    id: '/test/project',
    name: 'project',
    path: '/test/project',
    type: 'directory',
    depth: 0,
    children: [
      {
        id: '/test/project/src',
        name: 'src',
        path: '/test/project/src',
        type: 'directory',
        depth: 1,
        children: [
          {
            id: '/test/project/src/index.ts',
            name: 'index.ts',
            path: '/test/project/src/index.ts',
            type: 'file',
            depth: 2,
            extension: 'ts',
          },
        ],
      },
      {
        id: '/test/project/README.md',
        name: 'README.md',
        path: '/test/project/README.md',
        type: 'file',
        depth: 1,
        extension: 'md',
      },
    ],
  }),

  gitStatus: (overrides?: Partial<GitStatus>): GitStatus => ({
    isRepo: true,
    branch: 'main',
    staged: [],
    modified: [],
    untracked: [],
    isDirty: false,
    ...overrides,
  }),

  claudeStatus: (overrides?: Partial<ClaudeStatus>): ClaudeStatus => ({
    ready: true,
    state: 'idle',
    cliVersion: '1.0.0',
    ...overrides,
  }),

  claudeInitResult: (overrides?: Partial<ClaudeInitResult>): ClaudeInitResult => ({
    available: true,
    status: mockDefaults.claudeStatus(),
    ...overrides,
  }),

  commitInfo: (overrides?: Partial<CommitInfo>): CommitInfo => ({
    hash: 'abc123def456789',
    shortHash: 'abc123d',
    message: 'Test commit',
    authorName: 'Test User',
    authorEmail: 'test@example.com',
    timestamp: new Date().toISOString(),
    ...overrides,
  }),

  projectState: (overrides?: Partial<ProjectState>): ProjectState => ({
    id: 'test-project-id',
    rootPath: '/test/project',
    name: 'Test Project',
    targetLanguage: 'typescript',
    templateId: 'standard',
    requirements: [],
    decisions: [],
    generatedFiles: [],
    generationMode: 'incremental',
    gitConfig: {
      enabled: true,
      autoCommit: false,
      initialized: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  templateInfo: (overrides?: Partial<TemplateInfo>): TemplateInfo => ({
    id: 'standard',
    name: 'Standard Template',
    description: 'A standard project template',
    category: 'web-app',
    isBuiltIn: true,
    tags: ['typescript', 'react'],
    ...overrides,
  }),

  template: (overrides?: Partial<Template>): Template => ({
    ...mockDefaults.templateInfo(),
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
    variables: [],
    questionFlow: [],
    defaultGenerationMode: 'incremental',
    ...overrides,
  }),
}

/**
 * Event emitter storage for simulating IPC events
 */
interface EventHandlers {
  fileWatch: ((event: FileWatchEvent) => void)[]
  claudeStream: ((event: StreamEvent) => void)[]
}

let eventHandlers: EventHandlers = {
  fileWatch: [],
  claudeStream: [],
}

/**
 * Creates a fresh mocked Electron API with all methods as Jest mocks
 */
export function createMockedAPI(): MockedElectronAPI {
  // Reset event handlers
  eventHandlers = {
    fileWatch: [],
    claudeStream: [],
  }

  return {
    file: {
      read: jest.fn().mockResolvedValue(''),
      write: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(undefined),
      rename: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue(mockDefaults.fileNode()),
      watchStart: jest.fn().mockResolvedValue(undefined),
      watchStop: jest.fn().mockResolvedValue(undefined),
      onWatchEvent: jest.fn((callback) => {
        eventHandlers.fileWatch.push(callback)
        return () => {
          const idx = eventHandlers.fileWatch.indexOf(callback)
          if (idx >= 0) eventHandlers.fileWatch.splice(idx, 1)
        }
      }),
    },

    dir: {
      select: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    },

    claude: {
      init: jest.fn().mockResolvedValue(mockDefaults.claudeInitResult()),
      send: jest.fn().mockResolvedValue(undefined),
      onStream: jest.fn((callback) => {
        eventHandlers.claudeStream.push(callback)
        return () => {
          const idx = eventHandlers.claudeStream.indexOf(callback)
          if (idx >= 0) eventHandlers.claudeStream.splice(idx, 1)
        }
      }),
      cancel: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockResolvedValue(mockDefaults.claudeStatus()),
    },

    git: {
      init: jest.fn().mockResolvedValue({ success: true }),
      connect: jest.fn().mockResolvedValue({ isRepo: true }),
      isRepo: jest.fn().mockResolvedValue(true),
      status: jest.fn().mockResolvedValue(mockDefaults.gitStatus()),
      stage: jest.fn().mockResolvedValue(undefined),
      stageAll: jest.fn().mockResolvedValue(undefined),
      unstage: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(mockDefaults.commitInfo()),
      diff: jest.fn().mockResolvedValue([]),
      log: jest.fn().mockResolvedValue([]),
      setAutoCommit: jest.fn().mockResolvedValue({ success: true }),
      triggerAutoCommit: jest.fn().mockResolvedValue({ success: true }),
    },

    project: {
      load: jest.fn().mockResolvedValue(mockDefaults.projectState()),
      save: jest.fn().mockResolvedValue(undefined),
    },

    template: {
      list: jest.fn().mockResolvedValue([mockDefaults.templateInfo()]),
      get: jest.fn().mockResolvedValue(mockDefaults.template()),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getCustomPath: jest.fn().mockResolvedValue(''),
      getDefaultPath: jest.fn().mockResolvedValue('/app/templates'),
      setCustomPath: jest.fn().mockResolvedValue(undefined),
    },

    updater: {
      check: jest.fn().mockResolvedValue({ status: 'not-available' } as UpdateStatus),
      download: jest.fn().mockResolvedValue(undefined),
      install: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockResolvedValue({ status: 'idle' } as UpdateStatus),
      onStatus: jest.fn((_callback: (status: UpdateStatus) => void) => () => {}),
    },
  }
}

/**
 * Utility functions for simulating IPC events in tests
 */
export const mockIPCEvents = {
  /**
   * Simulate a file watch event
   */
  emitFileWatchEvent(event: FileWatchEvent): void {
    eventHandlers.fileWatch.forEach((handler) => handler(event))
  },

  /**
   * Simulate a Claude stream event
   */
  emitClaudeStreamEvent(event: StreamEvent): void {
    eventHandlers.claudeStream.forEach((handler) => handler(event))
  },

  /**
   * Simulate a complete Claude response
   */
  async emitClaudeResponse(text: string): Promise<void> {
    this.emitClaudeStreamEvent({ type: 'start', timestamp: new Date().toISOString() })
    this.emitClaudeStreamEvent({ type: 'text', content: text })
    this.emitClaudeStreamEvent({ type: 'complete', timestamp: new Date().toISOString() })
  },

  /**
   * Get current file watch handler count (for debugging)
   */
  getFileWatchHandlerCount(): number {
    return eventHandlers.fileWatch.length
  },

  /**
   * Get current Claude stream handler count (for debugging)
   */
  getClaudeStreamHandlerCount(): number {
    return eventHandlers.claudeStream.length
  },
}

/**
 * Get the mocked API from window
 */
export function getMockedAPI(): MockedElectronAPI {
  return window.api as unknown as MockedElectronAPI
}

/**
 * Helper to safely reset mocks in an object
 */
function resetMocksInObject(obj: Record<string, unknown> | undefined): void {
  if (!obj) return
  Object.values(obj).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      ;(mock as jest.Mock).mockClear()
    }
  })
}

/**
 * Reset all mocks to their default state
 */
export function resetMockedAPI(): void {
  // Get API but don't fail if it doesn't exist yet
  const api = window.api as MockedElectronAPI | undefined
  if (!api) {
    // API not set up yet, just set it up fresh
    setupMockedAPI()
    return
  }

  // Reset all mocks in each section
  resetMocksInObject(api.file as unknown as Record<string, unknown>)
  resetMocksInObject(api.dir as unknown as Record<string, unknown>)
  resetMocksInObject(api.claude as unknown as Record<string, unknown>)
  resetMocksInObject(api.git as unknown as Record<string, unknown>)
  resetMocksInObject(api.project as unknown as Record<string, unknown>)
  resetMocksInObject(api.template as unknown as Record<string, unknown>)
  resetMocksInObject(api.updater as unknown as Record<string, unknown>)

  // Reset event handlers
  eventHandlers = {
    fileWatch: [],
    claudeStream: [],
  }
}

/**
 * Setup the mock API on window object
 * Call this in jest.setup.ts or in beforeEach
 */
export function setupMockedAPI(): MockedElectronAPI {
  const api = createMockedAPI()

  Object.defineProperty(window, 'api', {
    value: api,
    writable: true,
    configurable: true,
  })

  return api
}

import type { FileNode, FileWatchEvent } from './file'
import type { ClaudeStatus, StreamEvent, ClaudeInitOptions, ClaudeInitResult } from './git'
import type { ProjectState } from './project'
import type { TemplateInfo, Template } from './template'
import type {
  GitStatus,
  GitServiceOptions,
  CommitInfo,
  DiffOptions,
  FileDiff,
} from '../../main/services/git/types'

/**
 * API exposed to renderer via contextBridge
 */
export interface ElectronAPI {
  file: {
    read(path: string): Promise<string>
    write(path: string, content: string): Promise<void>
    list(path: string): Promise<FileNode>
    watchStart(path: string): Promise<void>
    watchStop(path: string): Promise<void>
    onWatchEvent(callback: (event: FileWatchEvent) => void): () => void
  }

  dir: {
    select(): Promise<string | null>
    create(path: string): Promise<void>
  }

  claude: {
    init(options: ClaudeInitOptions): Promise<ClaudeInitResult>
    send(message: string, context?: ProjectState): Promise<void>
    onStream(callback: (event: StreamEvent) => void): () => void
    cancel(): Promise<void>
    getStatus(): Promise<ClaudeStatus>
  }

  git: {
    init(cwd: string, options?: Partial<GitServiceOptions>): Promise<{ success: boolean }>
    connect(cwd: string, options?: Partial<GitServiceOptions>): Promise<{ isRepo: boolean }>
    isRepo(cwd?: string): Promise<boolean>
    status(): Promise<GitStatus>
    stage(files: string[]): Promise<void>
    stageAll(): Promise<void>
    unstage(files: string[]): Promise<void>
    commit(message: string): Promise<CommitInfo>
    diff(options?: DiffOptions): Promise<FileDiff[]>
    log(limit?: number): Promise<CommitInfo[]>
    setAutoCommit(enabled: boolean): Promise<{ success: boolean }>
    triggerAutoCommit(): Promise<{ success: boolean }>
  }

  project: {
    load(path: string): Promise<ProjectState>
    save(state: ProjectState): Promise<void>
  }

  template: {
    list(): Promise<TemplateInfo[]>
    get(id: string): Promise<Template>
    save(template: Template): Promise<void>
    delete(id: string): Promise<void>
    getCustomPath(): Promise<string>
    getDefaultPath(): Promise<string>
    setCustomPath(path: string | null): Promise<void>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

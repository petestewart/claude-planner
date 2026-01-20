import type { FileNode, FileWatchEvent } from './file'
import type { GitStatus, ClaudeStatus, StreamEvent, ClaudeInitOptions, ClaudeInitResult } from './git'
import type { ProjectState } from './project'
import type { TemplateInfo, Template } from './template'

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

declare global {
  interface Window {
    api: ElectronAPI
  }
}

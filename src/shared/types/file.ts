/**
 * Represents a node in the file tree
 */
export interface FileNode {
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
export interface FileWatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  timestamp: string
}

/**
 * Represents a node in the file tree
 */
export interface FileNode {
  /** Unique identifier (absolute path) */
  id: string

  /** File or directory name */
  name: string

  /** Absolute path */
  path: string

  /** Node type */
  type: 'file' | 'directory'

  /** Children (for directories) */
  children?: FileNode[]

  /** File extension (for files, without dot) */
  extension?: string

  /** Whether the node is expanded in the tree */
  expanded?: boolean

  /** Depth level in tree (0 = root) */
  depth: number
}

/**
 * File status indicators for visual feedback
 */
export type FileStatus =
  | 'normal' // No special status
  | 'new' // Recently created
  | 'modified' // Changed since last view
  | 'generating' // Agent is currently writing
  | 'error' // Read/write error occurred

/**
 * Extended node with status for rendering
 */
export interface FileNodeWithStatus extends FileNode {
  status: FileStatus
  lastModified?: string
}

/**
 * File watcher event
 */
export interface FileWatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  timestamp: string
}

import { create } from 'zustand'
import type { FileNode, FileStatus } from '../../shared/types/file'

interface FileStore {
  /** Root path of current project */
  rootPath: string | null

  /** Tree structure */
  tree: FileNode | null

  /** Currently selected file path */
  selectedPath: string | null

  /** Set of expanded directory paths */
  expandedPaths: Set<string>

  /** Map of path -> status */
  fileStatuses: Map<string, FileStatus>

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: string | null

  // Actions
  setRootPath: (path: string) => Promise<void>
  refreshTree: () => Promise<void>
  selectFile: (path: string) => void
  toggleExpanded: (path: string) => void
  expandPath: (path: string) => void
  collapseAll: () => void
  setFileStatus: (path: string, status: FileStatus) => void
  clearFileStatus: (path: string) => void
}

export const useFileStore = create<FileStore>((set, get) => ({
  rootPath: null,
  tree: null,
  selectedPath: null,
  expandedPaths: new Set<string>(),
  fileStatuses: new Map<string, FileStatus>(),
  isLoading: false,
  error: null,

  setRootPath: async (path: string) => {
    set({ rootPath: path, isLoading: true, error: null })
    try {
      const tree = await window.api.file.list(path)
      set({
        tree,
        isLoading: false,
        expandedPaths: new Set([path]),
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load directory',
        isLoading: false,
      })
    }
  },

  refreshTree: async () => {
    const { rootPath } = get()
    if (!rootPath) return

    set({ isLoading: true, error: null })
    try {
      const tree = await window.api.file.list(rootPath)
      set({ tree, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to refresh directory',
        isLoading: false,
      })
    }
  },

  selectFile: (path: string) => {
    set({ selectedPath: path })
  },

  toggleExpanded: (path: string) => {
    const { expandedPaths } = get()
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    set({ expandedPaths: newExpanded })
  },

  expandPath: (path: string) => {
    const { expandedPaths } = get()
    const newExpanded = new Set(expandedPaths)
    newExpanded.add(path)
    set({ expandedPaths: newExpanded })
  },

  collapseAll: () => {
    const { rootPath } = get()
    // Keep root expanded
    set({ expandedPaths: new Set(rootPath ? [rootPath] : []) })
  },

  setFileStatus: (path: string, status: FileStatus) => {
    const { fileStatuses } = get()
    const newStatuses = new Map(fileStatuses)
    newStatuses.set(path, status)
    set({ fileStatuses: newStatuses })
  },

  clearFileStatus: (path: string) => {
    const { fileStatuses } = get()
    const newStatuses = new Map(fileStatuses)
    newStatuses.delete(path)
    set({ fileStatuses: newStatuses })
  },
}))

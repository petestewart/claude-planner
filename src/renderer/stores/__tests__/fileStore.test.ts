import { useFileStore } from '../fileStore'
import type { FileNode } from '../../../shared/types/file'

// Mock file tree data
const mockTree: FileNode = {
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
        },
      ],
    },
    {
      id: '/test/project/README.md',
      name: 'README.md',
      path: '/test/project/README.md',
      type: 'file',
      depth: 1,
    },
  ],
}

// Reset state before each test
beforeEach(() => {
  useFileStore.setState({
    rootPath: null,
    tree: null,
    selectedPath: null,
    expandedPaths: new Set(),
    fileStatuses: new Map(),
    isLoading: false,
    error: null,
  })
  jest.clearAllMocks()
})

describe('fileStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useFileStore.getState()

      expect(state.rootPath).toBeNull()
      expect(state.tree).toBeNull()
      expect(state.selectedPath).toBeNull()
      expect(state.expandedPaths.size).toBe(0)
      expect(state.fileStatuses.size).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setRootPath', () => {
    it('loads directory tree and sets root path', async () => {
      const mockList = window.api.file.list as jest.Mock
      mockList.mockResolvedValue(mockTree)

      await useFileStore.getState().setRootPath('/test/project')

      const state = useFileStore.getState()
      expect(state.rootPath).toBe('/test/project')
      expect(state.tree).toEqual(mockTree)
      expect(state.isLoading).toBe(false)
      expect(state.expandedPaths.has('/test/project')).toBe(true)
    })

    it('sets loading state while fetching', async () => {
      const mockList = window.api.file.list as jest.Mock
      mockList.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTree), 100))
      )

      const promise = useFileStore.getState().setRootPath('/test/project')
      expect(useFileStore.getState().isLoading).toBe(true)

      await promise
      expect(useFileStore.getState().isLoading).toBe(false)
    })

    it('handles errors', async () => {
      const mockList = window.api.file.list as jest.Mock
      mockList.mockRejectedValue(new Error('Directory not found'))

      await useFileStore.getState().setRootPath('/invalid/path')

      const state = useFileStore.getState()
      expect(state.error).toBe('Directory not found')
      expect(state.isLoading).toBe(false)
      expect(state.tree).toBeNull()
    })
  })

  describe('refreshTree', () => {
    it('reloads the tree from current root path', async () => {
      const mockList = window.api.file.list as jest.Mock
      mockList.mockResolvedValue(mockTree)

      // Set initial root path
      await useFileStore.getState().setRootPath('/test/project')

      // Clear mock calls
      mockList.mockClear()

      // Update mock to return different tree
      const updatedTree = { ...mockTree, name: 'project-updated' }
      mockList.mockResolvedValue(updatedTree)

      await useFileStore.getState().refreshTree()

      const state = useFileStore.getState()
      expect(state.tree).toEqual(updatedTree)
      expect(mockList).toHaveBeenCalledWith('/test/project')
    })

    it('does nothing if no root path set', async () => {
      const mockList = window.api.file.list as jest.Mock

      await useFileStore.getState().refreshTree()

      expect(mockList).not.toHaveBeenCalled()
    })
  })

  describe('selectFile', () => {
    it('sets the selected path', () => {
      useFileStore.getState().selectFile('/test/project/src/index.ts')

      expect(useFileStore.getState().selectedPath).toBe('/test/project/src/index.ts')
    })

    it('can change selected file', () => {
      const { selectFile } = useFileStore.getState()

      selectFile('/test/project/file1.ts')
      expect(useFileStore.getState().selectedPath).toBe('/test/project/file1.ts')

      selectFile('/test/project/file2.ts')
      expect(useFileStore.getState().selectedPath).toBe('/test/project/file2.ts')
    })
  })

  describe('toggleExpanded', () => {
    it('adds path to expanded set if not present', () => {
      useFileStore.getState().toggleExpanded('/test/project/src')

      expect(useFileStore.getState().expandedPaths.has('/test/project/src')).toBe(true)
    })

    it('removes path from expanded set if present', () => {
      // First expand it
      useFileStore.getState().toggleExpanded('/test/project/src')
      expect(useFileStore.getState().expandedPaths.has('/test/project/src')).toBe(true)

      // Then toggle to collapse
      useFileStore.getState().toggleExpanded('/test/project/src')
      expect(useFileStore.getState().expandedPaths.has('/test/project/src')).toBe(false)
    })
  })

  describe('expandPath', () => {
    it('adds path to expanded set', () => {
      useFileStore.getState().expandPath('/test/project/src')

      expect(useFileStore.getState().expandedPaths.has('/test/project/src')).toBe(true)
    })

    it('does not duplicate if already expanded', () => {
      const { expandPath } = useFileStore.getState()

      expandPath('/test/project/src')
      expandPath('/test/project/src')

      // Set should only contain one entry
      const paths = Array.from(useFileStore.getState().expandedPaths)
      expect(paths.filter((p) => p === '/test/project/src')).toHaveLength(1)
    })
  })

  describe('collapseAll', () => {
    it('collapses all paths except root', async () => {
      const mockList = window.api.file.list as jest.Mock
      mockList.mockResolvedValue(mockTree)

      // Set up with root path and expand some directories
      await useFileStore.getState().setRootPath('/test/project')
      useFileStore.getState().expandPath('/test/project/src')
      useFileStore.getState().expandPath('/test/project/src/components')

      // Verify multiple paths are expanded
      expect(useFileStore.getState().expandedPaths.size).toBeGreaterThan(1)

      // Collapse all
      useFileStore.getState().collapseAll()

      const state = useFileStore.getState()
      expect(state.expandedPaths.size).toBe(1)
      expect(state.expandedPaths.has('/test/project')).toBe(true)
    })

    it('handles case with no root path', () => {
      useFileStore.getState().expandPath('/some/path')

      useFileStore.getState().collapseAll()

      expect(useFileStore.getState().expandedPaths.size).toBe(0)
    })
  })

  describe('setFileStatus', () => {
    it('sets status for a file path', () => {
      useFileStore.getState().setFileStatus('/test/project/file.ts', 'modified')

      const statuses = useFileStore.getState().fileStatuses
      expect(statuses.get('/test/project/file.ts')).toBe('modified')
    })

    it('can update existing status', () => {
      const { setFileStatus } = useFileStore.getState()

      setFileStatus('/test/project/file.ts', 'new')
      expect(useFileStore.getState().fileStatuses.get('/test/project/file.ts')).toBe('new')

      setFileStatus('/test/project/file.ts', 'modified')
      expect(useFileStore.getState().fileStatuses.get('/test/project/file.ts')).toBe('modified')
    })

    it('can track multiple file statuses', () => {
      const { setFileStatus } = useFileStore.getState()

      setFileStatus('/test/project/file1.ts', 'new')
      setFileStatus('/test/project/file2.ts', 'modified')
      setFileStatus('/test/project/file3.ts', 'generating')

      const statuses = useFileStore.getState().fileStatuses
      expect(statuses.size).toBe(3)
      expect(statuses.get('/test/project/file1.ts')).toBe('new')
      expect(statuses.get('/test/project/file2.ts')).toBe('modified')
      expect(statuses.get('/test/project/file3.ts')).toBe('generating')
    })
  })

  describe('clearFileStatus', () => {
    it('removes status for a file path', () => {
      const { setFileStatus, clearFileStatus } = useFileStore.getState()

      setFileStatus('/test/project/file.ts', 'modified')
      expect(useFileStore.getState().fileStatuses.has('/test/project/file.ts')).toBe(true)

      clearFileStatus('/test/project/file.ts')
      expect(useFileStore.getState().fileStatuses.has('/test/project/file.ts')).toBe(false)
    })

    it('does nothing if path has no status', () => {
      useFileStore.getState().clearFileStatus('/nonexistent/file.ts')

      expect(useFileStore.getState().fileStatuses.size).toBe(0)
    })
  })
})

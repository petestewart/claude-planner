import { useEditorStore } from '../editorStore'
import type { FileConflict } from '../editorStore'

// Reset state before each test
beforeEach(() => {
  useEditorStore.setState({
    activeFile: null,
    openFiles: new Map(),
    mode: 'markdown',
    autoSaveEnabled: false,
    autoSaveDelay: 1000,
    conflict: null,
  })
  jest.clearAllMocks()
})

describe('editorStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useEditorStore.getState()

      expect(state.activeFile).toBeNull()
      expect(state.openFiles.size).toBe(0)
      expect(state.mode).toBe('markdown')
      expect(state.autoSaveEnabled).toBe(false)
      expect(state.autoSaveDelay).toBe(1000)
      expect(state.conflict).toBeNull()
    })
  })

  describe('openFile', () => {
    it('opens a file and sets it as active', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('# Hello World')

      await useEditorStore.getState().openFile('/test/file.md')

      const state = useEditorStore.getState()
      expect(state.activeFile).toBe('/test/file.md')
      expect(state.openFiles.has('/test/file.md')).toBe(true)

      const file = state.openFiles.get('/test/file.md')
      expect(file?.content).toBe('# Hello World')
      expect(file?.savedContent).toBe('# Hello World')
      expect(file?.isDirty).toBe(false)
      expect(file?.name).toBe('file.md')
    })

    it('makes already open file active without reloading', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('content')

      // Open file first time
      await useEditorStore.getState().openFile('/test/file.md')
      expect(mockRead).toHaveBeenCalledTimes(1)

      // Modify content
      useEditorStore.getState().updateContent('/test/file.md', 'modified content')

      // Open same file again
      mockRead.mockClear()
      await useEditorStore.getState().openFile('/test/file.md')

      // Should not reload from disk
      expect(mockRead).not.toHaveBeenCalled()
      // Content should still be modified
      expect(useEditorStore.getState().openFiles.get('/test/file.md')?.content).toBe(
        'modified content'
      )
    })

    it('throws error if file cannot be read', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockRejectedValue(new Error('File not found'))

      await expect(useEditorStore.getState().openFile('/nonexistent/file.md')).rejects.toThrow(
        'File not found'
      )
    })
  })

  describe('closeFile', () => {
    it('removes file from open files', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('content')

      await useEditorStore.getState().openFile('/test/file.md')
      expect(useEditorStore.getState().openFiles.has('/test/file.md')).toBe(true)

      useEditorStore.getState().closeFile('/test/file.md')
      expect(useEditorStore.getState().openFiles.has('/test/file.md')).toBe(false)
    })

    it('switches active file to another open file when closing active', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('content')

      await useEditorStore.getState().openFile('/test/file1.md')
      await useEditorStore.getState().openFile('/test/file2.md')

      expect(useEditorStore.getState().activeFile).toBe('/test/file2.md')

      useEditorStore.getState().closeFile('/test/file2.md')

      expect(useEditorStore.getState().activeFile).toBe('/test/file1.md')
    })

    it('sets active file to null when closing last open file', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('content')

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().closeFile('/test/file.md')

      expect(useEditorStore.getState().activeFile).toBeNull()
    })
  })

  describe('setActiveFile', () => {
    it('sets the active file', () => {
      useEditorStore.getState().setActiveFile('/test/file.md')

      expect(useEditorStore.getState().activeFile).toBe('/test/file.md')
    })
  })

  describe('updateContent', () => {
    it('updates content and marks file as dirty', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('original content')

      await useEditorStore.getState().openFile('/test/file.md')

      useEditorStore.getState().updateContent('/test/file.md', 'modified content')

      const file = useEditorStore.getState().openFiles.get('/test/file.md')
      expect(file?.content).toBe('modified content')
      expect(file?.isDirty).toBe(true)
    })

    it('marks file as not dirty when content matches saved content', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('original content')

      await useEditorStore.getState().openFile('/test/file.md')

      // Modify
      useEditorStore.getState().updateContent('/test/file.md', 'modified')
      expect(useEditorStore.getState().openFiles.get('/test/file.md')?.isDirty).toBe(true)

      // Revert to original
      useEditorStore.getState().updateContent('/test/file.md', 'original content')
      expect(useEditorStore.getState().openFiles.get('/test/file.md')?.isDirty).toBe(false)
    })

    it('does nothing for unopened file', () => {
      useEditorStore.getState().updateContent('/nonexistent/file.md', 'content')

      expect(useEditorStore.getState().openFiles.size).toBe(0)
    })
  })

  describe('saveFile', () => {
    it('saves file to disk and clears dirty flag', async () => {
      const mockRead = window.api.file.read as jest.Mock
      const mockWrite = window.api.file.write as jest.Mock
      mockRead.mockResolvedValue('original')
      mockWrite.mockResolvedValue(undefined)

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'modified')

      expect(useEditorStore.getState().openFiles.get('/test/file.md')?.isDirty).toBe(true)

      await useEditorStore.getState().saveFile('/test/file.md')

      expect(mockWrite).toHaveBeenCalledWith('/test/file.md', 'modified')
      expect(useEditorStore.getState().openFiles.get('/test/file.md')?.isDirty).toBe(false)
    })

    it('updates savedContent after save', async () => {
      const mockRead = window.api.file.read as jest.Mock
      const mockWrite = window.api.file.write as jest.Mock
      mockRead.mockResolvedValue('original')
      mockWrite.mockResolvedValue(undefined)

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'new content')

      await useEditorStore.getState().saveFile('/test/file.md')

      const file = useEditorStore.getState().openFiles.get('/test/file.md')
      expect(file?.savedContent).toBe('new content')
    })
  })

  describe('saveActiveFile', () => {
    it('saves the currently active file', async () => {
      const mockRead = window.api.file.read as jest.Mock
      const mockWrite = window.api.file.write as jest.Mock
      mockRead.mockResolvedValue('content')
      mockWrite.mockResolvedValue(undefined)

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'modified')

      await useEditorStore.getState().saveActiveFile()

      expect(mockWrite).toHaveBeenCalledWith('/test/file.md', 'modified')
    })

    it('does nothing if no active file', async () => {
      const mockWrite = window.api.file.write as jest.Mock

      await useEditorStore.getState().saveActiveFile()

      expect(mockWrite).not.toHaveBeenCalled()
    })
  })

  describe('saveAllFiles', () => {
    it('saves all dirty files', async () => {
      const mockRead = window.api.file.read as jest.Mock
      const mockWrite = window.api.file.write as jest.Mock
      mockRead.mockResolvedValue('content')
      mockWrite.mockResolvedValue(undefined)

      await useEditorStore.getState().openFile('/test/file1.md')
      await useEditorStore.getState().openFile('/test/file2.md')
      await useEditorStore.getState().openFile('/test/file3.md')

      useEditorStore.getState().updateContent('/test/file1.md', 'modified1')
      useEditorStore.getState().updateContent('/test/file3.md', 'modified3')
      // file2 is not dirty

      await useEditorStore.getState().saveAllFiles()

      expect(mockWrite).toHaveBeenCalledTimes(2)
      expect(mockWrite).toHaveBeenCalledWith('/test/file1.md', 'modified1')
      expect(mockWrite).toHaveBeenCalledWith('/test/file3.md', 'modified3')
    })
  })

  describe('setMode', () => {
    it('sets the editor mode', () => {
      useEditorStore.getState().setMode('wysiwyg')
      expect(useEditorStore.getState().mode).toBe('wysiwyg')

      useEditorStore.getState().setMode('markdown')
      expect(useEditorStore.getState().mode).toBe('markdown')
    })
  })

  describe('reloadFromDisk', () => {
    it('reloads file content from disk', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('original')

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'local changes')

      // Simulate external change
      mockRead.mockResolvedValue('external change')

      await useEditorStore.getState().reloadFromDisk('/test/file.md')

      const file = useEditorStore.getState().openFiles.get('/test/file.md')
      expect(file?.content).toBe('external change')
      expect(file?.savedContent).toBe('external change')
      expect(file?.isDirty).toBe(false)
    })
  })

  describe('setSelection', () => {
    it('sets cursor selection for a file', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('content')

      await useEditorStore.getState().openFile('/test/file.md')

      useEditorStore.getState().setSelection('/test/file.md', { anchor: 5, head: 10 })

      const file = useEditorStore.getState().openFiles.get('/test/file.md')
      expect(file?.selection).toEqual({ anchor: 5, head: 10 })
    })
  })

  describe('markSaved', () => {
    it('marks file as saved without writing to disk', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('original')

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'modified')

      expect(useEditorStore.getState().openFiles.get('/test/file.md')?.isDirty).toBe(true)

      useEditorStore.getState().markSaved('/test/file.md')

      const file = useEditorStore.getState().openFiles.get('/test/file.md')
      expect(file?.isDirty).toBe(false)
      expect(file?.savedContent).toBe('modified')
    })
  })

  describe('setAutoSaveEnabled', () => {
    it('enables and disables auto-save', () => {
      useEditorStore.getState().setAutoSaveEnabled(true)
      expect(useEditorStore.getState().autoSaveEnabled).toBe(true)

      useEditorStore.getState().setAutoSaveEnabled(false)
      expect(useEditorStore.getState().autoSaveEnabled).toBe(false)
    })
  })

  describe('conflict handling', () => {
    it('showConflict sets conflict state', () => {
      const conflict: FileConflict = {
        path: '/test/file.md',
        editorContent: 'local content',
        diskContent: 'disk content',
        diskModifiedAt: '2024-01-01T00:00:00Z',
      }

      useEditorStore.getState().showConflict(conflict)

      expect(useEditorStore.getState().conflict).toEqual(conflict)
    })

    it('resolveConflict with load-disk loads disk content', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('original')

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'local changes')

      const conflict: FileConflict = {
        path: '/test/file.md',
        editorContent: 'local changes',
        diskContent: 'disk content',
        diskModifiedAt: '2024-01-01T00:00:00Z',
      }

      useEditorStore.getState().showConflict(conflict)
      useEditorStore.getState().resolveConflict('load-disk')

      const state = useEditorStore.getState()
      expect(state.conflict).toBeNull()

      const file = state.openFiles.get('/test/file.md')
      expect(file?.content).toBe('disk content')
      expect(file?.savedContent).toBe('disk content')
      expect(file?.isDirty).toBe(false)
    })

    it('resolveConflict with keep-editor keeps local content and marks dirty', async () => {
      const mockRead = window.api.file.read as jest.Mock
      mockRead.mockResolvedValue('original')

      await useEditorStore.getState().openFile('/test/file.md')
      useEditorStore.getState().updateContent('/test/file.md', 'local changes')

      const conflict: FileConflict = {
        path: '/test/file.md',
        editorContent: 'local changes',
        diskContent: 'disk content',
        diskModifiedAt: '2024-01-01T00:00:00Z',
      }

      useEditorStore.getState().showConflict(conflict)
      useEditorStore.getState().resolveConflict('keep-editor')

      const state = useEditorStore.getState()
      expect(state.conflict).toBeNull()

      const file = state.openFiles.get('/test/file.md')
      expect(file?.content).toBe('local changes')
      expect(file?.isDirty).toBe(true)
    })
  })
})

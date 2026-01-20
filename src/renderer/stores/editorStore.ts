import { create } from 'zustand'

interface EditorSelection {
  anchor: number
  head: number
}

interface OpenFile {
  path: string
  name: string
  content: string
  savedContent: string
  isDirty: boolean
  diskModifiedAt: string | null
  selection: EditorSelection
  scrollPosition: number
}

interface EditorStore {
  activeFile: string | null
  openFiles: Map<string, OpenFile>
  mode: 'wysiwyg' | 'markdown'
  autoSaveEnabled: boolean
  autoSaveDelay: number

  // Actions
  openFile: (filePath: string) => Promise<void>
  closeFile: (filePath: string) => void
  setActiveFile: (filePath: string) => void
  updateContent: (filePath: string, content: string) => void
  saveFile: (filePath: string) => Promise<void>
  saveActiveFile: () => Promise<void>
  saveAllFiles: () => Promise<void>
  setMode: (mode: 'wysiwyg' | 'markdown') => void
  reloadFromDisk: (filePath: string) => Promise<void>
  setSelection: (filePath: string, selection: EditorSelection) => void
  markSaved: (filePath: string) => void
}

function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeFile: null,
  openFiles: new Map(),
  mode: 'markdown',
  autoSaveEnabled: false,
  autoSaveDelay: 1000,

  openFile: async (filePath: string) => {
    const { openFiles } = get()

    // If file is already open, just make it active
    if (openFiles.has(filePath)) {
      set({ activeFile: filePath })
      return
    }

    // Load file content
    try {
      const content = await window.api.file.read(filePath)
      const newFile: OpenFile = {
        path: filePath,
        name: getFileName(filePath),
        content,
        savedContent: content,
        isDirty: false,
        diskModifiedAt: new Date().toISOString(),
        selection: { anchor: 0, head: 0 },
        scrollPosition: 0,
      }

      const newOpenFiles = new Map(openFiles)
      newOpenFiles.set(filePath, newFile)
      set({ openFiles: newOpenFiles, activeFile: filePath })
    } catch (error) {
      console.error('Failed to open file:', error)
      throw error
    }
  },

  closeFile: (filePath: string) => {
    const { openFiles, activeFile } = get()
    const newOpenFiles = new Map(openFiles)
    newOpenFiles.delete(filePath)

    // If closing the active file, switch to another
    let newActiveFile = activeFile
    if (activeFile === filePath) {
      const paths = Array.from(newOpenFiles.keys())
      newActiveFile = paths.length > 0 ? paths[paths.length - 1] ?? null : null
    }

    set({ openFiles: newOpenFiles, activeFile: newActiveFile })
  },

  setActiveFile: (filePath: string) => {
    set({ activeFile: filePath })
  },

  updateContent: (filePath: string, content: string) => {
    const { openFiles } = get()
    const file = openFiles.get(filePath)
    if (!file) return

    const newOpenFiles = new Map(openFiles)
    newOpenFiles.set(filePath, {
      ...file,
      content,
      isDirty: content !== file.savedContent,
    })
    set({ openFiles: newOpenFiles })
  },

  saveFile: async (filePath: string) => {
    const { openFiles } = get()
    const file = openFiles.get(filePath)
    if (!file) return

    try {
      await window.api.file.write(filePath, file.content)
      const newOpenFiles = new Map(openFiles)
      newOpenFiles.set(filePath, {
        ...file,
        savedContent: file.content,
        isDirty: false,
        diskModifiedAt: new Date().toISOString(),
      })
      set({ openFiles: newOpenFiles })
    } catch (error) {
      console.error('Failed to save file:', error)
      throw error
    }
  },

  saveActiveFile: async () => {
    const { activeFile, saveFile } = get()
    if (activeFile) {
      await saveFile(activeFile)
    }
  },

  saveAllFiles: async () => {
    const { openFiles, saveFile } = get()
    for (const [filePath, file] of openFiles) {
      if (file.isDirty) {
        await saveFile(filePath)
      }
    }
  },

  setMode: (mode: 'wysiwyg' | 'markdown') => {
    set({ mode })
  },

  reloadFromDisk: async (filePath: string) => {
    const { openFiles } = get()
    const file = openFiles.get(filePath)
    if (!file) return

    try {
      const content = await window.api.file.read(filePath)
      const newOpenFiles = new Map(openFiles)
      newOpenFiles.set(filePath, {
        ...file,
        content,
        savedContent: content,
        isDirty: false,
        diskModifiedAt: new Date().toISOString(),
      })
      set({ openFiles: newOpenFiles })
    } catch (error) {
      console.error('Failed to reload file:', error)
      throw error
    }
  },

  setSelection: (filePath: string, selection: EditorSelection) => {
    const { openFiles } = get()
    const file = openFiles.get(filePath)
    if (!file) return

    const newOpenFiles = new Map(openFiles)
    newOpenFiles.set(filePath, { ...file, selection })
    set({ openFiles: newOpenFiles })
  },

  markSaved: (filePath: string) => {
    const { openFiles } = get()
    const file = openFiles.get(filePath)
    if (!file) return

    const newOpenFiles = new Map(openFiles)
    newOpenFiles.set(filePath, {
      ...file,
      savedContent: file.content,
      isDirty: false,
    })
    set({ openFiles: newOpenFiles })
  },
}))

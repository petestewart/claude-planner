import { useEffect } from 'react'
import { useEditorStore } from '../../../stores/editorStore'

export interface FileConflict {
  path: string
  editorContent: string
  diskContent: string
  diskModifiedAt: string
}

/**
 * Hook that detects external changes to open files and handles conflicts.
 * - If the file has no local changes, it auto-reloads from disk
 * - If the file has unsaved changes, it shows a conflict dialog
 *
 * @param path - The file path to sync, or null if no file is open
 */
export function useFileSync(path: string | null): void {
  useEffect(() => {
    if (!path) return

    const unsubscribe = window.api.file.onWatchEvent((event) => {
      // Only care about changes to the current file
      if (event.path !== path || event.type !== 'change') return

      const store = useEditorStore.getState()
      const openFile = store.openFiles.get(path)

      if (!openFile) return

      // File changed externally
      if (openFile.isDirty) {
        // User has unsaved changes - show conflict dialog
        // Load the new content from disk to show in conflict dialog
        void (async () => {
          try {
            const diskContent = await window.api.file.read(path)
            store.showConflict({
              path,
              editorContent: openFile.content,
              diskContent,
              diskModifiedAt: new Date().toISOString(),
            })
          } catch (error) {
            console.error('Failed to read file for conflict dialog:', error)
          }
        })()
      } else {
        // No local changes - auto-reload
        void store.reloadFromDisk(path)
      }
    })

    return unsubscribe
  }, [path])
}

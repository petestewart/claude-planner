import { useEffect } from 'react'
import { useFileStore } from '../../../stores/fileStore'

const STATUS_CLEAR_DELAY = 3000 // 3 seconds

export function useFileWatcher(): void {
  const rootPath = useFileStore((state) => state.rootPath)
  const refreshTree = useFileStore((state) => state.refreshTree)
  const setFileStatus = useFileStore((state) => state.setFileStatus)
  const clearFileStatus = useFileStore((state) => state.clearFileStatus)

  useEffect(() => {
    if (!rootPath) return

    // Start watching the root directory
    void window.api.file.watchStart(rootPath)

    // Subscribe to file watch events
    const unsubscribe = window.api.file.onWatchEvent((event) => {
      switch (event.type) {
        case 'add':
        case 'addDir':
          // Refresh tree and mark as new
          void refreshTree()
          setFileStatus(event.path, 'new')
          // Clear status after delay
          setTimeout(() => {
            clearFileStatus(event.path)
          }, STATUS_CLEAR_DELAY)
          break

        case 'change':
          // Mark as modified
          setFileStatus(event.path, 'modified')
          // Clear status after delay
          setTimeout(() => {
            clearFileStatus(event.path)
          }, STATUS_CLEAR_DELAY)
          break

        case 'unlink':
        case 'unlinkDir':
          // Refresh tree to remove the node
          void refreshTree()
          break
      }
    })

    // Cleanup
    return () => {
      void window.api.file.watchStop(rootPath)
      unsubscribe()
    }
  }, [rootPath, refreshTree, setFileStatus, clearFileStatus])
}

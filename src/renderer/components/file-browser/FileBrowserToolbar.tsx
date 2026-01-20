import type { ReactElement } from 'react'
import styles from './file-browser.module.css'

interface FileBrowserToolbarProps {
  onRefresh: () => void
  onCollapseAll: () => void
  onNewFile: () => void
  onNewFolder: () => void
  isLoading: boolean
}

export function FileBrowserToolbar({
  onRefresh,
  onCollapseAll,
  onNewFile,
  onNewFolder,
  isLoading,
}: FileBrowserToolbarProps): ReactElement {
  return (
    <div className={styles.toolbar}>
      <span className={styles.toolbarTitle}>Files</span>
      <div className={styles.toolbarActions}>
        <button
          className={styles.toolbarButton}
          onClick={onNewFile}
          title="New File"
          aria-label="New File"
        >
          📄+
        </button>
        <button
          className={styles.toolbarButton}
          onClick={onNewFolder}
          title="New Folder"
          aria-label="New Folder"
        >
          📁+
        </button>
        <button
          className={styles.toolbarButton}
          onClick={onCollapseAll}
          title="Collapse All"
          aria-label="Collapse All"
        >
          ⊟
        </button>
        <button
          className={styles.toolbarButton}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
          aria-label="Refresh"
        >
          {isLoading ? '⟳' : '↻'}
        </button>
      </div>
    </div>
  )
}

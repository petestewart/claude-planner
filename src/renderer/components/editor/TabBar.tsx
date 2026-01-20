import type { ReactElement, MouseEvent as ReactMouseEvent } from 'react'
import styles from './editor.module.css'

interface OpenFile {
  path: string
  name: string
  isDirty: boolean
}

interface TabBarProps {
  files: OpenFile[]
  activePath: string | null
  onTabClick: (path: string) => void
  onTabClose: (path: string) => void
}

export function TabBar({
  files,
  activePath,
  onTabClick,
  onTabClose,
}: TabBarProps): ReactElement {
  const handleClose = (
    e: ReactMouseEvent,
    path: string
  ): void => {
    e.stopPropagation()
    onTabClose(path)
  }

  if (files.length === 0) {
    return <div className={styles.tabBar} />
  }

  return (
    <div className={styles.tabBar}>
      {files.map((file) => (
        <div
          key={file.path}
          className={`${styles.tab} ${file.path === activePath ? styles['tab--active'] : ''}`}
          onClick={() => onTabClick(file.path)}
          title={file.path}
          role="tab"
          aria-selected={file.path === activePath}
        >
          <span className={styles.tabName}>{file.name}</span>
          {file.isDirty && (
            <span className={styles.tabDirtyIndicator} title="Unsaved changes" />
          )}
          <button
            className={styles.tabCloseButton}
            onClick={(e) => handleClose(e, file.path)}
            title="Close"
            aria-label={`Close ${file.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

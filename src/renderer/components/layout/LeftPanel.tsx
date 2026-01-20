import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'
import { FileBrowser } from '../file-browser'
import { HorizontalDivider } from './HorizontalDivider'
import styles from './LeftPanel.module.css'

interface LeftPanelProps {
  width: number
}

export function LeftPanel({ width }: LeftPanelProps): ReactElement {
  const { fileBrowserHeight, setFileBrowserHeight } = useLayoutStore()

  const handleDividerDrag = (deltaY: number): void => {
    // Convert pixel delta to percentage
    const panelHeight = document.querySelector(
      `.${styles.leftPanel}`
    )?.clientHeight
    if (panelHeight) {
      const percentChange = (deltaY / panelHeight) * 100
      setFileBrowserHeight(fileBrowserHeight + percentChange)
    }
  }

  const handleOpenFile = useCallback((path: string) => {
    // TODO: Open file in editor (Phase 5)
    console.warn('Open file:', path)
  }, [])

  return (
    <aside className={styles.leftPanel} style={{ width }}>
      <div
        className={styles.fileBrowser}
        style={{ height: `${fileBrowserHeight}%` }}
      >
        <FileBrowser onOpenFile={handleOpenFile} />
      </div>
      <HorizontalDivider onDrag={handleDividerDrag} />
      <div
        className={styles.editorPanel}
        style={{ height: `${100 - fileBrowserHeight}%` }}
      >
        <div className={styles.placeholder}>
          <span>📝 Editor</span>
          <span className={styles.hint}>Select a file to edit</span>
        </div>
      </div>
    </aside>
  )
}

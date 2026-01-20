import type { ReactElement } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'
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

  return (
    <aside className={styles.leftPanel} style={{ width }}>
      <div
        className={styles.fileBrowser}
        style={{ height: `${fileBrowserHeight}%` }}
      >
        <div className={styles.placeholder}>
          <span>📁 File Browser</span>
          <span className={styles.hint}>Project files will appear here</span>
        </div>
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

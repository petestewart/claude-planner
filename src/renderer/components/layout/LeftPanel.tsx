import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'
import { useEditorStore } from '../../stores/editorStore'
import { FileBrowser } from '../file-browser'
import { MarkdownEditor } from '../editor'
import { HorizontalDivider } from './HorizontalDivider'
import styles from './LeftPanel.module.css'

interface LeftPanelProps {
  width: number
}

export function LeftPanel({ width }: LeftPanelProps): ReactElement {
  const { fileBrowserHeight, setFileBrowserHeight } = useLayoutStore()
  const openFile = useEditorStore((state) => state.openFile)

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

  const handleOpenFile = useCallback(
    (path: string) => {
      // Only open markdown/text files in editor
      const ext = path.split('.').pop()?.toLowerCase()
      const textExtensions = ['md', 'txt', 'json', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'yml', 'yaml']
      if (ext && textExtensions.includes(ext)) {
        void openFile(path)
      }
    },
    [openFile]
  )

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
        <MarkdownEditor />
      </div>
    </aside>
  )
}

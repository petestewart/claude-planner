import type { CSSProperties, ReactElement } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'
import { LeftPanel } from './LeftPanel'
import { PanelResizer } from './PanelResizer'
import { RightPanel } from './RightPanel'
import styles from './MainLayout.module.css'

export function MainLayout(): ReactElement {
  const { leftPanelWidth, leftPanelCollapsed, setLeftPanelWidth } =
    useLayoutStore()

  const handleResize = (deltaX: number): void => {
    setLeftPanelWidth(leftPanelWidth + deltaX)
  }

  const effectiveWidth = leftPanelCollapsed ? 0 : leftPanelWidth

  return (
    <main
      className={styles.mainLayout}
      style={
        {
          '--current-left-panel-width': `${effectiveWidth}px`,
        } as CSSProperties
      }
    >
      {!leftPanelCollapsed && <LeftPanel width={leftPanelWidth} />}
      <PanelResizer onResize={handleResize} collapsed={leftPanelCollapsed} />
      <RightPanel />
    </main>
  )
}

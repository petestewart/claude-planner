import type { MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'
import styles from './PanelResizer.module.css'

interface PanelResizerProps {
  onResize: (deltaX: number) => void
  collapsed?: boolean
}

export function PanelResizer({
  onResize,
  collapsed = false,
}: PanelResizerProps): ReactElement {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const { toggleLeftPanel } = useLayoutStore()

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent): void => {
      if (collapsed) {
        toggleLeftPanel()
        return
      }
      setIsDragging(true)
      setStartX(e.clientX)
      e.preventDefault()
    },
    [collapsed, toggleLeftPanel]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      if (!isDragging) return
      const deltaX = e.clientX - startX
      onResize(deltaX)
      setStartX(e.clientX)
    },
    [isDragging, startX, onResize]
  )

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      className={`${styles.resizer} ${isDragging ? styles.active : ''} ${collapsed ? styles.collapsed : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label={
        collapsed ? 'Expand left panel' : 'Resize panels horizontally'
      }
      tabIndex={0}
    >
      {collapsed && <span className={styles.expandIcon}>›</span>}
    </div>
  )
}

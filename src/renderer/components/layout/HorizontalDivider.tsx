import type { ReactElement, MouseEvent as ReactMouseEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import styles from './HorizontalDivider.module.css'

interface HorizontalDividerProps {
  onDrag: (deltaY: number) => void
}

export function HorizontalDivider({
  onDrag,
}: HorizontalDividerProps): ReactElement {
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)

  const handleMouseDown = useCallback((e: ReactMouseEvent): void => {
    setIsDragging(true)
    setStartY(e.clientY)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      if (!isDragging) return
      const deltaY = e.clientY - startY
      onDrag(deltaY)
      setStartY(e.clientY)
    },
    [isDragging, startY, onDrag]
  )

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'row-resize'
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
      className={`${styles.divider} ${isDragging ? styles.active : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize panels vertically"
      tabIndex={0}
    />
  )
}

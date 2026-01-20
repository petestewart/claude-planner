import type { ReactElement } from 'react'
import { useEffect, useRef, useCallback } from 'react'
import styles from './ContextMenu.module.css'

/**
 * Context menu action definition
 */
export interface ContextMenuAction {
  /** Unique identifier for the action */
  id: string
  /** Display label */
  label: string
  /** Optional icon (emoji or unicode) */
  icon?: string
  /** Optional keyboard shortcut display */
  shortcut?: string
  /** Whether the action is disabled */
  disabled?: boolean
  /** Whether this is a destructive action (red styling) */
  danger?: boolean
  /** Handler called when action is clicked */
  handler: () => void
}

/**
 * Separator in context menu
 */
export interface ContextMenuSeparator {
  id: string
  separator: true
}

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparator

export interface ContextMenuProps {
  /** X position (clientX) */
  x: number
  /** Y position (clientY) */
  y: number
  /** Menu items to display */
  items: ContextMenuItem[]
  /** Called when menu should close */
  onClose: () => void
}

function isSeparator(item: ContextMenuItem): item is ContextMenuSeparator {
  return 'separator' in item && item.separator === true
}

/**
 * ContextMenu - Right-click context menu component
 *
 * Shows a popup menu at the specified position with the given actions.
 * Automatically adjusts position to stay within viewport.
 */
export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: ContextMenuProps): ReactElement {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    },
    [onClose]
  )

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClickOutside, handleKeyDown])

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8
      }

      menu.style.left = `${adjustedX}px`
      menu.style.top = `${adjustedY}px`
    }
  }, [x, y])

  const handleItemClick = (item: ContextMenuAction): void => {
    if (!item.disabled) {
      item.handler()
      onClose()
    }
  }

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) =>
        isSeparator(item) ? (
          <div key={item.id} className={styles.separator} role="separator" />
        ) : (
          <button
            key={item.id}
            type="button"
            className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''} ${item.disabled ? styles.menuItemDisabled : ''}`}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            role="menuitem"
          >
            {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
            <span className={styles.menuItemLabel}>{item.label}</span>
            {item.shortcut && (
              <span className={styles.menuItemShortcut}>{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  )
}

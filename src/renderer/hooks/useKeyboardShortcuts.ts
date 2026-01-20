import { useEffect } from 'react'
import { useLayoutStore } from '../stores/layoutStore'

interface KeyboardShortcut {
  key: string
  modifiers: {
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    alt?: boolean
  }
  action: () => void
}

function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

  // Check if the right modifier combo is pressed
  if (shortcut.modifiers.meta || shortcut.modifiers.ctrl) {
    if (!cmdOrCtrl) return false
  }

  if (shortcut.modifiers.shift && !event.shiftKey) return false
  if (shortcut.modifiers.alt && !event.altKey) return false

  return event.key.toLowerCase() === shortcut.key.toLowerCase()
}

export function useKeyboardShortcuts(): void {
  const toggleLeftPanel = useLayoutStore((state) => state.toggleLeftPanel)

  useEffect(() => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'b',
        modifiers: { meta: true, ctrl: true },
        action: toggleLeftPanel,
      },
    ]

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Ignore shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault()
          shortcut.action()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleLeftPanel])
}

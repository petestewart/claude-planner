import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

interface FocusTrapOptions {
  enabled?: boolean
  initialFocus?: RefObject<HTMLElement | null>
  returnFocus?: boolean
}

/**
 * Hook for trapping focus within a container element.
 * Useful for modals and dialogs to ensure keyboard accessibility.
 */
export function useFocusTrap<T extends HTMLElement>(
  options: FocusTrapOptions = {}
): RefObject<T | null> {
  const { enabled = true, initialFocus, returnFocus = true } = options
  const containerRef = useRef<T | null>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement

    const container = containerRef.current
    if (!container) return

    // Focus initial element or first focusable element
    const focusInitialElement = (): void => {
      if (initialFocus?.current) {
        initialFocus.current.focus()
      } else {
        const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        const firstFocusable = focusableElements[0]
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }
    }

    // Small delay to ensure the element is in the DOM
    const timeoutId = setTimeout(focusInitialElement, 0)

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      if (event.shiftKey) {
        // Shift + Tab: if at first element, wrap to last
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if at last element, wrap to first
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('keydown', handleKeyDown)

      // Return focus to previous element
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, initialFocus, returnFocus])

  return containerRef
}

/**
 * Utility to get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
}

/**
 * Utility to focus the first focusable element within a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  const firstFocusable = focusableElements[0]
  if (firstFocusable) {
    firstFocusable.focus()
  }
}

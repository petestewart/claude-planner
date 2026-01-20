import { useEffect, useRef } from 'react'
import { useEditorStore } from '../../../stores/editorStore'

/**
 * Hook that automatically saves file content after a delay when content changes.
 * Uses debouncing to avoid saving too frequently during rapid edits.
 *
 * @param path - The file path to save to, or null if no file is open
 * @param content - The current content to save
 * @param enabled - Whether auto-save is enabled
 * @param delay - Delay in ms before saving after content changes
 */
export function useAutoSave(
  path: string | null,
  content: string,
  enabled: boolean,
  delay: number
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(content)

  useEffect(() => {
    // Don't auto-save if disabled, no path, or content hasn't changed
    if (!enabled || !path || content === lastSavedRef.current) return

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Schedule save
    timeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          await window.api.file.write(path, content)
          lastSavedRef.current = content
          useEditorStore.getState().markSaved(path)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      })()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [path, content, enabled, delay])

  // Update lastSavedRef when content is saved externally (e.g., via Cmd+S)
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      if (!path) return
      const file = state.openFiles.get(path)
      const prevFile = prevState.openFiles.get(path)
      if (file && prevFile && !file.isDirty && prevFile.isDirty) {
        // File was just saved (dirty -> not dirty)
        lastSavedRef.current = file.content
      }
    })
    return unsubscribe
  }, [path])
}

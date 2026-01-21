import type { ReactElement } from 'react'
import { useCallback, useState, useEffect, useRef } from 'react'
import styles from './input-dialog.module.css'

interface InputDialogProps {
  isOpen: boolean
  title: string
  label: string
  placeholder?: string
  defaultValue?: string
  submitLabel?: string
  cancelLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

/**
 * InputDialog - A modal dialog for getting text input from the user
 *
 * Used as a replacement for the browser's prompt() function,
 * which doesn't work reliably in Electron's renderer process.
 */
export function InputDialog({
  isOpen,
  title,
  label,
  placeholder = '',
  defaultValue = '',
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: InputDialogProps): ReactElement | null {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset value when dialog opens with new defaultValue
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      // Focus and select input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isOpen, defaultValue])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onCancel()
      }
    },
    [onCancel]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter' && value.trim()) {
        onSubmit(value.trim())
      }
    },
    [onCancel, onSubmit, value]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (value.trim()) {
        onSubmit(value.trim())
      }
    },
    [onSubmit, value]
  )

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-dialog-title"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="input-dialog-title" className={styles.title}>
            {title}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            <label className={styles.label} htmlFor="input-dialog-input">
              {label}
            </label>
            <input
              ref={inputRef}
              id="input-dialog-input"
              type="text"
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!value.trim()}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

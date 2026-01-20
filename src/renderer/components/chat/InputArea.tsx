import type {
  ReactElement,
  ChangeEvent,
  KeyboardEvent,
  ForwardedRef,
} from 'react'
import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import styles from './chat.module.css'

export interface InputAreaProps {
  /** Current input value */
  value: string
  /** Handler for value changes */
  onChange: (value: string) => void
  /** Handler for send action */
  onSend: () => void
  /** Handler for cancel action */
  onCancel: () => void
  /** Handler for history navigation */
  onHistoryNavigate: (direction: 'up' | 'down') => void
  /** Whether input is disabled */
  disabled: boolean
  /** Whether generation is in progress */
  isGenerating: boolean
}

export interface InputAreaRef {
  focus: () => void
}

/**
 * Chat input area with auto-resize, send/cancel buttons,
 * and keyboard shortcuts for sending and history navigation.
 */
export const InputArea = forwardRef(function InputArea(
  {
    value,
    onChange,
    onSend,
    onCancel,
    onHistoryNavigate,
    disabled,
    isGenerating,
  }: InputAreaProps,
  ref: ForwardedRef<InputAreaRef>
): ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Expose focus method via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus()
    },
  }))

  // Auto-resize textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set height to scrollHeight, capped at max-height (handled by CSS)
    const newHeight = Math.min(textarea.scrollHeight, 200)
    textarea.style.height = `${newHeight}px`
  }, [])

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter without shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSend()
      }
      return
    }

    // Up arrow at start of input navigates history
    if (e.key === 'ArrowUp') {
      const textarea = textareaRef.current
      // Only navigate history if at the start of input (cursor at position 0)
      // or if input is empty
      if (textarea && (textarea.selectionStart === 0 || value === '')) {
        e.preventDefault()
        onHistoryNavigate('up')
      }
      return
    }

    // Down arrow navigates forward in history
    if (e.key === 'ArrowDown') {
      const textarea = textareaRef.current
      // Only navigate if at end of input or input is empty
      if (
        textarea &&
        (textarea.selectionStart === value.length || value === '')
      ) {
        e.preventDefault()
        onHistoryNavigate('down')
      }
      return
    }

    // Escape clears input or cancels generation
    if (e.key === 'Escape') {
      e.preventDefault()
      if (isGenerating) {
        onCancel()
      } else if (value) {
        onChange('')
      }
      return
    }
  }

  const handleSendClick = (): void => {
    if (!disabled && value.trim()) {
      onSend()
    }
  }

  const handleCancelClick = (): void => {
    onCancel()
  }

  // Focus the textarea (can be called externally via ref forwarding later)
  const focusInput = useCallback(() => {
    textareaRef.current?.focus()
  }, [])

  // Focus on mount
  useEffect(() => {
    focusInput()
  }, [focusInput])

  return (
    <div className={styles.inputArea}>
      <textarea
        ref={textareaRef}
        className={styles.inputAreaTextarea}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={isGenerating ? 'Waiting for response...' : 'Type a message...'}
        disabled={disabled}
        rows={1}
        aria-label="Chat message input"
      />
      <div className={styles.inputAreaButtons}>
        {isGenerating ? (
          <button
            type="button"
            className={`${styles.inputAreaButton} ${styles['inputAreaButton--cancel']}`}
            onClick={handleCancelClick}
            aria-label="Cancel generation"
            title="Cancel (Escape)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4L12 12M4 12L12 4" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.inputAreaButton} ${styles['inputAreaButton--send']}`}
            onClick={handleSendClick}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            title="Send (Enter)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2L7 9M14 2L9 14L7 9L2 7L14 2Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
})

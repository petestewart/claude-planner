import type { ReactElement } from 'react'
import { useEffect, useCallback, useRef } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import type { InputAreaRef } from './InputArea'
import styles from './chat.module.css'

interface ChatInterfaceProps {
  /** Project ID to start session for */
  projectId?: string
}

export function ChatInterface({
  projectId = 'default',
}: ChatInterfaceProps): ReactElement {
  const inputAreaRef = useRef<InputAreaRef>(null)
  const session = useChatStore((state) => state.session)
  const status = useChatStore((state) => state.status)
  const inputValue = useChatStore((state) => state.inputValue)
  const startSession = useChatStore((state) => state.startSession)
  const setInputValue = useChatStore((state) => state.setInputValue)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const cancelGeneration = useChatStore((state) => state.cancelGeneration)
  const navigateHistory = useChatStore((state) => state.navigateHistory)

  // Start a session when component mounts
  useEffect(() => {
    if (!session) {
      startSession(projectId)
    }
  }, [session, startSession, projectId])

  // Global Cmd+J (Ctrl+J on Linux/Windows) shortcut to focus chat input
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      // Cmd+J on Mac, Ctrl+J on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        inputAreaRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const messages = session?.messages ?? []
  const isStreaming = status === 'streaming' || status === 'waiting'
  const isGenerating = status === 'waiting' || status === 'streaming'

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      sendMessage(inputValue)
    }
  }, [inputValue, sendMessage])

  const handleCancel = useCallback(() => {
    cancelGeneration()
  }, [cancelGeneration])

  const handleHistoryNavigate = useCallback(
    (direction: 'up' | 'down') => {
      navigateHistory(direction)
    },
    [navigateHistory]
  )

  return (
    <div className={styles.chatInterface}>
      <div className={styles.chatHeader}>
        <h2 className={styles.chatHeaderTitle}>Chat</h2>
        <div className={styles.chatHeaderStatus}>
          <span
            className={`${styles.statusIndicator} ${
              status === 'idle'
                ? styles['statusIndicator--idle']
                : styles['statusIndicator--active']
            }`}
          />
          <span className={styles.statusText}>
            {status === 'idle' && 'Ready'}
            {status === 'waiting' && 'Waiting...'}
            {status === 'streaming' && 'Responding...'}
            {status === 'error' && 'Error'}
          </span>
        </div>
      </div>
      <MessageList messages={messages} isStreaming={isStreaming} />
      <InputArea
        ref={inputAreaRef}
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onCancel={handleCancel}
        onHistoryNavigate={handleHistoryNavigate}
        disabled={isGenerating}
        isGenerating={isGenerating}
      />
    </div>
  )
}

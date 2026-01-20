import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { MessageList } from './MessageList'
import styles from './chat.module.css'

interface ChatInterfaceProps {
  /** Project ID to start session for */
  projectId?: string
}

export function ChatInterface({
  projectId = 'default',
}: ChatInterfaceProps): ReactElement {
  const session = useChatStore((state) => state.session)
  const status = useChatStore((state) => state.status)
  const startSession = useChatStore((state) => state.startSession)

  // Start a session when component mounts
  useEffect(() => {
    if (!session) {
      startSession(projectId)
    }
  }, [session, startSession, projectId])

  const messages = session?.messages ?? []
  const isStreaming = status === 'streaming' || status === 'waiting'

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
      <div className={styles.inputAreaPlaceholder}>
        <span className={styles.inputPlaceholderText}>
          Chat input will be implemented in Phase 9
        </span>
      </div>
    </div>
  )
}

import type { ReactElement } from 'react'
import type { ChatMessage as ChatMessageType } from '../../stores/chatStore'
import { ChatMessage } from './ChatMessage'
import { useScrollToBottom } from './hooks/useScrollToBottom'
import styles from './chat.module.css'

interface MessageListProps {
  messages: ChatMessageType[]
  isStreaming: boolean
}

export function MessageList({
  messages,
  isStreaming,
}: MessageListProps): ReactElement {
  const { containerRef, showScrollButton, scrollToBottom } = useScrollToBottom()

  return (
    <div className={styles.messageListContainer}>
      <div ref={containerRef} className={styles.messageList}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className={styles.typingIndicator}>
            <span>Agent is thinking</span>
            <div className={styles.typingDots}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}
      </div>
      {showScrollButton && (
        <button
          type="button"
          className={styles.scrollToBottomButton}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 12L2 6h12L8 12z" />
          </svg>
        </button>
      )}
    </div>
  )
}

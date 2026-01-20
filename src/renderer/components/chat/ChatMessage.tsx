import type { ReactElement } from 'react'
import type { ChatMessage as ChatMessageType } from '../../stores/chatStore'
import { MessageContent } from './MessageContent'
import styles from './chat.module.css'

interface ChatMessageProps {
  message: ChatMessageType
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessage({ message }: ChatMessageProps): ReactElement {
  const isUser = message.role === 'user'

  return (
    <div
      className={`${styles.message} ${isUser ? styles['message--user'] : ''}`}
    >
      <div
        className={`${styles.messageAvatar} ${
          isUser
            ? styles['messageAvatar--user']
            : styles['messageAvatar--assistant']
        }`}
      >
        {isUser ? 'U' : 'A'}
      </div>
      <div className={styles.messageBody}>
        <div
          className={`${styles.messageContent} ${
            isUser ? styles['messageContent--user'] : ''
          }`}
        >
          <MessageContent
            content={message.content}
            isStreaming={message.isStreaming ?? false}
          />
          {message.error && (
            <div className={styles.messageError}>{message.error}</div>
          )}
          {message.fileChanges && message.fileChanges.length > 0 && (
            <div className={styles.fileChanges}>
              {message.fileChanges.map((change) => (
                <div
                  key={change.path}
                  className={`${styles.fileChange} ${styles[`fileChange--${change.type}`]}`}
                  title={change.summary || change.path}
                >
                  <span className={styles.fileChangeIcon}>
                    {change.type === 'created' && '+'}
                    {change.type === 'modified' && '~'}
                    {change.type === 'deleted' && '-'}
                  </span>
                  <span className={styles.fileChangePath}>
                    {change.path.split('/').pop()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.messageTimestamp}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

import type { ReactElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './chat.module.css'

interface MessageContentProps {
  content: string
  isStreaming?: boolean
}

export function MessageContent({
  content,
  isStreaming = false,
}: MessageContentProps): ReactElement {
  return (
    <div className={styles.messageText}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className

            if (isInline) {
              return (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              )
            }

            return (
              <code className={`${styles.codeBlock} ${className || ''}`} {...props}>
                {children}
              </code>
            )
          },
          // Custom rendering for pre blocks
          pre({ children }) {
            return <pre className={styles.preBlock}>{children}</pre>
          },
          // Custom link handling
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && <span className={styles.streamingCursor} />}
    </div>
  )
}

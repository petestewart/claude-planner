import type { ReactElement } from 'react'
import styles from './RightPanel.module.css'

export function RightPanel(): ReactElement {
  return (
    <aside className={styles.rightPanel}>
      <div className={styles.chatHeader}>
        <span className={styles.title}>Spec Planner</span>
        <span className={styles.mode}>Chat Mode</span>
      </div>
      <div className={styles.messageList}>
        <div className={styles.placeholder}>
          <span>💬 Chat</span>
          <span className={styles.hint}>
            Start a conversation to design your specifications
          </span>
        </div>
      </div>
      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          placeholder="Type a message..."
          rows={1}
          disabled
        />
        <button className={styles.sendButton} disabled>
          Send
        </button>
      </div>
    </aside>
  )
}

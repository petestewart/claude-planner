import type { ReactElement } from 'react'
import { GitStatusIndicator } from '../git'
import styles from './StatusBar.module.css'

interface StatusBarProps {
  claudeStatus?: 'connected' | 'disconnected' | 'error'
  gitEnabled?: boolean
  autoCommitEnabled?: boolean
  onAutoCommitChange?: (enabled: boolean) => void
  cursorPosition?: { line: number; column: number } | null
  currentFile?: string | null
}

export function StatusBar({
  claudeStatus = 'disconnected',
  gitEnabled = false,
  autoCommitEnabled = false,
  onAutoCommitChange,
  cursorPosition = null,
  currentFile = null,
}: StatusBarProps): ReactElement {
  const statusIndicator = {
    connected: { color: 'var(--color-success)', label: 'Connected to Claude' },
    disconnected: {
      color: 'var(--color-text-secondary)',
      label: 'Claude disconnected',
    },
    error: { color: 'var(--color-error)', label: 'Claude error' },
  }[claudeStatus]

  return (
    <footer className={styles.statusBar}>
      <div className={styles.left}>
        <span className={styles.item}>
          <span
            className={styles.indicator}
            style={{ backgroundColor: statusIndicator.color }}
          />
          {statusIndicator.label}
        </span>
      </div>
      <div className={styles.center}>
        {gitEnabled && (
          <GitStatusIndicator
            autoCommitEnabled={autoCommitEnabled}
            {...(onAutoCommitChange ? { onAutoCommitChange } : {})}
            showDetails
          />
        )}
      </div>
      <div className={styles.right}>
        {cursorPosition && currentFile && (
          <span className={styles.item}>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
        )}
      </div>
    </footer>
  )
}

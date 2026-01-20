import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { GitStatusIndicator } from '../git'
import { useProjectStore } from '../../stores/projectStore'
import styles from './StatusBar.module.css'

interface StatusBarProps {
  claudeStatus?: 'connected' | 'disconnected' | 'error'
  gitEnabled?: boolean
  cursorPosition?: { line: number; column: number } | null
  currentFile?: string | null
}

export function StatusBar({
  claudeStatus = 'disconnected',
  gitEnabled = false,
  cursorPosition = null,
  currentFile = null,
}: StatusBarProps): ReactElement {
  const gitConfig = useProjectStore((state) => state.project?.gitConfig)
  const setGitConfig = useProjectStore((state) => state.setGitConfig)

  const handleAutoCommitChange = useCallback(
    async (enabled: boolean) => {
      // Update project store (persists the setting)
      setGitConfig({ autoCommit: enabled })

      // Update git service
      try {
        await window.api.git.setAutoCommit(enabled)
      } catch (err) {
        console.error('Failed to set auto-commit:', err)
      }
    },
    [setGitConfig]
  )
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
            autoCommitEnabled={gitConfig?.autoCommit ?? false}
            onAutoCommitChange={handleAutoCommitChange}
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

import type { ReactElement } from 'react'
import { useState, useEffect, useCallback } from 'react'
import type { GitStatus } from '../../../main/services/git/types'
import styles from './git.module.css'

interface GitStatusIndicatorProps {
  /** Called when auto-commit toggle changes */
  onAutoCommitChange?: (enabled: boolean) => void
  /** Initial auto-commit state */
  autoCommitEnabled?: boolean
  /** Whether to show detailed status */
  showDetails?: boolean
}

/**
 * GitStatusIndicator - Compact status bar indicator for git
 *
 * Shows:
 * - Branch name
 * - Dirty indicator (dot if uncommitted changes)
 * - Auto-commit toggle
 */
export function GitStatusIndicator({
  onAutoCommitChange,
  autoCommitEnabled = false,
  showDetails = false,
}: GitStatusIndicatorProps): ReactElement | null {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (!isConnected) return

    try {
      setIsLoading(true)
      const gitStatus = await window.api.git.status()
      setStatus(gitStatus)
    } catch (err) {
      console.error('Failed to get git status:', err)
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  // Poll for status updates
  useEffect(() => {
    if (!isConnected) return

    // Initial load
    void refreshStatus()

    // Poll every 5 seconds
    const interval = setInterval(() => {
      void refreshStatus()
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [isConnected, refreshStatus])

  const handleAutoCommitToggle = useCallback(() => {
    const newValue = !autoCommitEnabled
    onAutoCommitChange?.(newValue)
  }, [autoCommitEnabled, onAutoCommitChange])

  // Connect to repo when component mounts
  const connectToRepo = useCallback(async (cwd: string) => {
    try {
      const result = await window.api.git.connect(cwd)
      setIsConnected(result.isRepo)
      if (result.isRepo) {
        void refreshStatus()
        // Sync auto-commit setting to git service
        try {
          await window.api.git.setAutoCommit(autoCommitEnabled)
        } catch (err) {
          console.error('Failed to sync auto-commit setting:', err)
        }
      }
    } catch (err) {
      console.error('Failed to connect to git repo:', err)
      setIsConnected(false)
    }
  }, [refreshStatus, autoCommitEnabled])

  // Expose connect method
  useEffect(() => {
    // Make connect available via a custom event
    const handleConnect = (event: CustomEvent<{ cwd: string }>): void => {
      void connectToRepo(event.detail.cwd)
    }

    window.addEventListener('git:connect' as keyof WindowEventMap, handleConnect as EventListener)
    return () => {
      window.removeEventListener('git:connect' as keyof WindowEventMap, handleConnect as EventListener)
    }
  }, [connectToRepo])

  if (!isConnected || !status || !status.isRepo) {
    return (
      <div className={styles.gitIndicator}>
        <span className={styles.notRepo}>Not a git repository</span>
      </div>
    )
  }

  const changeCount =
    status.staged.length + status.modified.length + status.untracked.length

  return (
    <div className={styles.gitIndicator}>
      {/* Branch name with dirty indicator */}
      <div className={styles.branchInfo}>
        <span className={styles.branchIcon}>
          <BranchIcon />
        </span>
        <span className={styles.branchName}>{status.branch ?? 'HEAD'}</span>
        {status.isDirty && (
          <span className={styles.dirtyIndicator} title="Uncommitted changes">
            *
          </span>
        )}
      </div>

      {/* Change counts */}
      {showDetails && changeCount > 0 && (
        <div className={styles.changeCounts}>
          {status.staged.length > 0 && (
            <span className={styles.staged} title="Staged changes">
              +{status.staged.length}
            </span>
          )}
          {status.modified.length > 0 && (
            <span className={styles.modified} title="Modified files">
              ~{status.modified.length}
            </span>
          )}
          {status.untracked.length > 0 && (
            <span className={styles.untracked} title="Untracked files">
              ?{status.untracked.length}
            </span>
          )}
        </div>
      )}

      {/* Auto-commit toggle */}
      <button
        type="button"
        className={`${styles.autoCommitToggle} ${autoCommitEnabled ? styles.enabled : ''}`}
        onClick={handleAutoCommitToggle}
        title={autoCommitEnabled ? 'Auto-commit enabled' : 'Auto-commit disabled'}
      >
        <AutoCommitIcon />
        {autoCommitEnabled && <span className={styles.toggleLabel}>Auto</span>}
      </button>

      {/* Loading indicator */}
      {isLoading && <span className={styles.loadingDot} />}
    </div>
  )
}

// Simple SVG icons
function BranchIcon(): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"
      />
    </svg>
  )
}

function AutoCommitIcon(): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"
      />
    </svg>
  )
}

// Export for use in stores
export type { GitStatusIndicatorProps }

import type { ReactElement } from 'react'
import { useCallback, useMemo } from 'react'
import { GitStatusIndicator } from '../git'
import { useProjectStore } from '../../stores/projectStore'
import styles from './StatusBar.module.css'

/**
 * Formats a path for display, showing just the folder name and parent folder
 * e.g., "/home/user/projects/my-app" becomes "projects/my-app"
 */
function formatProjectPath(path: string): string {
  if (!path) return ''

  const parts = path.split(/[/\\]/).filter(Boolean)
  if (parts.length === 0) return path
  if (parts.length === 1) return parts[0] ?? path

  // Show last two parts of the path
  return parts.slice(-2).join('/')
}

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
  const project = useProjectStore((state) => state.project)
  const gitConfig = project?.gitConfig
  const setGitConfig = useProjectStore((state) => state.setGitConfig)

  const projectPath = useMemo(() => {
    if (!project?.rootPath) return null
    return formatProjectPath(project.rootPath)
  }, [project?.rootPath])

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
        {projectPath && (
          <span className={styles.projectPath} title={project?.rootPath}>
            <span className={styles.folderIcon}>📁</span>
            {projectPath}
          </span>
        )}
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

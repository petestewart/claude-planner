import type { ReactElement } from 'react'
import { ChatInterface } from '../chat/ChatInterface'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'
import styles from './RightPanel.module.css'

export function RightPanel(): ReactElement {
  const project = useProjectStore((state) => state.project)
  const claudeCliPath = useSettingsStore((state) => state.claudeCliPath)

  // Use project root path or fall back to root (Claude service will handle this)
  const workingDirectory = project?.rootPath ?? '/'

  // Use full path if settings just has 'claude' (won't be in PATH from Electron)
  const effectiveCliPath = claudeCliPath === 'claude'
    ? '/Users/petestewart/.local/bin/claude'
    : claudeCliPath

  return (
    <aside className={styles.rightPanel}>
      <ChatInterface
        {...(project?.id && { projectId: project.id })}
        workingDirectory={workingDirectory}
        cliPath={effectiveCliPath}
      />
    </aside>
  )
}

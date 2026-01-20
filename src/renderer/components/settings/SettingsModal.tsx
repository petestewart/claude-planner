import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useEditorStore } from '../../stores/editorStore'
import { useProjectStore } from '../../stores/projectStore'
import styles from './settings-modal.module.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): ReactElement | null {
  const settings = useSettingsStore()
  const setAutoSaveEnabled = useEditorStore((state) => state.setAutoSaveEnabled)
  const setEditorMode = useEditorStore((state) => state.setMode)
  const editorMode = useEditorStore((state) => state.mode)
  const autoSaveEnabled = useEditorStore((state) => state.autoSaveEnabled)
  const project = useProjectStore((state) => state.project)
  const setGitConfig = useProjectStore((state) => state.setGitConfig)

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="settings-title" className={styles.title}>
            Settings
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        <div className={styles.content}>
          {/* Editor Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>&#x270F;</span>
              <h3 className={styles.sectionTitle}>Editor</h3>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Auto-save</label>
                <span className={styles.settingDescription}>
                  Automatically save files after changes
                </span>
              </div>
              <div className={styles.settingControl}>
                <button
                  type="button"
                  className={`${styles.toggle} ${autoSaveEnabled ? styles.active : ''}`}
                  onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  role="switch"
                  aria-checked={autoSaveEnabled}
                >
                  <span className={styles.toggleHandle} />
                </button>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Auto-save delay</label>
                <span className={styles.settingDescription}>
                  Delay in milliseconds before auto-saving
                </span>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={settings.autoSaveDelay}
                  onChange={(e) => settings.setAutoSaveDelay(Number(e.target.value))}
                  min={500}
                  max={10000}
                  step={100}
                />
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Default editor mode</label>
                <span className={styles.settingDescription}>
                  Choose between WYSIWYG or Markdown editing
                </span>
              </div>
              <div className={styles.settingControl}>
                <select
                  className={styles.select}
                  value={editorMode}
                  onChange={(e) => setEditorMode(e.target.value as 'wysiwyg' | 'markdown')}
                >
                  <option value="markdown">Markdown</option>
                  <option value="wysiwyg">WYSIWYG</option>
                </select>
              </div>
            </div>
          </div>

          {/* Git Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>&#x2442;</span>
              <h3 className={styles.sectionTitle}>Git</h3>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Auto-commit</label>
                <span className={styles.settingDescription}>
                  Automatically commit changes after file saves
                </span>
              </div>
              <div className={styles.settingControl}>
                <button
                  type="button"
                  className={`${styles.toggle} ${project?.gitConfig.autoCommit ? styles.active : ''}`}
                  onClick={() =>
                    setGitConfig({ autoCommit: !project?.gitConfig.autoCommit })
                  }
                  role="switch"
                  aria-checked={project?.gitConfig.autoCommit ?? false}
                  disabled={!project}
                >
                  <span className={styles.toggleHandle} />
                </button>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Commit message template</label>
                <span className={styles.settingDescription}>
                  Template for auto-generated commit messages
                </span>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="text"
                  className={styles.textInput}
                  value={settings.commitMessageTemplate}
                  onChange={(e) => settings.setCommitMessageTemplate(e.target.value)}
                  placeholder="Auto: {action} {file}"
                />
              </div>
            </div>
          </div>

          {/* Claude Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>&#x1F916;</span>
              <h3 className={styles.sectionTitle}>Claude</h3>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>CLI path</label>
                <span className={styles.settingDescription}>
                  Path to Claude Code CLI executable
                </span>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="text"
                  className={styles.textInput}
                  value={settings.claudeCliPath}
                  onChange={(e) => settings.setClaudeCliPath(e.target.value)}
                  placeholder="claude"
                />
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Request timeout</label>
                <span className={styles.settingDescription}>
                  Timeout in seconds for Claude requests
                </span>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={settings.claudeTimeout}
                  onChange={(e) => settings.setClaudeTimeout(Number(e.target.value))}
                  min={30}
                  max={600}
                  step={30}
                />
              </div>
            </div>
          </div>

          {/* Template Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>&#x1F4C4;</span>
              <h3 className={styles.sectionTitle}>Templates</h3>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Custom templates path</label>
                <span className={styles.settingDescription}>
                  Directory for custom spec templates
                </span>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="text"
                  className={styles.textInput}
                  value={settings.customTemplatesPath}
                  onChange={(e) => settings.setCustomTemplatesPath(e.target.value)}
                  placeholder="~/.spec-planner/templates"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.buttonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

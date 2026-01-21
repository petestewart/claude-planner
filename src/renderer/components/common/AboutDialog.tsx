import type { ReactElement } from 'react'
import { useCallback } from 'react'
import styles from './about-dialog.module.css'

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

const APP_VERSION = '0.1.0'

// Version info - process.versions is not available in renderer with contextIsolation
// These would need to be exposed via preload if needed in the future
const versions = {
  electron: 'N/A',
  node: 'N/A',
  chrome: 'N/A',
}

export function AboutDialog({
  isOpen,
  onClose,
}: AboutDialogProps): ReactElement | null {
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
      aria-labelledby="about-title"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">
            SP
          </div>
          <h2 id="about-title" className={styles.title}>
            Spec Planner
          </h2>
          <p className={styles.version}>Version {APP_VERSION}</p>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            A tool for creating software specifications and implementation plans
            using AI-assisted development.
          </p>

          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Electron</span>
              <span className={styles.infoValue}>{versions.electron}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Node.js</span>
              <span className={styles.infoValue}>{versions.node}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Chromium</span>
              <span className={styles.infoValue}>{versions.chrome}</span>
            </div>
          </div>

          <p className={styles.copyright}>
            &copy; 2024 Spec Planner. All rights reserved.
          </p>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

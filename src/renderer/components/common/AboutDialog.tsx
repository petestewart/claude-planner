import type { ReactElement } from 'react'
import { useCallback } from 'react'
import styles from './about-dialog.module.css'

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

const APP_VERSION = '0.1.0'
const ELECTRON_VERSION = process.versions?.electron ?? 'Unknown'
const NODE_VERSION = process.versions?.node ?? 'Unknown'
const CHROME_VERSION = process.versions?.chrome ?? 'Unknown'

export function AboutDialog({ isOpen, onClose }: AboutDialogProps): ReactElement | null {
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
              <span className={styles.infoValue}>{ELECTRON_VERSION}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Node.js</span>
              <span className={styles.infoValue}>{NODE_VERSION}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Chromium</span>
              <span className={styles.infoValue}>{CHROME_VERSION}</span>
            </div>
          </div>

          <p className={styles.copyright}>
            &copy; 2024 Spec Planner. All rights reserved.
          </p>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

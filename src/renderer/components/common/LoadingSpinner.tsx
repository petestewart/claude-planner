import type { ReactElement } from 'react'
import styles from './loading-spinner.module.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export function LoadingSpinner({
  size = 'medium',
  message,
}: LoadingSpinnerProps): ReactElement {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
      {message && <p className={styles.message}>{message}</p>}
      <span className={styles.srOnly}>Loading...</span>
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message }: LoadingOverlayProps): ReactElement {
  return (
    <div className={styles.overlay}>
      {message ? (
        <LoadingSpinner size="large" message={message} />
      ) : (
        <LoadingSpinner size="large" />
      )}
    </div>
  )
}

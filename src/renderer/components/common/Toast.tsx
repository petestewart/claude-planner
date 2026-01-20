import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useToastStore, type Toast as ToastType, type ToastType as ToastVariant } from '../../stores/toastStore'
import styles from './toast.module.css'

interface ToastItemProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

function getIcon(type: ToastVariant): string {
  switch (type) {
    case 'info':
      return '\u2139' // info symbol
    case 'success':
      return '\u2713' // checkmark
    case 'warning':
      return '\u26A0' // warning symbol
    case 'error':
      return '\u2717' // cross mark
    default:
      return '\u2139'
  }
}

function ToastItem({ toast, onDismiss }: ToastItemProps): ReactElement {
  const handleDismiss = useCallback(() => {
    onDismiss(toast.id)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.icon} aria-hidden="true">
        {getIcon(toast.type)}
      </span>
      <div className={styles.content}>
        <p className={styles.message}>{toast.message}</p>
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  )
}

export function ToastContainer(): ReactElement | null {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className={styles.container} aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}

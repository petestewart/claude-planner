import { Component, type ReactNode, type ErrorInfo } from 'react'
import styles from './error-boundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <span className={styles.icon} aria-hidden="true">
              &#x26A0;
            </span>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              An unexpected error occurred. Please try again or reload the application.
            </p>
            {this.state.error && (
              <details className={styles.details}>
                <summary>Error details</summary>
                <pre className={styles.errorText}>{this.state.error.message}</pre>
              </details>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.retryButton}
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button
                type="button"
                className={styles.reloadButton}
                onClick={() => window.location.reload()}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

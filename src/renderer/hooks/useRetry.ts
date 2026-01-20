import { useState, useCallback, useRef } from 'react'

interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  onRetry?: (attempt: number, error: Error) => void
}

interface RetryState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  attempt: number
}

interface RetryResult<T> extends RetryState<T> {
  execute: () => Promise<T | null>
  reset: () => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number
): number {
  const delay = initialDelay * Math.pow(backoffFactor, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Hook for executing async operations with automatic retry on failure.
 * Uses exponential backoff for retry delays.
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
): RetryResult<T> {
  const {
    maxAttempts = DEFAULT_OPTIONS.maxAttempts,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffFactor = DEFAULT_OPTIONS.backoffFactor,
    onRetry,
  } = options

  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    attempt: 0,
  })

  const abortRef = useRef(false)

  const execute = useCallback(async (): Promise<T | null> => {
    abortRef.current = false
    setState((prev) => ({ ...prev, isLoading: true, error: null, attempt: 0 }))

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (abortRef.current) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return null
      }

      setState((prev) => ({ ...prev, attempt }))

      try {
        const result = await asyncFn()
        setState({
          data: result,
          error: null,
          isLoading: false,
          attempt,
        })
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < maxAttempts) {
          onRetry?.(attempt, lastError)
          const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffFactor)
          await sleep(delay)
        }
      }
    }

    setState({
      data: null,
      error: lastError,
      isLoading: false,
      attempt: maxAttempts,
    })

    return null
  }, [asyncFn, maxAttempts, initialDelay, maxDelay, backoffFactor, onRetry])

  const reset = useCallback(() => {
    abortRef.current = true
    setState({
      data: null,
      error: null,
      isLoading: false,
      attempt: 0,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Utility function for retrying an async operation outside of React hooks.
 * Uses exponential backoff for retry delays.
 */
export async function retry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = DEFAULT_OPTIONS.maxAttempts,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffFactor = DEFAULT_OPTIONS.backoffFactor,
    onRetry,
  } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await asyncFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError)
        const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffFactor)
        await sleep(delay)
      }
    }
  }

  throw lastError ?? new Error('All retry attempts failed')
}

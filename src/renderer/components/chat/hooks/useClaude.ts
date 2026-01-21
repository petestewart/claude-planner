/**
 * useClaude hook - Connects the chat to the Claude service via IPC
 */

import { useEffect, useCallback, useRef } from 'react'
import { useChatStore } from '../../../stores/chatStore'
import type { StreamEvent } from '../../../../shared/types/git'

interface UseClaudeOptions {
  workingDirectory?: string
  cliPath?: string
  debug?: boolean
}

interface UseClaudeResult {
  initialized: boolean
  available: boolean
  send: (message: string) => Promise<void>
  cancel: () => Promise<void>
}

/**
 * Hook to manage Claude service connection and message streaming
 */
export function useClaude(options: UseClaudeOptions = {}): UseClaudeResult {
  const initializedRef = useRef(false)
  const availableRef = useRef(false)

  const setStatus = useChatStore((state) => state.setStatus)
  const appendStreamChunk = useChatStore((state) => state.appendStreamChunk)
  const completeMessage = useChatStore((state) => state.completeMessage)
  const setError = useChatStore((state) => state.setError)

  // Initialize Claude service
  useEffect(() => {
    const init = async (): Promise<void> => {
      if (!window.api?.claude?.init) {
        console.warn('[useClaude] Claude API not available')
        return
      }

      // Ensure we have a valid working directory
      const workingDirectory = options.workingDirectory || '/'

      try {
        const initOptions: { workingDirectory: string; cliPath?: string; debug?: boolean } = {
          workingDirectory,
        }
        if (options.cliPath) {
          initOptions.cliPath = options.cliPath
        }
        if (options.debug !== undefined) {
          initOptions.debug = options.debug
        }

        console.log('[useClaude] Initializing with options:', initOptions)
        const result = await window.api.claude.init(initOptions)

        initializedRef.current = true
        availableRef.current = result.available

        if (!result.available) {
          console.warn('[useClaude] Claude CLI not available')
        } else {
          console.log('[useClaude] Initialized successfully')
        }
      } catch (error) {
        console.error('[useClaude] Failed to initialize:', error)
      }
    }

    void init()
  }, [options.workingDirectory, options.cliPath, options.debug])

  // Subscribe to stream events
  useEffect(() => {
    if (!window.api?.claude?.onStream) {
      return
    }

    const unsubscribe = window.api.claude.onStream((event: StreamEvent) => {
      switch (event.type) {
        case 'start':
          setStatus('streaming')
          break

        case 'text':
          appendStreamChunk(event.content)
          break

        case 'thinking':
          // Could display thinking content differently in the future
          appendStreamChunk(event.content)
          break

        case 'file_start':
          // Notify that a file operation started
          appendStreamChunk(`\n\n*${event.action === 'create' ? 'Creating' : event.action === 'modify' ? 'Modifying' : 'Deleting'} file: ${event.path}*\n`)
          break

        case 'file_end':
          // File operation completed
          break

        case 'tool_use':
          // Could show tool usage in the future
          break

        case 'complete':
          completeMessage()
          break

        case 'error':
          setError(event.message)
          break
      }
    })

    return () => {
      unsubscribe()
    }
  }, [setStatus, appendStreamChunk, completeMessage, setError])

  const send = useCallback(async (message: string): Promise<void> => {
    if (!window.api?.claude?.send) {
      throw new Error('Claude API not available')
    }

    try {
      await window.api.claude.send(message)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message')
    }
  }, [setError])

  const cancel = useCallback(async (): Promise<void> => {
    if (!window.api?.claude?.cancel) {
      return
    }

    try {
      await window.api.claude.cancel()
    } catch (error) {
      console.error('[useClaude] Failed to cancel:', error)
    }
  }, [])

  return {
    initialized: initializedRef.current,
    available: availableRef.current,
    send,
    cancel,
  }
}

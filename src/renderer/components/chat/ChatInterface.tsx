import type { ReactElement, ChangeEvent } from 'react'
import { useEffect, useCallback, useRef } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useProjectStore } from '../../stores/projectStore'
import type { GenerationMode } from '../../../shared/types/project'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import type { InputAreaRef } from './InputArea'
import { useClaude } from './hooks'
import styles from './chat.module.css'

/**
 * Display labels for generation modes
 */
const MODE_LABELS: Record<GenerationMode, string> = {
  incremental: 'Incremental',
  'all-at-once': 'All at once',
  'draft-then-refine': 'Draft & Refine',
}

/**
 * Description tooltips for generation modes
 */
const MODE_DESCRIPTIONS: Record<GenerationMode, string> = {
  incremental: 'Generate one file at a time, requiring approval',
  'all-at-once': 'Generate all files in a single pass',
  'draft-then-refine': 'Generate drafts first, then refine based on feedback',
}

interface ChatInterfaceProps {
  /** Project ID to start session for */
  projectId?: string
  /** Working directory for Claude CLI */
  workingDirectory?: string
}

export function ChatInterface({
  projectId = 'default',
  workingDirectory,
}: ChatInterfaceProps): ReactElement {
  const inputAreaRef = useRef<InputAreaRef>(null)
  const session = useChatStore((state) => state.session)
  const status = useChatStore((state) => state.status)
  const inputValue = useChatStore((state) => state.inputValue)
  const startSession = useChatStore((state) => state.startSession)
  const setInputValue = useChatStore((state) => state.setInputValue)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const cancelGeneration = useChatStore((state) => state.cancelGeneration)
  const navigateHistory = useChatStore((state) => state.navigateHistory)

  // Get generation mode from project store
  const generationMode = useProjectStore(
    (state) => state.project?.generationMode ?? 'incremental'
  )
  const setGenerationMode = useProjectStore((state) => state.setGenerationMode)

  // Initialize Claude service and set up stream listener
  useClaude(workingDirectory ? { workingDirectory } : {})

  // Start a session when component mounts
  useEffect(() => {
    if (!session) {
      startSession(projectId)
    }
  }, [session, startSession, projectId])

  // Global Cmd+J (Ctrl+J on Linux/Windows) shortcut to focus chat input
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      // Cmd+J on Mac, Ctrl+J on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        inputAreaRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const messages = session?.messages ?? []
  const isStreaming = status === 'streaming' || status === 'waiting'
  const isGenerating = status === 'waiting' || status === 'streaming'

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      sendMessage(inputValue)
    }
  }, [inputValue, sendMessage])

  const handleCancel = useCallback(() => {
    cancelGeneration()
  }, [cancelGeneration])

  const handleHistoryNavigate = useCallback(
    (direction: 'up' | 'down') => {
      navigateHistory(direction)
    },
    [navigateHistory]
  )

  const handleModeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setGenerationMode(e.target.value as GenerationMode)
    },
    [setGenerationMode]
  )

  return (
    <div className={styles.chatInterface}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <h2 className={styles.chatHeaderTitle}>Chat</h2>
          <div className={styles.modeSelector}>
            <span className={styles.modeSelectorLabel}>Mode:</span>
            <select
              className={styles.modeSelectorSelect}
              value={generationMode}
              onChange={handleModeChange}
              title={MODE_DESCRIPTIONS[generationMode]}
            >
              {(Object.keys(MODE_LABELS) as GenerationMode[]).map((mode) => (
                <option key={mode} value={mode} title={MODE_DESCRIPTIONS[mode]}>
                  {MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.chatHeaderStatus}>
          <span
            className={`${styles.statusIndicator} ${
              status === 'idle'
                ? styles['statusIndicator--idle']
                : styles['statusIndicator--active']
            }`}
          />
          <span className={styles.statusText}>
            {status === 'idle' && 'Ready'}
            {status === 'waiting' && 'Waiting...'}
            {status === 'streaming' && 'Responding...'}
            {status === 'error' && 'Error'}
          </span>
        </div>
      </div>
      <MessageList messages={messages} isStreaming={isStreaming} />
      <InputArea
        ref={inputAreaRef}
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onCancel={handleCancel}
        onHistoryNavigate={handleHistoryNavigate}
        disabled={isGenerating}
        isGenerating={isGenerating}
      />
    </div>
  )
}

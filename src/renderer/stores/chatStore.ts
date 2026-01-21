import { create } from 'zustand'

/**
 * Generate a UUID v4 for session IDs
 * This is compatible with Claude CLI's --session-id flag
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * File change made by agent
 */
export interface FileChange {
  /** Absolute file path */
  path: string
  /** Type of change */
  type: 'created' | 'modified' | 'deleted'
  /** Brief description of change */
  summary?: string
}

/**
 * A single chat message
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string
  /** Message author */
  role: 'user' | 'assistant' | 'system'
  /** Message content (markdown) */
  content: string
  /** When message was created */
  timestamp: string
  /** Files modified during this message (assistant only) */
  fileChanges?: FileChange[]
  /** Whether message is still streaming */
  isStreaming?: boolean
  /** Error that occurred during generation */
  error?: string
}

/**
 * Chat session state
 */
export interface ChatSession {
  /** Session ID */
  id: string
  /** Claude CLI session ID (UUID format for --session-id flag) */
  claudeSessionId: string
  /** Associated project ID */
  projectId: string
  /** All messages in session */
  messages: ChatMessage[]
  /** Session start time */
  startedAt: string
  /** Number of messages sent to Claude (used to determine if --continue is needed) */
  messagesSentToClaude: number
}

type ChatStatus = 'idle' | 'waiting' | 'streaming' | 'error'

interface ChatStore {
  /** Current chat session */
  session: ChatSession | null
  /** Chat status */
  status: ChatStatus
  /** Error message if status is 'error' */
  errorMessage: string | null
  /** Input field value (controlled) */
  inputValue: string
  /** Input history for up/down navigation */
  inputHistory: string[]
  /** Current position in input history (-1 means not navigating) */
  historyIndex: number

  // Actions
  startSession: (projectId: string) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  sendMessage: (content: string) => Promise<void>
  cancelGeneration: () => Promise<void>
  appendStreamChunk: (chunk: string) => void
  completeMessage: (fileChanges?: FileChange[]) => void
  setError: (message: string) => void
  clearError: () => void
  setInputValue: (value: string) => void
  navigateHistory: (direction: 'up' | 'down') => void
  setStatus: (status: ChatStatus) => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const WELCOME_MESSAGE = `# Welcome to Spec Planner!

I'll help you design comprehensive specifications for your software project.

**Tell me about your application:**
- What problem does it solve?
- Who will use it?
- What are the core features?

As we discuss, I'll ask clarifying questions to ensure I understand your requirements fully. When you're ready, I'll generate:

- **CLAUDE.md** - Development guidelines
- **specs/** - Detailed feature specifications
- **PLAN.md** - Implementation phases

Let's get started! What would you like to build?`

export const useChatStore = create<ChatStore>((set, get) => ({
  session: null,
  status: 'idle',
  errorMessage: null,
  inputValue: '',
  inputHistory: [],
  historyIndex: -1,

  startSession: (projectId: string) => {
    const session: ChatSession = {
      id: generateId(),
      claudeSessionId: generateUUID(),
      projectId,
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date().toISOString(),
        },
      ],
      startedAt: new Date().toISOString(),
      messagesSentToClaude: 0,
    }
    set({ session, status: 'idle', errorMessage: null })
  },

  addMessage: (message) => {
    const { session } = get()
    if (!session) return

    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    }

    set({
      session: {
        ...session,
        messages: [...session.messages, newMessage],
      },
    })
  },

  sendMessage: async (content: string) => {
    const { session, inputHistory, addMessage } = get()
    if (!session || !content.trim()) return

    // Determine if this is a continuation (not the first message in the session)
    const continueSession = session.messagesSentToClaude > 0

    // Add user message
    addMessage({ role: 'user', content: content.trim() })

    // Update input history and increment messages sent counter
    const newHistory = [...inputHistory, content.trim()].slice(-50) // Keep last 50

    set({
      inputValue: '',
      inputHistory: newHistory,
      historyIndex: -1,
      status: 'waiting',
      session: {
        ...session,
        messages: get().session?.messages ?? session.messages,
        messagesSentToClaude: session.messagesSentToClaude + 1,
      },
    })

    // Add placeholder assistant message that will be streamed into
    addMessage({ role: 'assistant', content: '', isStreaming: true })

    // Call Claude service via IPC with session continuity options
    // The response streaming is handled via the claude:stream event listener
    // in the useClaude hook
    try {
      if (window.api?.claude?.send) {
        await window.api.claude.send(content.trim(), {
          sessionId: session.claudeSessionId,
          continueSession,
        })
      }
    } catch (error) {
      get().setError(
        error instanceof Error ? error.message : 'Failed to send message'
      )
    }
  },

  cancelGeneration: async () => {
    const { session } = get()
    if (!session) return

    // Send cancel signal via IPC
    try {
      if (window.api?.claude?.cancel) {
        await window.api.claude.cancel()
      }
    } catch (error) {
      console.error('Failed to cancel generation:', error)
    }

    // Mark the current streaming message as complete
    const messages = session.messages
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.isStreaming) {
      const updatedMessages = [...messages]
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        isStreaming: false,
        content: lastMessage.content + '\n\n*[Generation cancelled]*',
      }
      set({
        session: { ...session, messages: updatedMessages },
        status: 'idle',
      })
    }
  },

  appendStreamChunk: (chunk: string) => {
    const { session, status } = get()
    if (!session) return

    // Update status to streaming if not already
    const newStatus = status === 'waiting' ? 'streaming' : status

    // Append to the last message
    const messages = session.messages
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.isStreaming) {
      const updatedMessages = [...messages]
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + chunk,
      }
      set({
        session: { ...session, messages: updatedMessages },
        status: newStatus,
      })
    }
  },

  completeMessage: (fileChanges?: FileChange[]) => {
    const { session } = get()
    if (!session) return

    const messages = session.messages
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.isStreaming) {
      const updatedMessages = [...messages]
      const completedMessage: ChatMessage = {
        ...lastMessage,
        isStreaming: false,
      }
      if (fileChanges) {
        completedMessage.fileChanges = fileChanges
      }
      updatedMessages[updatedMessages.length - 1] = completedMessage
      set({
        session: { ...session, messages: updatedMessages },
        status: 'idle',
      })
    }
  },

  setError: (message: string) => {
    const { session } = get()
    if (!session) return

    // Mark the last message with the error
    const messages = session.messages
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.isStreaming) {
      const updatedMessages = [...messages]
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        isStreaming: false,
        error: message,
      }
      set({
        session: { ...session, messages: updatedMessages },
        status: 'error',
        errorMessage: message,
      })
    } else {
      set({ status: 'error', errorMessage: message })
    }
  },

  clearError: () => {
    set({ status: 'idle', errorMessage: null })
  },

  setInputValue: (value: string) => {
    set({ inputValue: value, historyIndex: -1 })
  },

  navigateHistory: (direction: 'up' | 'down') => {
    const { inputHistory, historyIndex } = get()
    if (inputHistory.length === 0) return

    let newIndex: number
    if (direction === 'up') {
      // Going up (older messages)
      if (historyIndex === -1) {
        // Starting navigation, go to most recent
        newIndex = inputHistory.length - 1
      } else if (historyIndex > 0) {
        // Go to older message
        newIndex = historyIndex - 1
      } else {
        // Already at oldest, stay there
        return
      }
    } else {
      // Going down (newer messages)
      if (historyIndex === -1) {
        // Not navigating, nothing to do
        return
      } else if (historyIndex < inputHistory.length - 1) {
        // Go to newer message
        newIndex = historyIndex + 1
      } else {
        // At newest, exit navigation
        set({ historyIndex: -1, inputValue: '' })
        return
      }
    }

    set({
      historyIndex: newIndex,
      inputValue: inputHistory[newIndex] ?? '',
    })
  },

  setStatus: (status: ChatStatus) => {
    set({ status })
  },
}))

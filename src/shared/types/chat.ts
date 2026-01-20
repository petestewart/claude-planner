/**
 * A message in the chat conversation
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string

  /** Files referenced or modified by this message */
  relatedFiles?: string[]

  /** Whether this message is still streaming */
  streaming?: boolean
}

/**
 * Chat session state
 */
export interface ChatSession {
  id: string
  projectId: string
  messages: ChatMessage[]
  status: 'idle' | 'waiting' | 'streaming'
}

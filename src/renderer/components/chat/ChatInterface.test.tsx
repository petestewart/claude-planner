import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInterface } from './ChatInterface'
import { useChatStore } from '../../stores/chatStore'
import { useProjectStore } from '../../stores/projectStore'

// Mock the stores
jest.mock('../../stores/chatStore')
jest.mock('../../stores/projectStore')

// Mock the useClaude hook
jest.mock('./hooks', () => ({
  useClaude: jest.fn(),
}))

// Mock CSS modules
jest.mock('./chat.module.css', () => ({}))

// Mock MessageList to avoid react-markdown ESM issue
jest.mock('./MessageList', () => ({
  MessageList: ({ messages, isStreaming }: { messages: unknown[]; isStreaming: boolean }) => (
    <div data-testid="message-list" data-streaming={isStreaming}>
      {messages.length} messages
    </div>
  ),
}))

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>
const mockUseProjectStore = useProjectStore as jest.MockedFunction<typeof useProjectStore>

describe('ChatInterface', () => {
  const mockMessages = [
    {
      id: '1',
      role: 'assistant' as const,
      content: 'Welcome!',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      role: 'user' as const,
      content: 'Hello',
      timestamp: '2024-01-01T10:01:00Z',
    },
  ]

  const mockSession = {
    id: 'session-1',
    projectId: 'project-1',
    messages: mockMessages,
    startedAt: '2024-01-01T10:00:00Z',
  }

  const defaultChatState = {
    session: mockSession,
    status: 'idle' as const,
    inputValue: '',
    startSession: jest.fn(),
    setInputValue: jest.fn(),
    sendMessage: jest.fn(),
    cancelGeneration: jest.fn(),
    navigateHistory: jest.fn(),
  }

  const defaultProjectState = {
    project: {
      generationMode: 'incremental' as const,
    },
    setGenerationMode: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Default implementation returns store values based on selector
    mockUseChatStore.mockImplementation((selector) => {
      if (!selector) return defaultChatState
      return selector(defaultChatState as never)
    })

    mockUseProjectStore.mockImplementation((selector) => {
      if (!selector) return defaultProjectState
      return selector(defaultProjectState as never)
    })
  })

  it('renders the chat header with title', () => {
    render(<ChatInterface />)
    expect(screen.getByText('Chat')).toBeInTheDocument()
  })

  it('renders the mode selector', () => {
    render(<ChatInterface />)
    expect(screen.getByText('Mode:')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays generation mode options in the selector', () => {
    render(<ChatInterface />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('incremental')

    // Check that all options are present
    expect(screen.getByText('Incremental')).toBeInTheDocument()
    expect(screen.getByText('All at once')).toBeInTheDocument()
    expect(screen.getByText('Draft & Refine')).toBeInTheDocument()
  })

  it('calls setGenerationMode when mode is changed', () => {
    render(<ChatInterface />)
    const select = screen.getByRole('combobox')

    fireEvent.change(select, { target: { value: 'all-at-once' } })

    expect(defaultProjectState.setGenerationMode).toHaveBeenCalledWith('all-at-once')
  })

  it('shows Ready status when idle', () => {
    render(<ChatInterface />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('shows Waiting... status when waiting', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, status: 'waiting' as const }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface />)
    expect(screen.getByText('Waiting...')).toBeInTheDocument()
  })

  it('shows Responding... status when streaming', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, status: 'streaming' as const }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface />)
    expect(screen.getByText('Responding...')).toBeInTheDocument()
  })

  it('shows Error status when error', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, status: 'error' as const }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('starts a session on mount if no session exists', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, session: null }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface projectId="test-project" />)
    expect(defaultChatState.startSession).toHaveBeenCalledWith('test-project')
  })

  it('uses default projectId when not provided', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, session: null }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface />)
    expect(defaultChatState.startSession).toHaveBeenCalledWith('default')
  })

  it('does not start a session if session already exists', () => {
    render(<ChatInterface />)
    expect(defaultChatState.startSession).not.toHaveBeenCalled()
  })

  it('renders the input area with correct disabled state when idle', () => {
    render(<ChatInterface />)
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('disables input when waiting', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, status: 'waiting' as const }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('disables input when streaming', () => {
    mockUseChatStore.mockImplementation((selector) => {
      const state = { ...defaultChatState, status: 'streaming' as const }
      if (!selector) return state
      return selector(state as never)
    })

    render(<ChatInterface />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

import { useChatStore } from '../chatStore'
import type { FileChange } from '../chatStore'

// Reset state before each test
beforeEach(() => {
  useChatStore.setState({
    session: null,
    status: 'idle',
    errorMessage: null,
    inputValue: '',
    inputHistory: [],
    historyIndex: -1,
  })
  jest.clearAllMocks()
})

describe('chatStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useChatStore.getState()

      expect(state.session).toBeNull()
      expect(state.status).toBe('idle')
      expect(state.errorMessage).toBeNull()
      expect(state.inputValue).toBe('')
      expect(state.inputHistory).toEqual([])
      expect(state.historyIndex).toBe(-1)
    })
  })

  describe('startSession', () => {
    it('creates a new session with welcome message', () => {
      useChatStore.getState().startSession('project-123')

      const state = useChatStore.getState()
      expect(state.session).not.toBeNull()
      expect(state.session?.projectId).toBe('project-123')
      expect(state.session?.messages).toHaveLength(1)
      expect(state.session?.messages[0]?.role).toBe('assistant')
      expect(state.session?.messages[0]?.content).toContain(
        'Welcome to Spec Planner'
      )
    })

    it('clears previous error state', () => {
      useChatStore.setState({ errorMessage: 'Previous error', status: 'error' })

      useChatStore.getState().startSession('project-123')

      const state = useChatStore.getState()
      expect(state.errorMessage).toBeNull()
      expect(state.status).toBe('idle')
    })

    it('generates a Claude session ID in UUID format', () => {
      useChatStore.getState().startSession('project-123')

      const state = useChatStore.getState()
      expect(state.session?.claudeSessionId).toBeDefined()
      // Verify UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(state.session?.claudeSessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('initializes messagesSentToClaude to 0', () => {
      useChatStore.getState().startSession('project-123')

      const state = useChatStore.getState()
      expect(state.session?.messagesSentToClaude).toBe(0)
    })
  })

  describe('addMessage', () => {
    it('adds a message to the session', () => {
      useChatStore.getState().startSession('project-123')

      useChatStore.getState().addMessage({
        role: 'user',
        content: 'Hello, world!',
      })

      const state = useChatStore.getState()
      expect(state.session?.messages).toHaveLength(2) // welcome + new message
      expect(state.session?.messages[1]?.role).toBe('user')
      expect(state.session?.messages[1]?.content).toBe('Hello, world!')
      expect(state.session?.messages[1]?.id).toBeDefined()
      expect(state.session?.messages[1]?.timestamp).toBeDefined()
    })

    it('does nothing if no session exists', () => {
      useChatStore.getState().addMessage({
        role: 'user',
        content: 'Hello',
      })

      expect(useChatStore.getState().session).toBeNull()
    })
  })

  describe('sendMessage', () => {
    it('adds user message and placeholder assistant message', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')

      await useChatStore.getState().sendMessage('Test message')

      const state = useChatStore.getState()
      expect(state.session?.messages).toHaveLength(3) // welcome + user + assistant placeholder
      expect(state.session?.messages[1]?.role).toBe('user')
      expect(state.session?.messages[1]?.content).toBe('Test message')
      expect(state.session?.messages[2]?.role).toBe('assistant')
      expect(state.session?.messages[2]?.isStreaming).toBe(true)
    })

    it('updates input history', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')

      await useChatStore.getState().sendMessage('First message')
      await useChatStore.getState().sendMessage('Second message')

      const state = useChatStore.getState()
      expect(state.inputHistory).toEqual(['First message', 'Second message'])
    })

    it('clears input value after sending', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      useChatStore.setState({ inputValue: 'Test message' })

      await useChatStore.getState().sendMessage('Test message')

      expect(useChatStore.getState().inputValue).toBe('')
    })

    it('sets status to waiting', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')

      await useChatStore.getState().sendMessage('Test message')

      expect(useChatStore.getState().status).toBe('waiting')
    })

    it('does nothing for empty messages', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      useChatStore.getState().startSession('project-123')

      await useChatStore.getState().sendMessage('   ')

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('passes sessionId and continueSession=false on first message', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      const sessionId = useChatStore.getState().session?.claudeSessionId

      await useChatStore.getState().sendMessage('First message')

      expect(mockSend).toHaveBeenCalledWith('First message', {
        sessionId,
        continueSession: false,
      })
    })

    it('passes sessionId and continueSession=true on subsequent messages', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      const sessionId = useChatStore.getState().session?.claudeSessionId

      // First message
      await useChatStore.getState().sendMessage('First message')
      expect(mockSend).toHaveBeenLastCalledWith('First message', {
        sessionId,
        continueSession: false,
      })

      // Second message
      await useChatStore.getState().sendMessage('Second message')
      expect(mockSend).toHaveBeenLastCalledWith('Second message', {
        sessionId,
        continueSession: true,
      })

      // Third message
      await useChatStore.getState().sendMessage('Third message')
      expect(mockSend).toHaveBeenLastCalledWith('Third message', {
        sessionId,
        continueSession: true,
      })
    })

    it('increments messagesSentToClaude counter', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      expect(useChatStore.getState().session?.messagesSentToClaude).toBe(0)

      await useChatStore.getState().sendMessage('First message')
      expect(useChatStore.getState().session?.messagesSentToClaude).toBe(1)

      await useChatStore.getState().sendMessage('Second message')
      expect(useChatStore.getState().session?.messagesSentToClaude).toBe(2)
    })
  })

  describe('cancelGeneration', () => {
    it('cancels and marks message as cancelled', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      const mockCancel = window.api.claude.cancel as jest.Mock
      mockSend.mockResolvedValue(undefined)
      mockCancel.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      await useChatStore.getState().sendMessage('Test')

      await useChatStore.getState().cancelGeneration()

      const state = useChatStore.getState()
      const lastMessage =
        state.session?.messages[state.session.messages.length - 1]
      expect(lastMessage?.isStreaming).toBe(false)
      expect(lastMessage?.content).toContain('[Generation cancelled]')
      expect(state.status).toBe('idle')
    })
  })

  describe('appendStreamChunk', () => {
    it('appends chunk to streaming message', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      await useChatStore.getState().sendMessage('Test')

      useChatStore.getState().appendStreamChunk('Hello ')
      useChatStore.getState().appendStreamChunk('world!')

      const state = useChatStore.getState()
      const lastMessage =
        state.session?.messages[state.session.messages.length - 1]
      expect(lastMessage?.content).toBe('Hello world!')
    })

    it('updates status from waiting to streaming', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      await useChatStore.getState().sendMessage('Test')
      expect(useChatStore.getState().status).toBe('waiting')

      useChatStore.getState().appendStreamChunk('Response')
      expect(useChatStore.getState().status).toBe('streaming')
    })
  })

  describe('completeMessage', () => {
    it('marks message as complete', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      await useChatStore.getState().sendMessage('Test')
      useChatStore.getState().appendStreamChunk('Response content')

      useChatStore.getState().completeMessage()

      const state = useChatStore.getState()
      const lastMessage =
        state.session?.messages[state.session.messages.length - 1]
      expect(lastMessage?.isStreaming).toBe(false)
      expect(state.status).toBe('idle')
    })

    it('attaches file changes to message', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      await useChatStore.getState().sendMessage('Test')

      const fileChanges: FileChange[] = [
        { path: '/test/file.ts', type: 'created', summary: 'New file' },
      ]
      useChatStore.getState().completeMessage(fileChanges)

      const state = useChatStore.getState()
      const lastMessage =
        state.session?.messages[state.session.messages.length - 1]
      expect(lastMessage?.fileChanges).toEqual(fileChanges)
    })
  })

  describe('setError', () => {
    it('sets error state on streaming message', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')
      await useChatStore.getState().sendMessage('Test')

      useChatStore.getState().setError('Connection failed')

      const state = useChatStore.getState()
      expect(state.status).toBe('error')
      expect(state.errorMessage).toBe('Connection failed')
      const lastMessage =
        state.session?.messages[state.session.messages.length - 1]
      expect(lastMessage?.error).toBe('Connection failed')
      expect(lastMessage?.isStreaming).toBe(false)
    })
  })

  describe('clearError', () => {
    it('clears error state', () => {
      useChatStore.setState({ status: 'error', errorMessage: 'Some error' })

      useChatStore.getState().clearError()

      const state = useChatStore.getState()
      expect(state.status).toBe('idle')
      expect(state.errorMessage).toBeNull()
    })
  })

  describe('setInputValue', () => {
    it('sets input value and resets history index', () => {
      useChatStore.setState({ historyIndex: 2 })

      useChatStore.getState().setInputValue('New value')

      const state = useChatStore.getState()
      expect(state.inputValue).toBe('New value')
      expect(state.historyIndex).toBe(-1)
    })
  })

  describe('navigateHistory', () => {
    beforeEach(() => {
      useChatStore.setState({
        inputHistory: ['first', 'second', 'third'],
        historyIndex: -1,
        inputValue: '',
      })
    })

    it('navigates up to most recent on first press', () => {
      useChatStore.getState().navigateHistory('up')

      const state = useChatStore.getState()
      expect(state.historyIndex).toBe(2) // last index
      expect(state.inputValue).toBe('third')
    })

    it('navigates up through history', () => {
      const { navigateHistory } = useChatStore.getState()

      navigateHistory('up')
      expect(useChatStore.getState().inputValue).toBe('third')

      navigateHistory('up')
      expect(useChatStore.getState().inputValue).toBe('second')

      navigateHistory('up')
      expect(useChatStore.getState().inputValue).toBe('first')

      // At oldest, stays there
      navigateHistory('up')
      expect(useChatStore.getState().inputValue).toBe('first')
      expect(useChatStore.getState().historyIndex).toBe(0)
    })

    it('navigates down through history', () => {
      const { navigateHistory } = useChatStore.getState()

      // Go up first
      navigateHistory('up')
      navigateHistory('up')
      expect(useChatStore.getState().inputValue).toBe('second')

      // Then down
      navigateHistory('down')
      expect(useChatStore.getState().inputValue).toBe('third')
    })

    it('exits navigation when going down from newest', () => {
      const { navigateHistory } = useChatStore.getState()

      navigateHistory('up') // 'third'
      navigateHistory('down') // exits navigation

      const state = useChatStore.getState()
      expect(state.historyIndex).toBe(-1)
      expect(state.inputValue).toBe('')
    })

    it('does nothing when navigating down without history navigation', () => {
      useChatStore.getState().navigateHistory('down')

      expect(useChatStore.getState().historyIndex).toBe(-1)
    })

    it('does nothing with empty history', () => {
      useChatStore.setState({ inputHistory: [] })

      useChatStore.getState().navigateHistory('up')

      expect(useChatStore.getState().historyIndex).toBe(-1)
    })
  })

  describe('setStatus', () => {
    it('sets the chat status', () => {
      useChatStore.getState().setStatus('streaming')
      expect(useChatStore.getState().status).toBe('streaming')

      useChatStore.getState().setStatus('idle')
      expect(useChatStore.getState().status).toBe('idle')
    })
  })

  describe('input history limits', () => {
    it('limits history to 50 items', async () => {
      const mockSend = window.api.claude.send as jest.Mock
      mockSend.mockResolvedValue(undefined)

      useChatStore.getState().startSession('project-123')

      // Send 55 messages
      for (let i = 0; i < 55; i++) {
        await useChatStore.getState().sendMessage(`Message ${i}`)
      }

      const state = useChatStore.getState()
      expect(state.inputHistory).toHaveLength(50)
      expect(state.inputHistory[0]).toBe('Message 5') // First 5 were dropped
      expect(state.inputHistory[49]).toBe('Message 54')
    })
  })
})

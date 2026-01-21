import { render, screen } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '../../stores/chatStore'

// Mock CSS modules
jest.mock('./chat.module.css', () => ({
  message: 'message',
  'message--user': 'message--user',
  messageAvatar: 'messageAvatar',
  'messageAvatar--user': 'messageAvatar--user',
  'messageAvatar--assistant': 'messageAvatar--assistant',
  messageBody: 'messageBody',
  messageContent: 'messageContent',
  'messageContent--user': 'messageContent--user',
  messageError: 'messageError',
  messageTimestamp: 'messageTimestamp',
  fileChanges: 'fileChanges',
  fileChange: 'fileChange',
  'fileChange--created': 'fileChange--created',
  'fileChange--modified': 'fileChange--modified',
  'fileChange--deleted': 'fileChange--deleted',
  fileChangeIcon: 'fileChangeIcon',
  fileChangePath: 'fileChangePath',
}))

// Mock MessageContent component
jest.mock('./MessageContent', () => ({
  MessageContent: ({ content, isStreaming }: { content: string; isStreaming: boolean }) => (
    <div data-testid="message-content" data-streaming={isStreaming}>
      {content}
    </div>
  ),
}))

describe('ChatMessage', () => {
  const baseMessage: ChatMessageType = {
    id: '1',
    role: 'assistant',
    content: 'Hello, how can I help you?',
    timestamp: '2024-01-01T14:30:00Z',
  }

  it('renders assistant message with avatar A', () => {
    render(<ChatMessage message={baseMessage} />)

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument()
  })

  it('renders user message with avatar U', () => {
    const userMessage: ChatMessageType = {
      ...baseMessage,
      role: 'user',
      content: 'I need help',
    }

    render(<ChatMessage message={userMessage} />)

    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('I need help')).toBeInTheDocument()
  })

  it('applies user-specific styles for user messages', () => {
    const userMessage: ChatMessageType = {
      ...baseMessage,
      role: 'user',
    }

    const { container } = render(<ChatMessage message={userMessage} />)

    const messageDiv = container.querySelector('.message--user')
    expect(messageDiv).toBeInTheDocument()
  })

  it('displays formatted timestamp', () => {
    render(<ChatMessage message={baseMessage} />)

    // Timestamp format depends on locale, but should contain time
    const timestamp = screen.getByText(/\d{1,2}:\d{2}/)
    expect(timestamp).toBeInTheDocument()
  })

  it('passes isStreaming to MessageContent', () => {
    const streamingMessage: ChatMessageType = {
      ...baseMessage,
      isStreaming: true,
    }

    render(<ChatMessage message={streamingMessage} />)

    const content = screen.getByTestId('message-content')
    expect(content).toHaveAttribute('data-streaming', 'true')
  })

  it('passes isStreaming as false by default', () => {
    render(<ChatMessage message={baseMessage} />)

    const content = screen.getByTestId('message-content')
    expect(content).toHaveAttribute('data-streaming', 'false')
  })

  it('displays error message when present', () => {
    const errorMessage: ChatMessageType = {
      ...baseMessage,
      error: 'Something went wrong',
    }

    render(<ChatMessage message={errorMessage} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not display error section when no error', () => {
    render(<ChatMessage message={baseMessage} />)

    const errorDiv = document.querySelector('.messageError')
    expect(errorDiv).not.toBeInTheDocument()
  })

  it('displays file changes with correct icons for created files', () => {
    const messageWithChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [
        { path: '/src/new-file.ts', type: 'created' },
      ],
    }

    render(<ChatMessage message={messageWithChanges} />)

    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('new-file.ts')).toBeInTheDocument()
  })

  it('displays file changes with correct icons for modified files', () => {
    const messageWithChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [
        { path: '/src/existing.ts', type: 'modified' },
      ],
    }

    render(<ChatMessage message={messageWithChanges} />)

    expect(screen.getByText('~')).toBeInTheDocument()
    expect(screen.getByText('existing.ts')).toBeInTheDocument()
  })

  it('displays file changes with correct icons for deleted files', () => {
    const messageWithChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [
        { path: '/src/removed.ts', type: 'deleted' },
      ],
    }

    render(<ChatMessage message={messageWithChanges} />)

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('removed.ts')).toBeInTheDocument()
  })

  it('displays multiple file changes', () => {
    const messageWithChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [
        { path: '/src/created.ts', type: 'created' },
        { path: '/src/modified.ts', type: 'modified' },
        { path: '/src/deleted.ts', type: 'deleted' },
      ],
    }

    render(<ChatMessage message={messageWithChanges} />)

    expect(screen.getByText('created.ts')).toBeInTheDocument()
    expect(screen.getByText('modified.ts')).toBeInTheDocument()
    expect(screen.getByText('deleted.ts')).toBeInTheDocument()
  })

  it('does not display file changes section when empty', () => {
    const messageWithEmptyChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [],
    }

    render(<ChatMessage message={messageWithEmptyChanges} />)

    const fileChangesDiv = document.querySelector('.fileChanges')
    expect(fileChangesDiv).not.toBeInTheDocument()
  })

  it('does not display file changes section when undefined', () => {
    render(<ChatMessage message={baseMessage} />)

    const fileChangesDiv = document.querySelector('.fileChanges')
    expect(fileChangesDiv).not.toBeInTheDocument()
  })

  it('shows file path as title on file change element', () => {
    const messageWithChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [
        { path: '/full/path/to/file.ts', type: 'created', summary: 'Created new file' },
      ],
    }

    render(<ChatMessage message={messageWithChanges} />)

    const fileChange = screen.getByText('file.ts').closest('.fileChange')
    expect(fileChange).toHaveAttribute('title', 'Created new file')
  })

  it('uses file path as title when no summary', () => {
    const messageWithChanges: ChatMessageType = {
      ...baseMessage,
      fileChanges: [
        { path: '/full/path/to/file.ts', type: 'created' },
      ],
    }

    render(<ChatMessage message={messageWithChanges} />)

    const fileChange = screen.getByText('file.ts').closest('.fileChange')
    expect(fileChange).toHaveAttribute('title', '/full/path/to/file.ts')
  })
})

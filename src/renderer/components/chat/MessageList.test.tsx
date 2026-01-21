import { render, screen } from '@testing-library/react'
import { MessageList } from './MessageList'
import type { ChatMessage } from '../../stores/chatStore'

// Mock the useScrollToBottom hook
const mockScrollToBottom = jest.fn()
jest.mock('./hooks/useScrollToBottom', () => ({
  useScrollToBottom: () => ({
    containerRef: { current: null },
    isAtBottom: true,
    showScrollButton: false,
    scrollToBottom: mockScrollToBottom,
  }),
}))

// Mock ChatMessage component to avoid react-markdown ESM issue
jest.mock('./ChatMessage', () => ({
  ChatMessage: ({ message }: { message: ChatMessage }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content}
    </div>
  ),
}))

// Mock CSS modules
jest.mock('./chat.module.css', () => ({
  messageListContainer: 'messageListContainer',
  messageList: 'messageList',
  typingIndicator: 'typingIndicator',
  typingDots: 'typingDots',
  typingDot: 'typingDot',
  scrollToBottomButton: 'scrollToBottomButton',
}))

describe('MessageList', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome message',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      role: 'user',
      content: 'Hello there',
      timestamp: '2024-01-01T10:01:00Z',
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Response message',
      timestamp: '2024-01-01T10:02:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all messages', () => {
    render(<MessageList messages={mockMessages} isStreaming={false} />)

    expect(screen.getByText('Welcome message')).toBeInTheDocument()
    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText('Response message')).toBeInTheDocument()
  })

  it('renders empty list when no messages', () => {
    const { container } = render(<MessageList messages={[]} isStreaming={false} />)

    const messageList = container.querySelector('.messageList')
    expect(messageList).toBeInTheDocument()
    expect(messageList?.children.length).toBe(0)
  })

  it('shows typing indicator when streaming and last message is empty', () => {
    const messagesWithEmptyLast: ChatMessage[] = [
      ...mockMessages.slice(0, 2),
      {
        id: '3',
        role: 'assistant',
        content: '',
        timestamp: '2024-01-01T10:02:00Z',
        isStreaming: true,
      },
    ]

    render(<MessageList messages={messagesWithEmptyLast} isStreaming={true} />)

    expect(screen.getByText('Agent is thinking')).toBeInTheDocument()
  })

  it('does not show typing indicator when not streaming', () => {
    render(<MessageList messages={mockMessages} isStreaming={false} />)

    expect(screen.queryByText('Agent is thinking')).not.toBeInTheDocument()
  })

  it('does not show typing indicator when streaming but last message has content', () => {
    render(<MessageList messages={mockMessages} isStreaming={true} />)

    expect(screen.queryByText('Agent is thinking')).not.toBeInTheDocument()
  })
})

describe('MessageList with scroll button', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders messages correctly with scroll functionality', () => {
    // Create a message list component with messages
    const messagesWithScroll: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Test message',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ]

    render(<MessageList messages={messagesWithScroll} isStreaming={false} />)

    // The component renders without errors and shows the message
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('scroll button is controlled by useScrollToBottom hook', () => {
    // The scroll to bottom button visibility is controlled by the hook
    // Our mock sets showScrollButton to false by default
    render(<MessageList messages={[]} isStreaming={false} />)

    // With showScrollButton set to false in our mock, the button should not be visible
    const scrollButton = screen.queryByRole('button', { name: /scroll to bottom/i })
    expect(scrollButton).not.toBeInTheDocument()
  })
})

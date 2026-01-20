# Chat Interface

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Provide a chat terminal interface for conversational interaction with the Claude agent. Users describe their application requirements, answer clarifying questions, and direct the spec generation process through natural language.

### Goals
- Clean, terminal-like chat interface
- Real-time streaming of agent responses
- Markdown rendering in messages
- Show when agent is modifying files
- Easy message input with multi-line support
- Message history navigation

### Non-Goals
- Voice input/output
- Message editing after send
- Branching conversations
- Export chat history

## 2. Architecture

### Component Structure

```
src/renderer/components/chat/
├── index.ts                    # Public exports
├── ChatInterface.tsx          # Main container
├── ChatHeader.tsx             # Status and controls
├── MessageList.tsx            # Scrollable message area
├── ChatMessage.tsx            # Individual message
├── MessageContent.tsx         # Rendered message content
├── FileChangeIndicator.tsx    # Shows file modifications
├── InputArea.tsx              # Text input and send
├── TypingIndicator.tsx        # Agent is responding
├── chat.module.css            # Styles
└── hooks/
    ├── useChat.ts             # Chat state management
    ├── useStreaming.ts        # Handle streaming responses
    └── useScrollToBottom.ts   # Auto-scroll behavior
```

### Data Flow

```
┌─────────────────┐
│    InputArea    │ ── user types message
└────────┬────────┘
         │ onSend
         ▼
┌─────────────────┐
│   ChatStore     │ ── adds user message, sets status='waiting'
└────────┬────────┘
         │ sendMessage action
         ▼
┌─────────────────┐
│  Claude Service │ ── spawns CLI, streams response
└────────┬────────┘
         │ IPC stream events
         ▼
┌─────────────────┐
│   ChatStore     │ ── appends chunks, handles completion
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MessageList    │ ── renders messages, auto-scrolls
└─────────────────┘
```

## 3. Core Types

### 3.1 Message Types

```typescript
/**
 * A single chat message
 */
interface ChatMessage {
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
 * File change made by agent
 */
interface FileChange {
  /** Absolute file path */
  path: string

  /** Type of change */
  type: 'created' | 'modified' | 'deleted'

  /** Brief description of change */
  summary?: string
}

/**
 * Chat session state
 */
interface ChatSession {
  /** Session ID */
  id: string

  /** Associated project ID */
  projectId: string

  /** All messages in session */
  messages: ChatMessage[]

  /** Session start time */
  startedAt: string
}
```

### 3.2 Chat Store

```typescript
interface ChatStore {
  /** Current chat session */
  session: ChatSession | null

  /** Chat status */
  status: 'idle' | 'waiting' | 'streaming' | 'error'

  /** Error message if status is 'error' */
  errorMessage: string | null

  /** Input field value (controlled) */
  inputValue: string

  /** Input history for up/down navigation */
  inputHistory: string[]

  /** Current position in input history */
  historyIndex: number

  // Actions
  startSession: (projectId: string) => void
  sendMessage: (content: string) => Promise<void>
  cancelGeneration: () => Promise<void>
  appendStreamChunk: (chunk: string) => void
  completeMessage: (fileChanges?: FileChange[]) => void
  setError: (message: string) => void
  clearError: () => void
  setInputValue: (value: string) => void
  navigateHistory: (direction: 'up' | 'down') => void
}
```

### 3.3 Stream Event Types

```typescript
/**
 * Events from Claude CLI stream
 */
type StreamEvent =
  | { type: 'start' }
  | { type: 'text'; content: string }
  | { type: 'file_change'; change: FileChange }
  | { type: 'complete' }
  | { type: 'error'; message: string }
```

## 4. Components

### 4.1 ChatInterface (Container)

```typescript
interface ChatInterfaceProps {
  /** Optional initial prompt to display */
  welcomeMessage?: string
}

/**
 * Main chat container that:
 * - Manages chat session
 * - Handles keyboard shortcuts
 * - Coordinates message list and input
 */
```

### 4.2 ChatHeader

```typescript
interface ChatHeaderProps {
  /** Current generation mode */
  generationMode: GenerationMode

  /** Handler to change mode */
  onModeChange: (mode: GenerationMode) => void

  /** Whether agent is connected */
  isConnected: boolean
}

/**
 * Header bar showing:
 * - "Spec Planner" title
 * - Generation mode selector dropdown
 * - Connection status indicator
 */
```

### 4.3 MessageList

```typescript
interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
}

/**
 * Scrollable message container with:
 * - Auto-scroll on new messages
 * - Scroll-to-bottom button when scrolled up
 * - Virtualization for long histories (optional optimization)
 */
```

### 4.4 ChatMessage

```typescript
interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
}

/**
 * Single message display:
 * - Role indicator (icon)
 * - Timestamp
 * - Markdown content
 * - File change badges
 * - Streaming cursor animation
 */
```

### 4.5 MessageContent

```typescript
interface MessageContentProps {
  content: string
  isStreaming?: boolean
}

/**
 * Renders markdown content:
 * - Headings, bold, italic
 * - Code blocks with syntax highlighting
 * - Links (open in external browser)
 * - Lists
 * - Block quotes
 * - Streaming cursor at end
 */
```

### 4.6 FileChangeIndicator

```typescript
interface FileChangeIndicatorProps {
  changes: FileChange[]
  onFileClick: (path: string) => void
}

/**
 * Compact display of file changes:
 * - Created: green badge
 * - Modified: orange badge
 * - Deleted: red badge
 * - Click opens file in editor
 */
```

### 4.7 InputArea

```typescript
interface InputAreaProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onCancel: () => void
  onHistoryNavigate: (direction: 'up' | 'down') => void
  disabled: boolean
  isGenerating: boolean
}

/**
 * Input text area with:
 * - Auto-resize for multi-line
 * - Send button
 * - Cancel button (during generation)
 * - Enter to send, Shift+Enter for newline
 * - Up/Down for history
 */
```

### 4.8 TypingIndicator

```typescript
interface TypingIndicatorProps {
  isVisible: boolean
}

/**
 * Shows "Agent is thinking..." with animated dots
 * Displayed below message list during 'waiting' status
 */
```

## 5. Message Flow

### 5.1 Send Message Flow

```
1. User types message and presses Enter/clicks Send
2. ChatStore.sendMessage() called:
   a. Add user message to session.messages
   b. Set status = 'waiting'
   c. Clear inputValue
   d. Add to inputHistory
3. IPC: claude:send(message, projectContext)
4. Main process spawns Claude CLI
5. Status changes to 'streaming' on first chunk
6. Stream chunks appended via appendStreamChunk()
7. On completion, completeMessage(fileChanges) called
8. Status returns to 'idle'
```

### 5.2 Cancel Flow

```
1. User clicks Cancel button
2. ChatStore.cancelGeneration() called:
   a. IPC: claude:cancel
   b. Mark current message as complete (partial)
   c. Set status = 'idle'
3. Main process sends SIGTERM to CLI process
```

### 5.3 Error Flow

```
1. Error occurs during generation
2. StreamEvent { type: 'error', message } received
3. ChatStore.setError(message) called:
   a. Set status = 'error'
   b. Set errorMessage
   c. Mark message with error
4. UI shows error toast
5. User can retry or send new message
```

## 6. Welcome Message

When a new project starts, the agent sends an initial welcome message:

```typescript
const WELCOME_MESSAGE = `# Welcome to Spec Planner! 👋

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
```

## 7. User Interactions

### 7.1 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift+Enter` | Insert newline |
| `↑` (in empty input) | Previous message from history |
| `↓` (in history mode) | Next message from history |
| `Escape` | Cancel generation / Clear input |
| `Cmd+J` | Focus chat input (global) |

### 7.2 Message Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Copy message | Right-click → Copy | Copy markdown to clipboard |
| Copy code block | Click copy icon | Copy code content |
| Open file | Click file badge | Open in editor panel |

## 8. Styling

### 8.1 Chat Container

```css
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.chat-header__title {
  font-size: 14px;
  font-weight: 600;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.input-area {
  border-top: 1px solid var(--border-color);
  padding: 12px 16px;
}
```

### 8.2 Messages

```css
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message--user {
  flex-direction: row-reverse;
}

.message__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.message__avatar--user {
  background: var(--accent-color);
  color: white;
}

.message__avatar--assistant {
  background: var(--bg-tertiary);
}

.message__content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-secondary);
}

.message--user .message__content {
  background: var(--accent-color);
  color: white;
}

.message__timestamp {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Markdown content */
.message__text {
  font-size: 14px;
  line-height: 1.5;
}

.message__text p {
  margin: 0.5em 0;
}

.message__text pre {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.message__text code {
  font-family: var(--font-mono);
  font-size: 13px;
}
```

### 8.3 Input Area

```css
.input-area {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.input-area__textarea {
  flex: 1;
  min-height: 40px;
  max-height: 200px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
}

.input-area__textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.input-area__button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.input-area__button--send {
  background: var(--accent-color);
  color: white;
}

.input-area__button--cancel {
  background: var(--bg-tertiary);
}

.input-area__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 8.4 Streaming Indicator

```css
.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--text-primary);
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  vertical-align: text-bottom;
}

@keyframes blink {
  50% { opacity: 0; }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.typing-indicator__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: bounce 1.4s ease-in-out infinite;
}

.typing-indicator__dot:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator__dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
```

### 8.5 File Change Badges

```css
.file-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.file-change {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.file-change--created {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.file-change--modified {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.file-change--deleted {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.file-change:hover {
  opacity: 0.8;
}
```

## 9. Error Handling

```typescript
/**
 * Chat-specific errors
 */
class ChatError extends Error {
  constructor(
    message: string,
    public code: 'SEND_FAILED' | 'STREAM_ERROR' | 'CANCEL_FAILED' | 'CONNECTION_LOST',
    public recoverable: boolean
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

// Error display:
// - Toast notification for transient errors
// - Inline error message on affected message
// - Retry button for recoverable errors
```

## 10. Implementation Phases

### Phase 1: Message Display
**Goal:** Render static messages
- [ ] Create ChatInterface container
- [ ] Create MessageList component
- [ ] Create ChatMessage component
- [ ] Create MessageContent with markdown rendering
- [ ] Add basic styling

### Phase 2: Message Input
**Goal:** User can type and send messages
- [ ] Create InputArea component
- [ ] Implement auto-resize textarea
- [ ] Add send button
- [ ] Create ChatStore with Zustand
- [ ] Handle Enter/Shift+Enter

### Phase 3: Message History
**Goal:** Navigate previous inputs
- [ ] Track input history in store
- [ ] Implement up/down arrow navigation
- [ ] Persist history to localStorage

### Phase 4: Streaming Integration
**Goal:** Real-time response display
- [ ] Connect to Claude IPC stream
- [ ] Implement useStreaming hook
- [ ] Add streaming cursor
- [ ] Handle stream completion
- [ ] Add cancel functionality

### Phase 5: File Change Display
**Goal:** Show agent file modifications
- [ ] Parse file changes from stream
- [ ] Create FileChangeIndicator component
- [ ] Click to open in editor
- [ ] Style badges

### Phase 6: Chat Header
**Goal:** Mode selection and status
- [ ] Create ChatHeader component
- [ ] Add generation mode dropdown
- [ ] Add connection status indicator

### Phase 7: Polish
**Goal:** Production ready
- [ ] Add welcome message
- [ ] Add error handling
- [ ] Add scroll-to-bottom button
- [ ] Optimize scroll performance
- [ ] Test keyboard shortcuts
- [ ] Accessibility audit

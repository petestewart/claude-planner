/**
 * ClaudeService unit tests
 *
 * Tests the main Claude service implementation with mocked ProcessManager
 */

import type { ClaudeService, StreamEvent, ProjectContext } from '../types'
import { ClaudeServiceError } from '../types'

// Create mock functions
const mockSpawnFn = jest.fn()
const mockKill = jest.fn()
const mockCheckAvailability = jest.fn()

const mockParse = jest.fn().mockReturnValue([])
const mockFlush = jest.fn().mockReturnValue([])
const mockReset = jest.fn()

// Mock the ProcessManager
jest.mock('../process-manager', () => {
  return {
    ProcessManager: jest.fn().mockImplementation(() => ({
      spawn: mockSpawnFn,
      kill: mockKill,
      checkAvailability: mockCheckAvailability,
    })),
  }
})

// Mock the StreamParser
jest.mock('../stream-parser', () => {
  return {
    StreamParser: jest.fn().mockImplementation(() => ({
      parse: mockParse,
      flush: mockFlush,
      reset: mockReset,
    })),
  }
})

import { createClaudeService } from '../claude-service'

describe('ClaudeService', () => {
  let service: ClaudeService

  beforeEach(() => {
    jest.clearAllMocks()

    service = createClaudeService({
      workingDirectory: '/test/project',
      cliPath: '/usr/bin/claude',
    })
  })

  afterEach(() => {
    service.dispose()
  })

  async function* mockSpawn(chunks: string[]): AsyncGenerator<string> {
    for (const chunk of chunks) {
      yield chunk
    }
  }

  describe('getStatus', () => {
    it('returns initial status', () => {
      const status = service.getStatus()

      expect(status.ready).toBe(false)
      expect(status.state).toBe('idle')
      expect(status.errorMessage).toBeUndefined()
    })

    it('returns a copy of status to prevent mutation', () => {
      const status1 = service.getStatus()
      const status2 = service.getStatus()

      expect(status1).not.toBe(status2)
      expect(status1).toEqual(status2)
    })
  })

  describe('checkAvailability', () => {
    it('returns true when CLI is available', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        version: '1.2.3',
      })

      const result = await service.checkAvailability()

      expect(result).toBe(true)
      expect(service.getStatus().ready).toBe(true)
      expect(service.getStatus().cliVersion).toBe('1.2.3')
    })

    it('returns false when CLI is not available', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: false,
      })

      const result = await service.checkAvailability()

      expect(result).toBe(false)
      expect(service.getStatus().ready).toBe(false)
    })

    it('returns false when check throws error', async () => {
      mockCheckAvailability.mockRejectedValue(new Error('CLI not found'))

      const result = await service.checkAvailability()

      expect(result).toBe(false)
      expect(service.getStatus().ready).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('emits start and complete events for successful message', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn([]))

      const events: StreamEvent[] = []
      for await (const event of service.sendMessage('Hello')) {
        events.push(event)
      }

      expect(events.length).toBeGreaterThanOrEqual(2)
      expect(events[0]).toEqual(expect.objectContaining({ type: 'start' }))
      expect(events[events.length - 1]).toEqual(expect.objectContaining({ type: 'complete' }))
    })

    it('parses stream chunks through StreamParser', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn(['chunk1', 'chunk2']))
      mockParse
        .mockReturnValueOnce([{ type: 'text', content: 'Hello' }])
        .mockReturnValueOnce([{ type: 'text', content: ' World' }])

      const events: StreamEvent[] = []
      for await (const event of service.sendMessage('Test')) {
        events.push(event)
      }

      expect(mockParse).toHaveBeenCalledWith('chunk1')
      expect(mockParse).toHaveBeenCalledWith('chunk2')
      expect(events).toContainEqual({ type: 'text', content: 'Hello' })
      expect(events).toContainEqual({ type: 'text', content: ' World' })
    })

    it('flushes parser at end of stream', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn([]))
      mockFlush.mockReturnValue([{ type: 'text', content: 'flushed' }])

      const events: StreamEvent[] = []
      for await (const event of service.sendMessage('Test')) {
        events.push(event)
      }

      expect(mockFlush).toHaveBeenCalled()
      expect(events).toContainEqual({ type: 'text', content: 'flushed' })
    })

    it('throws when service is busy', async () => {
      // Start a message that will hang
      async function* hangingSpawn(): AsyncGenerator<string> {
        await new Promise(() => {}) // Never resolves
      }
      mockSpawnFn.mockImplementation(hangingSpawn)

      // Start first message (don't await)
      const firstMessage = service.sendMessage('First')
      // Consume first event to start the generator
      await firstMessage.next()

      // Try to send second message - this should throw immediately
      const secondMessage = service.sendMessage('Second')

      await expect(secondMessage.next()).rejects.toThrow(ClaudeServiceError)
    })

    it('includes context in command when provided', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn([]))

      const context: ProjectContext = {
        projectId: 'test-123',
        projectName: 'Test Project',
        rootPath: '/test',
        targetLanguage: 'TypeScript',
        generationMode: 'incremental',
        requirements: [],
        decisions: [],
        existingSpecs: [],
      }

      // Consume the generator
      for await (const _ of service.sendMessage('Hello', { context })) {
        // Just consume events
      }

      expect(mockSpawnFn).toHaveBeenCalled()
      const args = mockSpawnFn.mock.calls[0]?.[0] as string[]
      expect(args).toContain('--system-prompt')
    })

    it('includes system prompt when provided without context', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn([]))

      for await (const _ of service.sendMessage('Hello', { systemPrompt: 'Be helpful' })) {
        // Consume events
      }

      const args = mockSpawnFn.mock.calls[0]?.[0] as string[]
      expect(args).toContain('--system-prompt')
      expect(args).toContain('Be helpful')
    })

    it('includes files when specified', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn([]))

      for await (const _ of service.sendMessage('Hello', {
        includeFiles: ['/path/to/file1', '/path/to/file2'],
      })) {
        // Consume events
      }

      const args = mockSpawnFn.mock.calls[0]?.[0] as string[]
      expect(args).toContain('--add-dir')
      expect(args).toContain('/path/to/file1')
      expect(args).toContain('/path/to/file2')
    })

    it('emits error event when spawn throws', async () => {
      mockSpawnFn.mockImplementation(async function* () {
        throw new Error('Spawn failed')
      })

      const events: StreamEvent[] = []
      for await (const event of service.sendMessage('Test')) {
        events.push(event)
      }

      expect(events).toContainEqual(expect.objectContaining({
        type: 'error',
        message: 'Spawn failed',
      }))
    })

    it('emits cancelled error when request is cancelled', async () => {
      mockSpawnFn.mockImplementation(async function* () {
        throw new ClaudeServiceError('Request cancelled', 'CANCELLED')
      })

      const events: StreamEvent[] = []
      for await (const event of service.sendMessage('Test')) {
        events.push(event)
      }

      expect(events).toContainEqual(expect.objectContaining({
        type: 'error',
        message: 'Request cancelled',
        code: 'CANCELLED',
      }))
    })

    it('returns to idle state after successful completion', async () => {
      mockSpawnFn.mockImplementation(() => mockSpawn([]))

      for await (const _ of service.sendMessage('Test')) {
        // Consume events
      }

      expect(service.getStatus().state).toBe('idle')
    })

    it('sets error state when non-cancelled error occurs', async () => {
      mockSpawnFn.mockImplementation(async function* () {
        throw new Error('Unexpected error')
      })

      for await (const _ of service.sendMessage('Test')) {
        // Consume events
      }

      expect(service.getStatus().state).toBe('error')
      expect(service.getStatus().errorMessage).toBe('Unexpected error')
    })
  })

  describe('cancel', () => {
    it('does nothing when no request is active', async () => {
      await expect(service.cancel()).resolves.not.toThrow()
    })
  })

  describe('dispose', () => {
    it('kills process manager', () => {
      service.dispose()

      expect(mockKill).toHaveBeenCalled()
    })

    it('can be called multiple times safely', () => {
      service.dispose()
      service.dispose()

      expect(mockKill).toHaveBeenCalledTimes(2)
    })
  })

  describe('command building', () => {
    it('always includes --print and --output-format stream-json', async () => {
      mockSpawnFn.mockImplementation(async function* () {})

      for await (const _ of service.sendMessage('Test')) {
        // Consume
      }

      const args = mockSpawnFn.mock.calls[0]?.[0] as string[]
      expect(args).toContain('--print')
      expect(args).toContain('--output-format')
      expect(args).toContain('stream-json')
    })

    it('includes message as final argument', async () => {
      mockSpawnFn.mockImplementation(async function* () {})

      for await (const _ of service.sendMessage('My test message')) {
        // Consume
      }

      const args = mockSpawnFn.mock.calls[0]?.[0] as string[]
      expect(args?.[args.length - 1]).toBe('My test message')
    })
  })
})

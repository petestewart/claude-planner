/**
 * Tests for IPC Mock utilities
 *
 * These tests verify the IPC mock system works correctly and
 * demonstrate proper usage patterns for renderer tests.
 */

import {
  getMockedAPI,
  mockDefaults,
  mockIPCEvents,
  setupMockedAPI,
} from './ipc-mock'
import type { FileWatchEvent } from '../../shared/types/file'
import type { StreamEvent } from '../../shared/types/git'

describe('IPC Mock', () => {
  describe('getMockedAPI', () => {
    it('returns the mocked API from window', () => {
      const api = getMockedAPI()
      expect(api).toBeDefined()
      expect(api.file).toBeDefined()
      expect(api.claude).toBeDefined()
      expect(api.git).toBeDefined()
    })

    it('has all file methods as jest mocks', () => {
      const api = getMockedAPI()
      expect(jest.isMockFunction(api.file.read)).toBe(true)
      expect(jest.isMockFunction(api.file.write)).toBe(true)
      expect(jest.isMockFunction(api.file.create)).toBe(true)
      expect(jest.isMockFunction(api.file.rename)).toBe(true)
      expect(jest.isMockFunction(api.file.delete)).toBe(true)
      expect(jest.isMockFunction(api.file.list)).toBe(true)
      expect(jest.isMockFunction(api.file.watchStart)).toBe(true)
      expect(jest.isMockFunction(api.file.watchStop)).toBe(true)
      expect(jest.isMockFunction(api.file.onWatchEvent)).toBe(true)
    })

    it('has all dir methods as jest mocks', () => {
      const api = getMockedAPI()
      expect(jest.isMockFunction(api.dir.select)).toBe(true)
      expect(jest.isMockFunction(api.dir.create)).toBe(true)
    })

    it('has all claude methods as jest mocks', () => {
      const api = getMockedAPI()
      expect(jest.isMockFunction(api.claude.init)).toBe(true)
      expect(jest.isMockFunction(api.claude.send)).toBe(true)
      expect(jest.isMockFunction(api.claude.onStream)).toBe(true)
      expect(jest.isMockFunction(api.claude.cancel)).toBe(true)
      expect(jest.isMockFunction(api.claude.getStatus)).toBe(true)
    })

    it('has all git methods as jest mocks', () => {
      const api = getMockedAPI()
      expect(jest.isMockFunction(api.git.init)).toBe(true)
      expect(jest.isMockFunction(api.git.connect)).toBe(true)
      expect(jest.isMockFunction(api.git.isRepo)).toBe(true)
      expect(jest.isMockFunction(api.git.status)).toBe(true)
      expect(jest.isMockFunction(api.git.stage)).toBe(true)
      expect(jest.isMockFunction(api.git.stageAll)).toBe(true)
      expect(jest.isMockFunction(api.git.unstage)).toBe(true)
      expect(jest.isMockFunction(api.git.commit)).toBe(true)
      expect(jest.isMockFunction(api.git.diff)).toBe(true)
      expect(jest.isMockFunction(api.git.log)).toBe(true)
      expect(jest.isMockFunction(api.git.setAutoCommit)).toBe(true)
      expect(jest.isMockFunction(api.git.triggerAutoCommit)).toBe(true)
    })

    it('has all project methods as jest mocks', () => {
      const api = getMockedAPI()
      expect(jest.isMockFunction(api.project.load)).toBe(true)
      expect(jest.isMockFunction(api.project.save)).toBe(true)
    })

    it('has all template methods as jest mocks', () => {
      const api = getMockedAPI()
      expect(jest.isMockFunction(api.template.list)).toBe(true)
      expect(jest.isMockFunction(api.template.get)).toBe(true)
      expect(jest.isMockFunction(api.template.save)).toBe(true)
      expect(jest.isMockFunction(api.template.delete)).toBe(true)
      expect(jest.isMockFunction(api.template.getCustomPath)).toBe(true)
      expect(jest.isMockFunction(api.template.getDefaultPath)).toBe(true)
      expect(jest.isMockFunction(api.template.setCustomPath)).toBe(true)
    })
  })

  describe('mock defaults', () => {
    it('returns default file node', () => {
      const node = mockDefaults.fileNode()
      expect(node.type).toBe('directory')
      expect(node.depth).toBe(0)
    })

    it('allows overriding file node fields', () => {
      const node = mockDefaults.fileNode({ name: 'custom', type: 'file' })
      expect(node.name).toBe('custom')
      expect(node.type).toBe('file')
    })

    it('returns file node with children', () => {
      const node = mockDefaults.fileNodeWithChildren()
      expect(node.children).toBeDefined()
      expect(node.children!.length).toBe(2)
    })

    it('returns default git status', () => {
      const status = mockDefaults.gitStatus()
      expect(status.isRepo).toBe(true)
      expect(status.branch).toBe('main')
      expect(status.isDirty).toBe(false)
    })

    it('returns default claude status', () => {
      const status = mockDefaults.claudeStatus()
      expect(status.ready).toBe(true)
      expect(status.state).toBe('idle')
    })

    it('returns default project state', () => {
      const state = mockDefaults.projectState()
      expect(state.name).toBe('Test Project')
      expect(state.generationMode).toBe('incremental')
    })

    it('returns default template info', () => {
      const info = mockDefaults.templateInfo()
      expect(info.id).toBe('standard')
      expect(info.isBuiltIn).toBe(true)
    })

    it('returns default template', () => {
      const template = mockDefaults.template()
      expect(template.id).toBe('standard')
      expect(template.version).toBe('1.0.0')
      expect(template.files).toEqual([])
    })
  })

  describe('configuring mock responses', () => {
    it('can configure file.read to return specific content', async () => {
      const api = getMockedAPI()
      api.file.read.mockResolvedValue('# Hello World\n\nThis is test content.')

      const content = await window.api.file.read('/test/file.md')
      expect(content).toBe('# Hello World\n\nThis is test content.')
      expect(api.file.read).toHaveBeenCalledWith('/test/file.md')
    })

    it('can configure file.read to reject with error', async () => {
      const api = getMockedAPI()
      api.file.read.mockRejectedValue(new Error('File not found'))

      await expect(window.api.file.read('/nonexistent')).rejects.toThrow('File not found')
    })

    it('can configure file.list to return custom tree', async () => {
      const api = getMockedAPI()
      const customTree = mockDefaults.fileNodeWithChildren()
      api.file.list.mockResolvedValue(customTree)

      const tree = await window.api.file.list('/test')
      expect(tree.children).toHaveLength(2)
    })

    it('can configure git.status to return dirty state', async () => {
      const api = getMockedAPI()
      api.git.status.mockResolvedValue(
        mockDefaults.gitStatus({
          isDirty: true,
          modified: [{ path: 'test.ts', status: 'modified' }],
        })
      )

      const status = await window.api.git.status()
      expect(status.isDirty).toBe(true)
      expect(status.modified).toHaveLength(1)
    })

    it('can verify IPC calls with specific arguments', async () => {
      const api = getMockedAPI()

      await window.api.file.write('/test/file.md', '# Content')

      expect(api.file.write).toHaveBeenCalledTimes(1)
      expect(api.file.write).toHaveBeenCalledWith('/test/file.md', '# Content')
    })
  })

  describe('event simulation', () => {
    it('can simulate file watch events', () => {
      const handler = jest.fn()
      window.api.file.onWatchEvent(handler)

      const event: FileWatchEvent = {
        type: 'change',
        path: '/test/file.md',
        timestamp: new Date().toISOString(),
      }
      mockIPCEvents.emitFileWatchEvent(event)

      expect(handler).toHaveBeenCalledWith(event)
    })

    it('can simulate multiple file watch events', () => {
      const handler = jest.fn()
      window.api.file.onWatchEvent(handler)

      mockIPCEvents.emitFileWatchEvent({
        type: 'add',
        path: '/test/new.md',
        timestamp: new Date().toISOString(),
      })
      mockIPCEvents.emitFileWatchEvent({
        type: 'change',
        path: '/test/new.md',
        timestamp: new Date().toISOString(),
      })

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('can unsubscribe from file watch events', () => {
      const handler = jest.fn()
      const unsubscribe = window.api.file.onWatchEvent(handler)

      unsubscribe()

      mockIPCEvents.emitFileWatchEvent({
        type: 'change',
        path: '/test/file.md',
        timestamp: new Date().toISOString(),
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it('can simulate Claude stream events', () => {
      const handler = jest.fn()
      window.api.claude.onStream(handler)

      const events: StreamEvent[] = [
        { type: 'start', timestamp: new Date().toISOString() },
        { type: 'text', content: 'Hello!' },
        { type: 'complete', timestamp: new Date().toISOString() },
      ]

      events.forEach((event) => mockIPCEvents.emitClaudeStreamEvent(event))

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, events[0])
      expect(handler).toHaveBeenNthCalledWith(2, events[1])
      expect(handler).toHaveBeenNthCalledWith(3, events[2])
    })

    it('can simulate a complete Claude response', async () => {
      const handler = jest.fn()
      window.api.claude.onStream(handler)

      await mockIPCEvents.emitClaudeResponse('This is the response text.')

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler.mock.calls[0][0].type).toBe('start')
      expect(handler.mock.calls[1][0]).toEqual({ type: 'text', content: 'This is the response text.' })
      expect(handler.mock.calls[2][0].type).toBe('complete')
    })

    it('tracks handler counts for debugging', () => {
      expect(mockIPCEvents.getFileWatchHandlerCount()).toBe(0)
      expect(mockIPCEvents.getClaudeStreamHandlerCount()).toBe(0)

      const unsubscribe1 = window.api.file.onWatchEvent(() => {})
      expect(mockIPCEvents.getFileWatchHandlerCount()).toBe(1)

      const unsubscribe2 = window.api.claude.onStream(() => {})
      expect(mockIPCEvents.getClaudeStreamHandlerCount()).toBe(1)

      unsubscribe1()
      expect(mockIPCEvents.getFileWatchHandlerCount()).toBe(0)

      unsubscribe2()
      expect(mockIPCEvents.getClaudeStreamHandlerCount()).toBe(0)
    })
  })

  describe('setupMockedAPI', () => {
    it('can be called to reset the API completely', () => {
      // Mess up the API
      const api = getMockedAPI()
      api.file.read.mockResolvedValue('modified')

      // Reset it
      setupMockedAPI()

      // Should have fresh mocks
      const freshApi = getMockedAPI()
      expect(freshApi.file.read).not.toHaveBeenCalled()
    })
  })
})

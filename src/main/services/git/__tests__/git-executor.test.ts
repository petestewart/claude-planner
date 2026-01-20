/**
 * GitExecutor tests
 */

import { GitExecutor } from '../git-executor'
import { GitExecutionError } from '../types'

describe('GitExecutor', () => {
  let executor: GitExecutor
  let testCwd: string

  beforeEach(() => {
    // Use /tmp as a safe directory for testing
    testCwd = '/tmp'
    executor = new GitExecutor('git', testCwd)
  })

  describe('run', () => {
    it('should execute a simple git command', async () => {
      const result = await executor.run(['--version'])

      expect(result).toContain('git version')
    })

    it('should throw GitExecutionError on invalid command', async () => {
      await expect(executor.run(['invalid-command-12345'])).rejects.toThrow(GitExecutionError)
    })

    it('should include command in error', async () => {
      try {
        await executor.run(['invalid-command-12345'])
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(GitExecutionError)
        const gitError = error as GitExecutionError
        expect(gitError.command).toEqual(['invalid-command-12345'])
      }
    })
  })

  describe('runSilent', () => {
    it('should return output on success', async () => {
      const result = await executor.runSilent(['--version'])

      expect(result).toContain('git version')
    })

    it('should return null on error', async () => {
      const result = await executor.runSilent(['invalid-command-12345'])

      expect(result).toBeNull()
    })
  })

  describe('setCwd', () => {
    it('should update the working directory', () => {
      executor.setCwd('/new/path')

      expect(executor.getCwd()).toBe('/new/path')
    })
  })

  describe('getCwd', () => {
    it('should return the current working directory', () => {
      expect(executor.getCwd()).toBe(testCwd)
    })
  })
})

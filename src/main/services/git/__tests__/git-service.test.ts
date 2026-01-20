/**
 * GitService tests
 *
 * These tests use a real temporary directory and git commands
 * to test the full integration.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { createGitService } from '../git-service'
import type { GitService } from '../types'

describe('GitService', () => {
  let service: GitService
  let testDir: string

  beforeEach(async () => {
    // Create a unique temp directory for each test
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-test-'))
    service = createGitService({ cwd: testDir })
  })

  afterEach(async () => {
    service.dispose()
    // Clean up temp directory
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('isRepo', () => {
    it('should return false for non-repo directory', async () => {
      const result = await service.isRepo()
      expect(result).toBe(false)
    })

    it('should return true after init', async () => {
      await service.init()
      const result = await service.isRepo()
      expect(result).toBe(true)
    })
  })

  describe('init', () => {
    it('should initialize a git repository', async () => {
      await service.init()

      // Check that .git directory exists
      const gitDir = path.join(testDir, '.git')
      const stat = await fs.stat(gitDir)
      expect(stat.isDirectory()).toBe(true)
    })

    it('should create .gitignore file', async () => {
      await service.init()

      const gitignorePath = path.join(testDir, '.gitignore')
      const content = await fs.readFile(gitignorePath, 'utf-8')

      expect(content).toContain('node_modules/')
      expect(content).toContain('.env')
    })

    it('should not overwrite existing .gitignore', async () => {
      const customContent = '# Custom gitignore\n*.custom'
      await fs.writeFile(path.join(testDir, '.gitignore'), customContent)

      await service.init()

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8')
      expect(content).toBe(customContent)
    })
  })

  describe('getStatus', () => {
    it('should return not-repo status for non-repo', async () => {
      const status = await service.getStatus()

      expect(status.isRepo).toBe(false)
      expect(status.branch).toBeNull()
      expect(status.isDirty).toBe(false)
    })

    it('should return clean status for empty repo', async () => {
      await service.init()

      const status = await service.getStatus()

      expect(status.isRepo).toBe(true)
      // Branch might be null for a repo with no commits
      expect(status.staged).toHaveLength(0)
      expect(status.modified).toHaveLength(0)
    })

    it('should detect untracked files', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'untracked.txt'), 'content')

      const status = await service.getStatus()

      expect(status.untracked).toContain('untracked.txt')
      expect(status.isDirty).toBe(true)
    })

    it('should detect staged files', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'staged.txt'), 'content')
      await service.stage(['staged.txt'])

      const status = await service.getStatus()

      expect(status.staged).toHaveLength(1)
      expect(status.staged[0]!.path).toBe('staged.txt')
      expect(status.staged[0]!.status).toBe('added')
    })

    it('should detect modified files', async () => {
      await service.init()

      // Create, stage, and commit a file
      await fs.writeFile(path.join(testDir, 'test.txt'), 'original')
      await service.stageAll()
      await service.commit('Initial commit')

      // Modify the file
      await fs.writeFile(path.join(testDir, 'test.txt'), 'modified')

      const status = await service.getStatus()

      expect(status.modified).toHaveLength(1)
      expect(status.modified[0]!.path).toBe('test.txt')
      expect(status.modified[0]!.status).toBe('modified')
    })
  })

  describe('stage', () => {
    it('should stage specific files', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1')
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2')

      await service.stage(['file1.txt'])

      const status = await service.getStatus()
      expect(status.staged).toHaveLength(1)
      expect(status.staged[0]!.path).toBe('file1.txt')
      expect(status.untracked).toContain('file2.txt')
    })

    it('should do nothing for empty array', async () => {
      await service.init()
      await service.stage([])
      // Should not throw
    })
  })

  describe('stageAll', () => {
    it('should stage all files', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1')
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2')

      await service.stageAll()

      const status = await service.getStatus()
      expect(status.staged).toHaveLength(3) // Including .gitignore
      expect(status.untracked).toHaveLength(0)
    })
  })

  describe('unstage', () => {
    it('should unstage specific files', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1')
      await service.stage(['file1.txt'])

      await service.unstage(['file1.txt'])

      const status = await service.getStatus()
      expect(status.staged).toHaveLength(0)
      expect(status.untracked).toContain('file1.txt')
    })
  })

  describe('commit', () => {
    it('should create a commit', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content')
      await service.stageAll()

      const commitInfo = await service.commit('Test commit')

      expect(commitInfo.hash).toBeTruthy()
      expect(commitInfo.shortHash).toBeTruthy()
      expect(commitInfo.message).toBe('Test commit')
      expect(commitInfo.authorName).toBeTruthy()
    })

    it('should result in clean status', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content')
      await service.stageAll()
      await service.commit('Test commit')

      const status = await service.getStatus()
      expect(status.isDirty).toBe(false)
    })
  })

  describe('log', () => {
    it('should return empty array for repo with no commits', async () => {
      await service.init()

      const log = await service.log()

      expect(log).toHaveLength(0)
    })

    it('should return commits', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content')
      await service.stageAll()
      await service.commit('First commit')

      const log = await service.log()

      expect(log).toHaveLength(1)
      expect(log[0]!.message).toBe('First commit')
    })

    it('should respect limit parameter', async () => {
      await service.init()

      // Create multiple commits
      for (let i = 1; i <= 5; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.txt`), `content${i}`)
        await service.stageAll()
        await service.commit(`Commit ${i}`)
      }

      const log = await service.log(3)

      expect(log).toHaveLength(3)
    })
  })

  describe('diff', () => {
    it('should return empty array when no changes', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content')
      await service.stageAll()
      await service.commit('Initial')

      const diffs = await service.diff()

      expect(diffs).toHaveLength(0)
    })

    it('should return diffs for unstaged changes', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'test.txt'), 'original\n')
      await service.stageAll()
      await service.commit('Initial')

      await fs.writeFile(path.join(testDir, 'test.txt'), 'modified\n')

      const diffs = await service.diff()

      expect(diffs).toHaveLength(1)
      expect(diffs[0]!.path).toBe('test.txt')
      expect(diffs[0]!.type).toBe('modified')
    })

    it('should return diffs for staged changes', async () => {
      await service.init()
      await fs.writeFile(path.join(testDir, 'test.txt'), 'original\n')
      await service.stageAll()
      await service.commit('Initial')

      await fs.writeFile(path.join(testDir, 'test.txt'), 'modified\n')
      await service.stage(['test.txt'])

      const diffs = await service.diff({ staged: true })

      expect(diffs).toHaveLength(1)
      expect(diffs[0]!.path).toBe('test.txt')
    })
  })

  describe('setAutoCommit', () => {
    it('should enable auto-commit', () => {
      service.setAutoCommit(true)
      // Should not throw
    })

    it('should disable auto-commit', () => {
      service.setAutoCommit(true)
      service.setAutoCommit(false)
      // Should not throw
    })
  })

  describe('dispose', () => {
    it('should clean up resources', () => {
      service.setAutoCommit(true)
      service.triggerAutoCommit()
      service.dispose()
      // Should not throw or leave hanging timers
    })
  })
})

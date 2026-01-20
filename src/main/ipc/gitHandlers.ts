/**
 * Git IPC Handlers
 *
 * Registers IPC handlers for git operations.
 */

import { ipcMain } from 'electron'
import {
  createGitService,
  type GitService,
  type GitServiceOptions,
  type DiffOptions,
} from '../services/git'

let gitService: GitService | null = null

export function registerGitHandlers(): void {
  // Initialize or switch git service to a directory
  ipcMain.handle(
    'git:init',
    async (_event, cwd: string, options?: Partial<GitServiceOptions>) => {
      // Dispose existing service if any
      if (gitService) {
        gitService.dispose()
      }

      gitService = createGitService({ cwd, ...options })
      await gitService.init()
      return { success: true }
    }
  )

  // Connect to an existing git repo
  ipcMain.handle(
    'git:connect',
    async (_event, cwd: string, options?: Partial<GitServiceOptions>) => {
      // Dispose existing service if any
      if (gitService) {
        gitService.dispose()
      }

      gitService = createGitService({ cwd, ...options })
      const isRepo = await gitService.isRepo()
      return { isRepo }
    }
  )

  // Check if directory is a git repo
  ipcMain.handle('git:isRepo', async (_event, cwd?: string) => {
    if (cwd) {
      const tempService = createGitService({ cwd })
      const isRepo = await tempService.isRepo()
      tempService.dispose()
      return isRepo
    }

    if (!gitService) {
      return false
    }
    return gitService.isRepo()
  })

  // Get git status
  ipcMain.handle('git:status', async () => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.getStatus()
  })

  // Stage files
  ipcMain.handle('git:stage', async (_event, files: string[]) => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.stage(files)
  })

  // Stage all files
  ipcMain.handle('git:stageAll', async () => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.stageAll()
  })

  // Unstage files
  ipcMain.handle('git:unstage', async (_event, files: string[]) => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.unstage(files)
  })

  // Create a commit
  ipcMain.handle('git:commit', async (_event, message: string) => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.commit(message)
  })

  // Get diffs
  ipcMain.handle('git:diff', async (_event, options?: DiffOptions) => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.diff(options)
  })

  // Get commit log
  ipcMain.handle('git:log', async (_event, limit?: number) => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    return gitService.log(limit)
  })

  // Set auto-commit
  ipcMain.handle('git:setAutoCommit', async (_event, enabled: boolean) => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    gitService.setAutoCommit(enabled)
    return { success: true }
  })

  // Trigger auto-commit
  ipcMain.handle('git:triggerAutoCommit', async () => {
    if (!gitService) {
      throw new Error('Git service not initialized. Call git:connect first.')
    }
    gitService.triggerAutoCommit()
    return { success: true }
  })
}

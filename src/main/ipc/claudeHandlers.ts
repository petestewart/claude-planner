/**
 * Claude IPC Handlers
 *
 * Registers IPC handlers for Claude service communication between
 * the renderer and main process.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { createClaudeService } from '../services/claude'
import type { ClaudeService, ProjectContext, StreamEvent } from '../services/claude'

let claudeService: ClaudeService | null = null

interface InitOptions {
  workingDirectory: string
  cliPath?: string
  debug?: boolean
}

export function registerClaudeHandlers(): void {
  // Initialize service
  ipcMain.handle(
    'claude:init',
    async (
      _event,
      options: InitOptions
    ): Promise<{ available: boolean; status: ReturnType<ClaudeService['getStatus']> }> => {
      claudeService = createClaudeService({
        workingDirectory: options.workingDirectory,
        ...(options.cliPath ? { cliPath: options.cliPath } : {}),
        ...(options.debug !== undefined ? { debug: options.debug } : {}),
      })

      const available = await claudeService.checkAvailability()
      return { available, status: claudeService.getStatus() }
    }
  )

  // Send message (starts streaming)
  ipcMain.handle(
    'claude:send',
    async (
      event,
      message: string,
      context?: ProjectContext
    ): Promise<void> => {
      if (!claudeService) {
        throw new Error('Claude service not initialized')
      }

      const window = BrowserWindow.fromWebContents(event.sender)
      if (!window) {
        throw new Error('No window found for sender')
      }

      // Stream events to renderer
      try {
        const sendOptions = context ? { context } : undefined
        for await (const streamEvent of claudeService.sendMessage(message, sendOptions)) {
          // Check if window is still valid before sending
          if (!window.isDestroyed()) {
            window.webContents.send('claude:stream', streamEvent)
          }
        }
      } catch (error) {
        const errorEvent: StreamEvent = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }
        if (!window.isDestroyed()) {
          window.webContents.send('claude:stream', errorEvent)
        }
      }
    }
  )

  // Cancel current request
  ipcMain.handle('claude:cancel', async (): Promise<void> => {
    if (claudeService) {
      await claudeService.cancel()
    }
  })

  // Get status
  ipcMain.handle(
    'claude:status',
    (): ReturnType<ClaudeService['getStatus']> | { ready: false; state: 'idle' } => {
      return claudeService?.getStatus() ?? { ready: false, state: 'idle' }
    }
  )

  // Dispose service (called when app is closing)
  ipcMain.handle('claude:dispose', (): void => {
    if (claudeService) {
      claudeService.dispose()
      claudeService = null
    }
  })
}

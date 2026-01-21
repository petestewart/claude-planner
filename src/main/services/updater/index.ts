import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import { EventEmitter } from 'events'

export interface UpdaterOptions {
  /**
   * Enable auto-download of updates
   * Default: false (will notify user and ask for permission)
   */
  autoDownload?: boolean

  /**
   * Enable auto-install on quit
   * Default: true
   */
  autoInstallOnAppQuit?: boolean

  /**
   * Check for updates on startup
   * Default: true in production
   */
  checkOnStartup?: boolean

  /**
   * Update check interval in milliseconds
   * Default: 1 hour (3600000)
   * Set to 0 to disable periodic checks
   */
  checkInterval?: number
}

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  updateInfo?: UpdateInfo
  progress?: {
    percent: number
    bytesPerSecond: number
    total: number
    transferred: number
  }
  error?: string
}

/**
 * AutoUpdater service for managing application updates
 */
export class UpdaterService extends EventEmitter {
  private mainWindow: BrowserWindow | null = null
  private checkIntervalId: NodeJS.Timeout | null = null
  private currentStatus: UpdateStatus = { status: 'idle' }
  private options: Required<UpdaterOptions>

  constructor(options: UpdaterOptions = {}) {
    super()

    this.options = {
      autoDownload: options.autoDownload ?? false,
      autoInstallOnAppQuit: options.autoInstallOnAppQuit ?? true,
      checkOnStartup: options.checkOnStartup ?? (process.env.NODE_ENV === 'production'),
      checkInterval: options.checkInterval ?? 3600000, // 1 hour
    }

    this.setupAutoUpdater()
    this.registerIpcHandlers()
  }

  /**
   * Initialize the updater with the main window
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow

    // Check for updates on startup if enabled
    if (this.options.checkOnStartup) {
      // Delay initial check to allow app to fully load
      setTimeout(() => {
        this.checkForUpdates()
      }, 5000)
    }

    // Set up periodic update checks
    if (this.options.checkInterval > 0) {
      this.checkIntervalId = setInterval(() => {
        this.checkForUpdates()
      }, this.options.checkInterval)
    }
  }

  /**
   * Configure electron-updater
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = this.options.autoDownload
    autoUpdater.autoInstallOnAppQuit = this.options.autoInstallOnAppQuit

    // Log all events in development
    autoUpdater.logger = console

    // Event: Checking for updates
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus({ status: 'checking' })
    })

    // Event: Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.updateStatus({
        status: 'available',
        updateInfo: info,
      })
    })

    // Event: No update available
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.updateStatus({
        status: 'not-available',
        updateInfo: info,
      })
    })

    // Event: Download progress
    autoUpdater.on('download-progress', (progress) => {
      this.updateStatus({
        status: 'downloading',
        progress: {
          percent: progress.percent,
          bytesPerSecond: progress.bytesPerSecond,
          total: progress.total,
          transferred: progress.transferred,
        },
      })
    })

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.updateStatus({
        status: 'downloaded',
        updateInfo: info,
      })
    })

    // Event: Error
    autoUpdater.on('error', (error) => {
      this.updateStatus({
        status: 'error',
        error: error.message,
      })
    })
  }

  /**
   * Register IPC handlers for renderer communication
   */
  private registerIpcHandlers(): void {
    // Check for updates
    ipcMain.handle('updater:check', async () => {
      return this.checkForUpdates()
    })

    // Download update
    ipcMain.handle('updater:download', async () => {
      return this.downloadUpdate()
    })

    // Install update and restart
    ipcMain.handle('updater:install', () => {
      this.installUpdate()
    })

    // Get current status
    ipcMain.handle('updater:status', () => {
      return this.currentStatus
    })
  }

  /**
   * Update internal status and notify renderer
   */
  private updateStatus(status: UpdateStatus): void {
    this.currentStatus = status
    this.emit('status-changed', status)

    // Send to renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:status', status)
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateStatus> {
    try {
      await autoUpdater.checkForUpdates()
      return this.currentStatus
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.updateStatus({
        status: 'error',
        error: errorMessage,
      })
      return this.currentStatus
    }
  }

  /**
   * Download available update
   */
  async downloadUpdate(): Promise<void> {
    if (this.currentStatus.status !== 'available') {
      throw new Error('No update available to download')
    }

    await autoUpdater.downloadUpdate()
  }

  /**
   * Install downloaded update and restart
   */
  installUpdate(): void {
    if (this.currentStatus.status !== 'downloaded') {
      throw new Error('No downloaded update to install')
    }

    autoUpdater.quitAndInstall(false, true)
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return this.currentStatus
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }

    // Remove all IPC handlers
    ipcMain.removeHandler('updater:check')
    ipcMain.removeHandler('updater:download')
    ipcMain.removeHandler('updater:install')
    ipcMain.removeHandler('updater:status')
  }
}

// Singleton instance
let updaterService: UpdaterService | null = null

/**
 * Create and initialize the updater service
 */
export function createUpdaterService(options?: UpdaterOptions): UpdaterService {
  if (!updaterService) {
    updaterService = new UpdaterService(options)
  }
  return updaterService
}

/**
 * Get the updater service instance
 */
export function getUpdaterService(): UpdaterService | null {
  return updaterService
}

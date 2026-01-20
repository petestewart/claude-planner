import chokidar, { type FSWatcher } from 'chokidar'
import type { BrowserWindow } from 'electron'
import type { FileWatchEvent } from '../../../shared/types/file'

/**
 * Patterns to ignore when watching
 */
const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
]

type FileChangeCallback = (path: string, type: FileWatchEvent['type']) => void

class FileWatcherService {
  private watchers: Map<string, FSWatcher> = new Map()
  private mainWindow: BrowserWindow | null = null
  private callbacks: FileChangeCallback[] = []

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Register a callback to be called when files change
   * Used for features like auto-commit
   */
  onFileChange(callback: FileChangeCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index !== -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  async startWatching(dirPath: string): Promise<void> {
    // Stop existing watcher for this path if any
    await this.stopWatching(dirPath)

    const watcher = chokidar.watch(dirPath, {
      ignored: IGNORED_PATTERNS,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    })

    watcher
      .on('add', (path) => this.emitEvent('add', path))
      .on('change', (path) => this.emitEvent('change', path))
      .on('unlink', (path) => this.emitEvent('unlink', path))
      .on('addDir', (path) => this.emitEvent('addDir', path))
      .on('unlinkDir', (path) => this.emitEvent('unlinkDir', path))
      .on('error', (error) => console.error('Watcher error:', error))

    this.watchers.set(dirPath, watcher)
  }

  async stopWatching(dirPath: string): Promise<void> {
    const watcher = this.watchers.get(dirPath)
    if (watcher) {
      await watcher.close()
      this.watchers.delete(dirPath)
    }
  }

  async stopAll(): Promise<void> {
    for (const [path] of this.watchers) {
      await this.stopWatching(path)
    }
  }

  private emitEvent(
    type: FileWatchEvent['type'],
    path: string
  ): void {
    // Call registered callbacks
    for (const callback of this.callbacks) {
      try {
        callback(path, type)
      } catch (err) {
        console.error('File change callback error:', err)
      }
    }

    // Send to renderer
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const event: FileWatchEvent = {
      type,
      path,
      timestamp: new Date().toISOString(),
    }

    this.mainWindow.webContents.send('file:watch:event', event)
  }
}

export const fileWatcher = new FileWatcherService()

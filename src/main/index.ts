import { app, BrowserWindow, Menu, dialog } from 'electron'
import * as path from 'path'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerClaudeHandlers } from './ipc/claudeHandlers'
import { registerProjectHandlers } from './ipc/projectHandlers'
import { registerTemplateHandlers } from './ipc/templateHandlers'
import { registerGitHandlers } from './ipc/gitHandlers'
import { createApplicationMenu } from './menu'

let mainWindow: BrowserWindow | null = null

// Handle uncaught exceptions in main process
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in main process:', error)

  // Show error dialog to user
  dialog.showErrorBox(
    'An unexpected error occurred',
    `The application encountered an error:\n\n${error.message}\n\nThe application will continue running, but some features may not work correctly.`
  )
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)

  // Show error dialog to user
  const message = reason instanceof Error ? reason.message : String(reason)
  dialog.showErrorBox(
    'An unexpected error occurred',
    `The application encountered an error:\n\n${message}\n\nThe application will continue running, but some features may not work correctly.`
  )
})

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the renderer
  if (process.env['VITE_DEV_SERVER_URL']) {
    void mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerFileHandlers()
  registerClaudeHandlers()
  registerProjectHandlers()
  registerTemplateHandlers()
  registerGitHandlers()
  createWindow()

  // Set up application menu
  const menu = createApplicationMenu(mainWindow)
  Menu.setApplicationMenu(menu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

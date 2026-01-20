import { dialog, ipcMain, BrowserWindow } from 'electron'
import {
  listDirectory,
  readFile,
  writeFile,
  createFile,
  createDirectory,
  renameFile,
  deleteFile,
} from '../services/files/fileService'
import { fileWatcher } from '../services/files/fileWatcher'

export function registerFileHandlers(): void {
  ipcMain.handle('file:list', async (_event, dirPath: string) => {
    return listDirectory(dirPath)
  })

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return readFile(filePath)
  })

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    return writeFile(filePath, content)
  })

  ipcMain.handle('file:create', async (_event, filePath: string, content?: string) => {
    return createFile(filePath, content ?? '')
  })

  ipcMain.handle('file:rename', async (_event, oldPath: string, newPath: string) => {
    return renameFile(oldPath, newPath)
  })

  ipcMain.handle('file:delete', async (_event, filePath: string) => {
    return deleteFile(filePath)
  })

  ipcMain.handle('dir:create', async (_event, dirPath: string) => {
    return createDirectory(dirPath)
  })

  ipcMain.handle('dir:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  // File watching handlers
  ipcMain.handle('file:watch:start', async (event, dirPath: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      fileWatcher.setMainWindow(window)
    }
    return fileWatcher.startWatching(dirPath)
  })

  ipcMain.handle('file:watch:stop', async (_event, dirPath: string) => {
    return fileWatcher.stopWatching(dirPath)
  })
}

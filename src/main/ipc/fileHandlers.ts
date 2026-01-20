import { dialog, ipcMain } from 'electron'
import {
  listDirectory,
  readFile,
  writeFile,
  createDirectory,
} from '../services/files/fileService'

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

  ipcMain.handle('dir:create', async (_event, dirPath: string) => {
    return createDirectory(dirPath)
  })

  ipcMain.handle('dir:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  // Placeholder handlers for watch functionality (Phase 4)
  ipcMain.handle('file:watch:start', async (_event, _dirPath: string) => {
    // TODO: Implement file watching in Phase 4
  })

  ipcMain.handle('file:watch:stop', async (_event, _dirPath: string) => {
    // TODO: Implement file watching in Phase 4
  })
}

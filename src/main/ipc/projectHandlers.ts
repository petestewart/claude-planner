import { ipcMain } from 'electron'
import {
  loadProjectState,
  saveProjectState,
} from '../services/project'
import type { ProjectState } from '../../shared/types/project'

export function registerProjectHandlers(): void {
  /**
   * Load project state from a directory
   */
  ipcMain.handle('project:load', async (_event, path: string) => {
    return loadProjectState(path)
  })

  /**
   * Save project state to disk
   */
  ipcMain.handle('project:save', async (_event, state: ProjectState) => {
    return saveProjectState(state)
  })
}

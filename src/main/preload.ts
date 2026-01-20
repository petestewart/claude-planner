import { contextBridge, ipcRenderer } from 'electron'

import type { ElectronAPI } from '../shared/types/electron-api'

const api: ElectronAPI = {
  file: {
    read: (path: string) => ipcRenderer.invoke('file:read', path),
    write: (path: string, content: string) =>
      ipcRenderer.invoke('file:write', path, content),
    list: (path: string) => ipcRenderer.invoke('file:list', path),
    watchStart: (path: string) => ipcRenderer.invoke('file:watch:start', path),
    watchStop: (path: string) => ipcRenderer.invoke('file:watch:stop', path),
    onWatchEvent: (callback) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: Parameters<typeof callback>[0]
      ): void => {
        callback(data)
      }
      ipcRenderer.on('file:watch:event', listener)
      return () => {
        ipcRenderer.removeListener('file:watch:event', listener)
      }
    },
  },

  dir: {
    select: () => ipcRenderer.invoke('dir:select'),
    create: (path: string) => ipcRenderer.invoke('dir:create', path),
  },

  claude: {
    send: (message: string, context) =>
      ipcRenderer.invoke('claude:send', message, context),
    onStream: (callback) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        chunk: string
      ): void => {
        callback(chunk)
      }
      ipcRenderer.on('claude:stream', listener)
      return () => {
        ipcRenderer.removeListener('claude:stream', listener)
      }
    },
    cancel: () => ipcRenderer.invoke('claude:cancel'),
    getStatus: () => ipcRenderer.invoke('claude:status'),
  },

  git: {
    init: (path: string) => ipcRenderer.invoke('git:init', path),
    commit: (message: string, files: string[]) =>
      ipcRenderer.invoke('git:commit', message, files),
    status: () => ipcRenderer.invoke('git:status'),
    diff: (file?: string) => ipcRenderer.invoke('git:diff', file),
  },

  project: {
    load: (path: string) => ipcRenderer.invoke('project:load', path),
    save: (state) => ipcRenderer.invoke('project:save', state),
  },

  template: {
    list: () => ipcRenderer.invoke('template:list'),
    get: (id: string) => ipcRenderer.invoke('template:get', id),
    save: (template) => ipcRenderer.invoke('template:save', template),
  },
}

contextBridge.exposeInMainWorld('api', api)

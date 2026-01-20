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
    init: (options) => ipcRenderer.invoke('claude:init', options),
    send: (message: string, context) =>
      ipcRenderer.invoke('claude:send', message, context),
    onStream: (callback) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        event: Parameters<typeof callback>[0]
      ): void => {
        callback(event)
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
    init: (cwd: string, options?) => ipcRenderer.invoke('git:init', cwd, options),
    connect: (cwd: string, options?) => ipcRenderer.invoke('git:connect', cwd, options),
    isRepo: (cwd?: string) => ipcRenderer.invoke('git:isRepo', cwd),
    status: () => ipcRenderer.invoke('git:status'),
    stage: (files: string[]) => ipcRenderer.invoke('git:stage', files),
    stageAll: () => ipcRenderer.invoke('git:stageAll'),
    unstage: (files: string[]) => ipcRenderer.invoke('git:unstage', files),
    commit: (message: string) => ipcRenderer.invoke('git:commit', message),
    diff: (options?) => ipcRenderer.invoke('git:diff', options),
    log: (limit?: number) => ipcRenderer.invoke('git:log', limit),
    setAutoCommit: (enabled: boolean) => ipcRenderer.invoke('git:setAutoCommit', enabled),
    triggerAutoCommit: () => ipcRenderer.invoke('git:triggerAutoCommit'),
  },

  project: {
    load: (path: string) => ipcRenderer.invoke('project:load', path),
    save: (state) => ipcRenderer.invoke('project:save', state),
  },

  template: {
    list: () => ipcRenderer.invoke('template:list'),
    get: (id: string) => ipcRenderer.invoke('template:get', id),
    save: (template) => ipcRenderer.invoke('template:save', template),
    delete: (id: string) => ipcRenderer.invoke('template:delete', id),
    getCustomPath: () => ipcRenderer.invoke('template:getCustomPath'),
    getDefaultPath: () => ipcRenderer.invoke('template:getDefaultPath'),
    setCustomPath: (path: string | null) => ipcRenderer.invoke('template:setCustomPath', path),
  },
}

contextBridge.exposeInMainWorld('api', api)

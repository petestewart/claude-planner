import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  /** Auto-save delay in milliseconds */
  autoSaveDelay: number
  /** Path to Claude CLI executable */
  claudeCliPath: string
  /** Timeout for Claude requests in seconds */
  claudeTimeout: number
  /** Template for auto-generated commit messages */
  commitMessageTemplate: string
  /** Directory for custom spec templates */
  customTemplatesPath: string
}

interface SettingsActions {
  setAutoSaveDelay: (delay: number) => void
  setClaudeCliPath: (path: string) => void
  setClaudeTimeout: (timeout: number) => void
  setCommitMessageTemplate: (template: string) => void
  setCustomTemplatesPath: (path: string) => void
  resetSettings: () => void
}

type SettingsStore = SettingsState & SettingsActions

const DEFAULT_SETTINGS: SettingsState = {
  autoSaveDelay: 1000,
  claudeCliPath: 'claude',
  claudeTimeout: 120,
  commitMessageTemplate: 'Auto: {action} {file}',
  customTemplatesPath: '',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setAutoSaveDelay: (delay) =>
        set({ autoSaveDelay: Math.max(500, Math.min(10000, delay)) }),

      setClaudeCliPath: (path) => set({ claudeCliPath: path }),

      setClaudeTimeout: (timeout) =>
        set({ claudeTimeout: Math.max(30, Math.min(600, timeout)) }),

      setCommitMessageTemplate: (template) => set({ commitMessageTemplate: template }),

      setCustomTemplatesPath: (path) => set({ customTemplatesPath: path }),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    { name: 'spec-planner-settings' }
  )
)

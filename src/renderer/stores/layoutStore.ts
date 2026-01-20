import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  /** Width of left panel in pixels */
  leftPanelWidth: number
  /** Height of file browser as percentage of left panel (0-100) */
  fileBrowserHeight: number
  /** Minimum panel widths */
  minLeftPanelWidth: number
  minRightPanelWidth: number
  /** Whether panels are collapsed */
  leftPanelCollapsed: boolean
}

interface LayoutActions {
  setLeftPanelWidth: (width: number) => void
  setFileBrowserHeight: (height: number) => void
  toggleLeftPanel: () => void
  resetLayout: () => void
}

type LayoutStore = LayoutState & LayoutActions

const DEFAULT_LAYOUT: LayoutState = {
  leftPanelWidth: 500,
  fileBrowserHeight: 40,
  minLeftPanelWidth: 300,
  minRightPanelWidth: 400,
  leftPanelCollapsed: false,
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      ...DEFAULT_LAYOUT,

      setLeftPanelWidth: (width) =>
        set((state) => ({
          leftPanelWidth: Math.max(width, state.minLeftPanelWidth),
        })),

      setFileBrowserHeight: (height) =>
        set({ fileBrowserHeight: Math.min(Math.max(height, 20), 80) }),

      toggleLeftPanel: () =>
        set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),

      resetLayout: () => set(DEFAULT_LAYOUT),
    }),
    { name: 'spec-planner-layout' }
  )
)

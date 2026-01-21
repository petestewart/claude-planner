import { useLayoutStore } from '../layoutStore'

const DEFAULT_LAYOUT = {
  leftPanelWidth: 500,
  fileBrowserHeight: 40,
  minLeftPanelWidth: 300,
  minRightPanelWidth: 400,
  leftPanelCollapsed: false,
  newProjectWizardOpen: false,
  settingsModalOpen: false,
}

// Reset state before each test
beforeEach(() => {
  localStorage.clear()
  useLayoutStore.setState(DEFAULT_LAYOUT)
})

describe('layoutStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useLayoutStore.getState()

      expect(state.leftPanelWidth).toBe(500)
      expect(state.fileBrowserHeight).toBe(40)
      expect(state.minLeftPanelWidth).toBe(300)
      expect(state.minRightPanelWidth).toBe(400)
      expect(state.leftPanelCollapsed).toBe(false)
      expect(state.newProjectWizardOpen).toBe(false)
      expect(state.settingsModalOpen).toBe(false)
    })
  })

  describe('setLeftPanelWidth', () => {
    it('sets panel width', () => {
      useLayoutStore.getState().setLeftPanelWidth(600)

      expect(useLayoutStore.getState().leftPanelWidth).toBe(600)
    })

    it('enforces minimum width', () => {
      useLayoutStore.getState().setLeftPanelWidth(100)

      // Should be clamped to minLeftPanelWidth (300)
      expect(useLayoutStore.getState().leftPanelWidth).toBe(300)
    })

    it('allows width greater than minimum', () => {
      useLayoutStore.getState().setLeftPanelWidth(800)

      expect(useLayoutStore.getState().leftPanelWidth).toBe(800)
    })
  })

  describe('setFileBrowserHeight', () => {
    it('sets file browser height', () => {
      useLayoutStore.getState().setFileBrowserHeight(50)

      expect(useLayoutStore.getState().fileBrowserHeight).toBe(50)
    })

    it('enforces minimum height of 20%', () => {
      useLayoutStore.getState().setFileBrowserHeight(10)

      expect(useLayoutStore.getState().fileBrowserHeight).toBe(20)
    })

    it('enforces maximum height of 80%', () => {
      useLayoutStore.getState().setFileBrowserHeight(90)

      expect(useLayoutStore.getState().fileBrowserHeight).toBe(80)
    })

    it('allows height within bounds', () => {
      useLayoutStore.getState().setFileBrowserHeight(60)

      expect(useLayoutStore.getState().fileBrowserHeight).toBe(60)
    })
  })

  describe('toggleLeftPanel', () => {
    it('toggles left panel collapsed state', () => {
      expect(useLayoutStore.getState().leftPanelCollapsed).toBe(false)

      useLayoutStore.getState().toggleLeftPanel()
      expect(useLayoutStore.getState().leftPanelCollapsed).toBe(true)

      useLayoutStore.getState().toggleLeftPanel()
      expect(useLayoutStore.getState().leftPanelCollapsed).toBe(false)
    })
  })

  describe('resetLayout', () => {
    it('resets all layout values to defaults', () => {
      const state = useLayoutStore.getState()

      // Change all values
      state.setLeftPanelWidth(800)
      state.setFileBrowserHeight(70)
      state.toggleLeftPanel()
      state.openNewProjectWizard()
      state.openSettingsModal()

      // Verify changes
      expect(useLayoutStore.getState().leftPanelWidth).toBe(800)
      expect(useLayoutStore.getState().fileBrowserHeight).toBe(70)
      expect(useLayoutStore.getState().leftPanelCollapsed).toBe(true)
      expect(useLayoutStore.getState().newProjectWizardOpen).toBe(true)
      expect(useLayoutStore.getState().settingsModalOpen).toBe(true)

      // Reset
      state.resetLayout()

      // Verify reset
      const resetState = useLayoutStore.getState()
      expect(resetState.leftPanelWidth).toBe(500)
      expect(resetState.fileBrowserHeight).toBe(40)
      expect(resetState.leftPanelCollapsed).toBe(false)
      expect(resetState.newProjectWizardOpen).toBe(false)
      expect(resetState.settingsModalOpen).toBe(false)
    })
  })

  describe('newProjectWizard modal', () => {
    it('openNewProjectWizard opens the wizard', () => {
      useLayoutStore.getState().openNewProjectWizard()

      expect(useLayoutStore.getState().newProjectWizardOpen).toBe(true)
    })

    it('closeNewProjectWizard closes the wizard', () => {
      useLayoutStore.getState().openNewProjectWizard()
      expect(useLayoutStore.getState().newProjectWizardOpen).toBe(true)

      useLayoutStore.getState().closeNewProjectWizard()
      expect(useLayoutStore.getState().newProjectWizardOpen).toBe(false)
    })
  })

  describe('settings modal', () => {
    it('openSettingsModal opens the modal', () => {
      useLayoutStore.getState().openSettingsModal()

      expect(useLayoutStore.getState().settingsModalOpen).toBe(true)
    })

    it('closeSettingsModal closes the modal', () => {
      useLayoutStore.getState().openSettingsModal()
      expect(useLayoutStore.getState().settingsModalOpen).toBe(true)

      useLayoutStore.getState().closeSettingsModal()
      expect(useLayoutStore.getState().settingsModalOpen).toBe(false)
    })
  })

  describe('persistence', () => {
    it('persists layout to localStorage', () => {
      useLayoutStore.getState().setLeftPanelWidth(700)
      useLayoutStore.getState().toggleLeftPanel()

      const stored = JSON.parse(localStorage.getItem('spec-planner-layout') || '{}')
      expect(stored.state?.leftPanelWidth).toBe(700)
      expect(stored.state?.leftPanelCollapsed).toBe(true)
    })
  })
})

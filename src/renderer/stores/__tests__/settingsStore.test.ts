import { useSettingsStore } from '../settingsStore'

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
  // Reset the store state
  useSettingsStore.setState({
    autoSaveDelay: 1000,
    claudeCliPath: 'claude',
    claudeTimeout: 120,
    commitMessageTemplate: 'Auto: {action} {file}',
    customTemplatesPath: '',
  })
})

describe('settingsStore', () => {
  it('has correct default values', () => {
    const state = useSettingsStore.getState()

    expect(state.autoSaveDelay).toBe(1000)
    expect(state.claudeCliPath).toBe('claude')
    expect(state.claudeTimeout).toBe(120)
    expect(state.commitMessageTemplate).toBe('Auto: {action} {file}')
    expect(state.customTemplatesPath).toBe('')
  })

  it('updates autoSaveDelay with bounds', () => {
    const { setAutoSaveDelay } = useSettingsStore.getState()

    setAutoSaveDelay(2000)
    expect(useSettingsStore.getState().autoSaveDelay).toBe(2000)

    // Should enforce minimum of 500
    setAutoSaveDelay(100)
    expect(useSettingsStore.getState().autoSaveDelay).toBe(500)

    // Should enforce maximum of 10000
    setAutoSaveDelay(20000)
    expect(useSettingsStore.getState().autoSaveDelay).toBe(10000)
  })

  it('updates claudeCliPath', () => {
    const { setClaudeCliPath } = useSettingsStore.getState()

    setClaudeCliPath('/usr/local/bin/claude')
    expect(useSettingsStore.getState().claudeCliPath).toBe('/usr/local/bin/claude')
  })

  it('updates claudeTimeout with bounds', () => {
    const { setClaudeTimeout } = useSettingsStore.getState()

    setClaudeTimeout(180)
    expect(useSettingsStore.getState().claudeTimeout).toBe(180)

    // Should enforce minimum of 30
    setClaudeTimeout(10)
    expect(useSettingsStore.getState().claudeTimeout).toBe(30)

    // Should enforce maximum of 600
    setClaudeTimeout(1000)
    expect(useSettingsStore.getState().claudeTimeout).toBe(600)
  })

  it('updates commitMessageTemplate', () => {
    const { setCommitMessageTemplate } = useSettingsStore.getState()

    setCommitMessageTemplate('Update: {file}')
    expect(useSettingsStore.getState().commitMessageTemplate).toBe('Update: {file}')
  })

  it('updates customTemplatesPath', () => {
    const { setCustomTemplatesPath } = useSettingsStore.getState()

    setCustomTemplatesPath('/home/user/.templates')
    expect(useSettingsStore.getState().customTemplatesPath).toBe('/home/user/.templates')
  })

  it('resets to default values', () => {
    const state = useSettingsStore.getState()

    // Change all values
    state.setAutoSaveDelay(5000)
    state.setClaudeCliPath('/custom/claude')
    state.setClaudeTimeout(300)
    state.setCommitMessageTemplate('Custom: {file}')
    state.setCustomTemplatesPath('/custom/templates')

    // Verify changes
    expect(useSettingsStore.getState().autoSaveDelay).toBe(5000)

    // Reset
    state.resetSettings()

    // Verify reset
    const resetState = useSettingsStore.getState()
    expect(resetState.autoSaveDelay).toBe(1000)
    expect(resetState.claudeCliPath).toBe('claude')
    expect(resetState.claudeTimeout).toBe(120)
    expect(resetState.commitMessageTemplate).toBe('Auto: {action} {file}')
    expect(resetState.customTemplatesPath).toBe('')
  })

  it('persists settings to localStorage', () => {
    const { setAutoSaveDelay, setClaudeCliPath } = useSettingsStore.getState()

    setAutoSaveDelay(3000)
    setClaudeCliPath('/custom/path')

    // Check localStorage was updated
    const stored = JSON.parse(localStorage.getItem('spec-planner-settings') || '{}')
    expect(stored.state?.autoSaveDelay).toBe(3000)
    expect(stored.state?.claudeCliPath).toBe('/custom/path')
  })
})

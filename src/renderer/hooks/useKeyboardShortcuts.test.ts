import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { useLayoutStore } from '../stores/layoutStore'
import { useEditorStore } from '../stores/editorStore'

// Mock the stores
jest.mock('../stores/layoutStore')
jest.mock('../stores/editorStore')

const mockUseLayoutStore = useLayoutStore as jest.MockedFunction<typeof useLayoutStore>
const mockUseEditorStore = useEditorStore as jest.MockedFunction<typeof useEditorStore>

describe('useKeyboardShortcuts', () => {
  const mockToggleLeftPanel = jest.fn()
  const mockOpenSettingsModal = jest.fn()
  const mockSaveActiveFile = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLayoutStore.mockImplementation((selector) => {
      const state = {
        toggleLeftPanel: mockToggleLeftPanel,
        openSettingsModal: mockOpenSettingsModal,
      }
      return selector ? selector(state as never) : state
    })
    mockUseEditorStore.mockImplementation((selector) => {
      const state = {
        saveActiveFile: mockSaveActiveFile,
      }
      return selector ? selector(state as never) : state
    })
  })

  afterEach(() => {
    // Clean up any event listeners
    jest.restoreAllMocks()
  })

  const createKeyboardEvent = (
    key: string,
    modifiers: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}
  ): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key,
      metaKey: modifiers.metaKey ?? false,
      ctrlKey: modifiers.ctrlKey ?? false,
      shiftKey: modifiers.shiftKey ?? false,
      altKey: modifiers.altKey ?? false,
      bubbles: true,
    })
  }

  it('should register event listeners on mount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
    renderHook(() => useKeyboardShortcuts())
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useKeyboardShortcuts())
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should call toggleLeftPanel on Cmd+B (Mac)', () => {
    // Mock Mac platform
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true })

    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent('b', { metaKey: true }))

    expect(mockToggleLeftPanel).toHaveBeenCalled()
  })

  it('should call toggleLeftPanel on Ctrl+B (non-Mac)', () => {
    // Mock Windows platform
    Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true })

    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent('b', { ctrlKey: true }))

    expect(mockToggleLeftPanel).toHaveBeenCalled()
  })

  it('should call saveActiveFile on Cmd+S (Mac)', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true })

    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent('s', { metaKey: true }))

    expect(mockSaveActiveFile).toHaveBeenCalled()
  })

  it('should call openSettingsModal on Cmd+, (Mac)', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true })

    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent(',', { metaKey: true }))

    expect(mockOpenSettingsModal).toHaveBeenCalled()
  })

  it('should not trigger shortcuts without modifier keys', () => {
    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent('b'))

    expect(mockToggleLeftPanel).not.toHaveBeenCalled()
  })

  it('should not trigger shortcuts with wrong modifier key', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true })

    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent('b', { altKey: true }))

    expect(mockToggleLeftPanel).not.toHaveBeenCalled()
  })

  it('should handle case-insensitive key matching', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true })

    renderHook(() => useKeyboardShortcuts())
    document.dispatchEvent(createKeyboardEvent('B', { metaKey: true }))

    expect(mockToggleLeftPanel).toHaveBeenCalled()
  })
})

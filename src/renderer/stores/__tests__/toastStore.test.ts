import { useToastStore } from '../toastStore'

// Clear state before each test
beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('toastStore', () => {
  it('starts with empty toasts', () => {
    const state = useToastStore.getState()
    expect(state.toasts).toEqual([])
  })

  it('adds a toast', () => {
    const { addToast } = useToastStore.getState()

    const id = addToast({ type: 'info', message: 'Test message' })

    const state = useToastStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0]).toMatchObject({
      id,
      type: 'info',
      message: 'Test message',
    })
  })

  it('removes a toast', () => {
    const { addToast, removeToast } = useToastStore.getState()

    const id = addToast({ type: 'info', message: 'Test' })
    expect(useToastStore.getState().toasts).toHaveLength(1)

    removeToast(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('clears all toasts', () => {
    const state = useToastStore.getState()

    state.addToast({ type: 'info', message: 'Test 1' })
    state.addToast({ type: 'success', message: 'Test 2' })
    expect(useToastStore.getState().toasts).toHaveLength(2)

    state.clearToasts()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('shows info toast', () => {
    const { showInfo } = useToastStore.getState()

    showInfo('Info message')

    const state = useToastStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0]).toMatchObject({
      type: 'info',
      message: 'Info message',
    })
  })

  it('shows success toast', () => {
    const { showSuccess } = useToastStore.getState()

    showSuccess('Success message')

    const state = useToastStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Success message',
    })
  })

  it('shows warning toast', () => {
    const { showWarning } = useToastStore.getState()

    showWarning('Warning message')

    const state = useToastStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0]).toMatchObject({
      type: 'warning',
      message: 'Warning message',
    })
  })

  it('shows error toast', () => {
    const { showError } = useToastStore.getState()

    showError('Error message')

    const state = useToastStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Error message',
    })
  })

  it('adds toast with custom duration', () => {
    const { addToast } = useToastStore.getState()

    addToast({ type: 'info', message: 'Test', duration: 10000 })

    const state = useToastStore.getState()
    expect(state.toasts[0]?.duration).toBe(10000)
  })

  it('generates unique IDs for toasts', () => {
    const { addToast } = useToastStore.getState()

    const id1 = addToast({ type: 'info', message: 'Test 1' })
    const id2 = addToast({ type: 'info', message: 'Test 2' })

    expect(id1).not.toBe(id2)
  })
})

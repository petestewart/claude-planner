import { render, screen, fireEvent } from '@testing-library/react'
import { ToastContainer } from './Toast'
import { useToastStore } from '../../stores/toastStore'
import type { Toast as ToastType } from '../../stores/toastStore'

// Mock CSS modules
jest.mock('./toast.module.css', () => ({
  container: 'container',
  toast: 'toast',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  icon: 'icon',
  content: 'content',
  message: 'message',
  closeButton: 'closeButton',
}))

// Mock the toast store
jest.mock('../../stores/toastStore')

const mockUseToastStore = useToastStore as jest.MockedFunction<
  typeof useToastStore
>

describe('ToastContainer', () => {
  const mockRemoveToast = jest.fn()
  const mockAddToast = jest.fn()
  const mockClearToasts = jest.fn()
  const mockShowInfo = jest.fn()
  const mockShowSuccess = jest.fn()
  const mockShowWarning = jest.fn()
  const mockShowError = jest.fn()

  const createMockState = (toasts: ToastType[]) => ({
    toasts,
    removeToast: mockRemoveToast,
    addToast: mockAddToast,
    clearToasts: mockClearToasts,
    showInfo: mockShowInfo,
    showSuccess: mockShowSuccess,
    showWarning: mockShowWarning,
    showError: mockShowError,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState([]))
    })
  })

  it('returns null when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a single toast', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'info', message: 'Test message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders multiple toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'info', message: 'Message 1', duration: 3000 },
      { id: '2', type: 'success', message: 'Message 2', duration: 3000 },
      { id: '3', type: 'error', message: 'Message 3', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    expect(screen.getByText('Message 1')).toBeInTheDocument()
    expect(screen.getByText('Message 2')).toBeInTheDocument()
    expect(screen.getByText('Message 3')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(3)
  })

  it('displays info icon for info toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'info', message: 'Info message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    expect(screen.getByText('\u2139')).toBeInTheDocument() // info symbol
  })

  it('displays checkmark icon for success toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'success', message: 'Success message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    expect(screen.getByText('\u2713')).toBeInTheDocument() // checkmark
  })

  it('displays warning icon for warning toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'warning', message: 'Warning message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    expect(screen.getByText('\u26A0')).toBeInTheDocument() // warning symbol
  })

  it('displays cross icon for error toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'error', message: 'Error message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    expect(screen.getByText('\u2717')).toBeInTheDocument() // cross mark
  })

  it('calls removeToast when close button is clicked', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'info', message: 'Test message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    const closeButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(closeButton)

    expect(mockRemoveToast).toHaveBeenCalledWith('1')
  })

  it('applies correct CSS class for toast type', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'error', message: 'Error message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    const { container } = render(<ToastContainer />)

    const toast = container.querySelector('.error')
    expect(toast).toBeInTheDocument()
  })

  it('has correct ARIA attributes for error toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'error', message: 'Error message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })

  it('has correct ARIA attributes for non-error toasts', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'info', message: 'Info message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('container has notifications label', () => {
    const toasts: ToastType[] = [
      { id: '1', type: 'info', message: 'Test message', duration: 3000 },
    ]

    mockUseToastStore.mockImplementation((selector) => {
      return selector(createMockState(toasts))
    })

    render(<ToastContainer />)

    const container = screen.getByLabelText('Notifications')
    expect(container).toBeInTheDocument()
  })
})

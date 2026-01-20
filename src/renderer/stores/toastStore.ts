import { create } from 'zustand'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  showInfo: (message: string, duration?: number) => string
  showSuccess: (message: string, duration?: number) => string
  showWarning: (message: string, duration?: number) => string
  showError: (message: string, duration?: number) => string
}

type ToastStore = ToastState & ToastActions

const DEFAULT_DURATION = 5000

function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration ?? DEFAULT_DURATION,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },

  showInfo: (message, duration) => {
    const toast = duration !== undefined
      ? { type: 'info' as const, message, duration }
      : { type: 'info' as const, message }
    return get().addToast(toast)
  },

  showSuccess: (message, duration) => {
    const toast = duration !== undefined
      ? { type: 'success' as const, message, duration }
      : { type: 'success' as const, message }
    return get().addToast(toast)
  },

  showWarning: (message, duration) => {
    const toast = duration !== undefined
      ? { type: 'warning' as const, message, duration }
      : { type: 'warning' as const, message }
    return get().addToast(toast)
  },

  showError: (message, duration) => {
    const toast = duration !== undefined
      ? { type: 'error' as const, message, duration }
      : { type: 'error' as const, message }
    return get().addToast(toast)
  },
}))

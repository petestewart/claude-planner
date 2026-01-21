import { render, screen } from '@testing-library/react'
import { App } from './App'

// Mock all child components to avoid complex dependency chains
jest.mock('./components/layout/Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar">Toolbar</div>,
}))

jest.mock('./components/layout/MainLayout', () => ({
  MainLayout: () => <div data-testid="main-layout">MainLayout</div>,
}))

jest.mock('./components/layout/StatusBar', () => ({
  StatusBar: () => <div data-testid="status-bar">StatusBar</div>,
}))

jest.mock('./components/templates', () => ({
  NewProjectWizard: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="new-project-wizard">NewProjectWizard</div> : null,
}))

jest.mock('./components/settings', () => ({
  SettingsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="settings-modal">SettingsModal</div> : null,
}))

jest.mock('./components/common', () => ({
  ToastContainer: () => <div data-testid="toast-container">ToastContainer</div>,
}))

// Mock hooks
jest.mock('./hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}))

// Mock stores
jest.mock('./stores/layoutStore', () => ({
  useLayoutStore: jest.fn((selector) => {
    const state = {
      newProjectWizardOpen: false,
      closeNewProjectWizard: jest.fn(),
      settingsModalOpen: false,
      closeSettingsModal: jest.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

jest.mock('./stores/projectStore', () => ({
  useProjectStore: jest.fn((selector) => {
    const state = {
      createProject: jest.fn(),
      setTemplateId: jest.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

jest.mock('./stores/fileStore', () => ({
  useFileStore: jest.fn((selector) => {
    const state = {
      setRootPath: jest.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

describe('App', () => {
  it('renders the main application structure', () => {
    render(<App />)

    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('main-layout')).toBeInTheDocument()
    expect(screen.getByTestId('status-bar')).toBeInTheDocument()
    expect(screen.getByTestId('toast-container')).toBeInTheDocument()
  })

  it('renders with app class wrapper', () => {
    const { container } = render(<App />)

    const appDiv = container.querySelector('.app')
    expect(appDiv).toBeInTheDocument()
  })

  it('does not show new project wizard when closed', () => {
    render(<App />)
    expect(screen.queryByTestId('new-project-wizard')).not.toBeInTheDocument()
  })

  it('does not show settings modal when closed', () => {
    render(<App />)
    expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument()
  })
})

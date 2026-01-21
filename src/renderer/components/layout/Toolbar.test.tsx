import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Toolbar } from './Toolbar'
import { useFileStore } from '../../stores/fileStore'
import { useLayoutStore } from '../../stores/layoutStore'

// Mock the stores
jest.mock('../../stores/fileStore')
jest.mock('../../stores/layoutStore')

// Mock CSS module
jest.mock('./Toolbar.module.css', () => ({
  toolbar: 'toolbar',
  actions: 'actions',
  button: 'button',
  title: 'title',
  projectName: 'projectName',
  iconButton: 'iconButton',
}))

const mockUseFileStore = useFileStore as jest.MockedFunction<typeof useFileStore>
const mockUseLayoutStore = useLayoutStore as jest.MockedFunction<typeof useLayoutStore>

describe('Toolbar', () => {
  const mockSetRootPath = jest.fn()
  const mockOpenNewProjectWizard = jest.fn()
  const mockOpenSettingsModal = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFileStore.mockImplementation((selector) => {
      const state = { setRootPath: mockSetRootPath }
      return selector ? selector(state as never) : state
    })
    mockUseLayoutStore.mockImplementation((selector) => {
      const state = {
        openNewProjectWizard: mockOpenNewProjectWizard,
        openSettingsModal: mockOpenSettingsModal,
      }
      return selector ? selector(state as never) : state
    })
  })

  it('renders the toolbar header', () => {
    render(<Toolbar />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('displays the application title', () => {
    render(<Toolbar />)
    expect(screen.getByText('Spec Planner')).toBeInTheDocument()
  })

  it('renders New Project button', () => {
    render(<Toolbar />)
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
  })

  it('renders Open button', () => {
    render(<Toolbar />)
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
  })

  it('renders Settings button', () => {
    render(<Toolbar />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('calls openNewProjectWizard when New Project is clicked', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(mockOpenNewProjectWizard).toHaveBeenCalled()
  })

  it('calls openSettingsModal when Settings is clicked', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(mockOpenSettingsModal).toHaveBeenCalled()
  })

  it('calls dir.select and setRootPath when Open is clicked and path is selected', async () => {
    const mockPath = '/test/project'
    ;(window.api.dir.select as jest.Mock).mockResolvedValue(mockPath)

    render(<Toolbar />)
    fireEvent.click(screen.getByRole('button', { name: /open/i }))

    await waitFor(() => {
      expect(window.api.dir.select).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockSetRootPath).toHaveBeenCalledWith(mockPath)
    })
  })

  it('does not call setRootPath when Open is clicked but no path is selected', async () => {
    ;(window.api.dir.select as jest.Mock).mockResolvedValue(null)

    render(<Toolbar />)
    fireEvent.click(screen.getByRole('button', { name: /open/i }))

    await waitFor(() => {
      expect(window.api.dir.select).toHaveBeenCalled()
    })

    expect(mockSetRootPath).not.toHaveBeenCalled()
  })

  it('has proper title attributes on buttons', () => {
    render(<Toolbar />)
    expect(screen.getByTitle('Create new project')).toBeInTheDocument()
    expect(screen.getByTitle('Open existing project')).toBeInTheDocument()
    expect(screen.getByTitle('Settings')).toBeInTheDocument()
  })
})
